import { eq, and, gte, lte, ilike, sql, desc } from 'drizzle-orm';
import { transactions } from '../db/schema.js';
import type { FastifyInstance } from 'fastify';
import type { TransactionFilters } from '@duckfinance/shared';
import { checkBudgetAlerts } from './budget.service.js';

export async function getTransactions(app: FastifyInstance, userId: string, filters: TransactionFilters) {
  const page = filters.page || 1;
  const limit = filters.limit || 20;
  const offset = (page - 1) * limit;

  const conditions = [eq(transactions.userId, userId)];
  if (filters.accountId) conditions.push(eq(transactions.accountId, filters.accountId));
  if (filters.categoryId) conditions.push(eq(transactions.categoryId, filters.categoryId));
  if (filters.creditCardId) conditions.push(eq(transactions.creditCardId, filters.creditCardId));
  if (filters.type) conditions.push(eq(transactions.type, filters.type));
  if (filters.startDate) conditions.push(gte(transactions.date, filters.startDate));
  if (filters.endDate) conditions.push(lte(transactions.date, filters.endDate));
  if (filters.isPaid !== undefined) conditions.push(eq(transactions.isPaid, filters.isPaid));
  if (filters.search) conditions.push(ilike(transactions.description, `%${filters.search}%`));

  const where = and(...conditions);

  const [data, countResult] = await Promise.all([
    app.db.select().from(transactions).where(where!)
      .orderBy(desc(transactions.date))
      .limit(limit).offset(offset),
    app.db.select({ count: sql<number>`count(*)::int` }).from(transactions).where(where!),
  ]);

  const total = countResult[0]?.count || 0;
  return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
}

export async function createTransaction(app: FastifyInstance, userId: string, data: {
  accountId: string;
  toAccountId?: string;
  categoryId?: string;
  creditCardId?: string;
  type: string;
  amount: number;
  description: string;
  date: string;
  isPaid?: boolean;
  isRecurring?: boolean;
  notes?: string;
}) {
  const isPaid = data.isPaid ?? true;

  // ── Transfer: validações específicas + débito/crédito atômico ──
  if (data.type === 'transfer') {
    if (!data.toAccountId) {
      throw new Error('Transferência requer conta de destino');
    }
    if (data.toAccountId === data.accountId) {
      throw new Error('Conta de origem e destino não podem ser iguais');
    }

    const [transaction] = await app.db.insert(transactions).values({
      userId,
      accountId: data.accountId,
      toAccountId: data.toAccountId,
      categoryId: null,
      creditCardId: null,
      type: 'transfer',
      amount: String(data.amount),
      description: data.description,
      date: data.date,
      isPaid,
      isRecurring: data.isRecurring ?? false,
      notes: data.notes || null,
    }).returning();

    return transaction;
  }

  // ── Income / Expense ──
  const [transaction] = await app.db.insert(transactions).values({
    userId,
    accountId: data.accountId,
    toAccountId: null,
    categoryId: data.categoryId || null,
    creditCardId: data.creditCardId || null,
    type: data.type,
    amount: String(data.amount),
    description: data.description,
    date: data.date,
    isPaid,
    isRecurring: data.isRecurring ?? false,
    notes: data.notes || null,
  }).returning();

  if (data.type === 'expense' && data.categoryId) {
    const txDate = new Date(data.date);
    const month = txDate.getMonth() + 1;
    const year = txDate.getFullYear();
    checkBudgetAlerts(app, userId, data.categoryId, month, year).catch(() => {});
  }

  return transaction;
}

export async function updateTransaction(app: FastifyInstance, userId: string, id: string, data: {
  accountId?: string;
  toAccountId?: string | null;
  categoryId?: string | null;
  creditCardId?: string | null;
  type?: string;
  amount?: number;
  description?: string;
  date?: string;
  isPaid?: boolean;
  isRecurring?: boolean;
  notes?: string | null;
}) {
  const [existing] = await app.db.select().from(transactions)
    .where(and(eq(transactions.id, id), eq(transactions.userId, userId)));
  if (!existing) return null;

  const values: Record<string, unknown> = { updatedAt: new Date() };
  if (data.accountId !== undefined) values.accountId = data.accountId;
  if (data.toAccountId !== undefined) values.toAccountId = data.toAccountId;
  if (data.categoryId !== undefined) values.categoryId = data.categoryId;
  if (data.creditCardId !== undefined) values.creditCardId = data.creditCardId;
  if (data.type !== undefined) values.type = data.type;
  if (data.amount !== undefined) values.amount = String(data.amount);
  if (data.description !== undefined) values.description = data.description;
  if (data.date !== undefined) values.date = data.date;
  if (data.isPaid !== undefined) values.isPaid = data.isPaid;
  if (data.isRecurring !== undefined) values.isRecurring = data.isRecurring;
  if (data.notes !== undefined) values.notes = data.notes;

  const [transaction] = await app.db.update(transactions).set(values)
    .where(and(eq(transactions.id, id), eq(transactions.userId, userId)))
    .returning();
  return transaction;
}

export async function deleteTransaction(app: FastifyInstance, userId: string, id: string) {
  const [existing] = await app.db.select().from(transactions)
    .where(and(eq(transactions.id, id), eq(transactions.userId, userId)));

  if (!existing) return null;

  const [transaction] = await app.db.delete(transactions)
    .where(and(eq(transactions.id, id), eq(transactions.userId, userId)))
    .returning();
  return transaction;
}
