import { eq, and, sql, desc, gte, lte } from 'drizzle-orm';
import { transactions, categories, accounts } from '../db/schema.js';
import type { FastifyInstance } from 'fastify';

export async function getCategoryBreakdown(app: FastifyInstance, userId: string, startDate: string, endDate: string, type?: string) {
  const conditions = [
    eq(transactions.userId, userId),
    gte(transactions.date, startDate),
    lte(transactions.date, endDate),
  ];
  if (type) conditions.push(eq(transactions.type, type));

  const data = await app.db
    .select({
      categoryId: categories.id,
      categoryName: categories.name,
      categoryColor: categories.color,
      total: sql<string>`SUM(${transactions.amount})`,
      count: sql<number>`count(*)::int`,
    })
    .from(transactions)
    .innerJoin(categories, eq(transactions.categoryId, categories.id))
    .where(and(...conditions))
    .groupBy(categories.id, categories.name, categories.color)
    .orderBy(desc(sql`SUM(${transactions.amount})`));

  return data.map((d) => ({
    categoryId: d.categoryId,
    categoryName: d.categoryName,
    categoryColor: d.categoryColor,
    total: Number(d.total),
    count: d.count,
  }));
}

export async function getCashFlow(app: FastifyInstance, userId: string, startDate: string, endDate: string) {
  const data = await app.db
    .select({
      date: transactions.date,
      type: transactions.type,
      total: sql<string>`SUM(${transactions.amount})`,
    })
    .from(transactions)
    .where(
      and(
        eq(transactions.userId, userId),
        gte(transactions.date, startDate),
        lte(transactions.date, endDate),
      ),
    )
    .groupBy(transactions.date, transactions.type)
    .orderBy(transactions.date);

  // Pivot into per-date income/expense
  const dateMap: Record<string, { date: string; income: number; expense: number }> = {};
  for (const row of data) {
    if (!dateMap[row.date]) dateMap[row.date] = { date: row.date, income: 0, expense: 0 };
    if (row.type === 'income') dateMap[row.date].income = Number(row.total);
    else if (row.type === 'expense') dateMap[row.date].expense = Number(row.total);
  }

  return Object.values(dateMap).sort((a, b) => a.date.localeCompare(b.date));
}

export async function exportCsv(app: FastifyInstance, userId: string, startDate: string, endDate: string) {
  const data = await app.db
    .select({
      date: transactions.date,
      description: transactions.description,
      type: transactions.type,
      amount: transactions.amount,
      isPaid: transactions.isPaid,
      categoryName: categories.name,
      accountName: accounts.name,
    })
    .from(transactions)
    .leftJoin(categories, eq(transactions.categoryId, categories.id))
    .innerJoin(accounts, eq(transactions.accountId, accounts.id))
    .where(
      and(
        eq(transactions.userId, userId),
        gte(transactions.date, startDate),
        lte(transactions.date, endDate),
      ),
    )
    .orderBy(transactions.date);

  const header = 'Data,Descricao,Tipo,Valor,Pago,Categoria,Conta\n';
  const rows = data.map((r) =>
    `${r.date},"${r.description}",${r.type},${r.amount},${r.isPaid ? 'Sim' : 'Nao'},"${r.categoryName || ''}","${r.accountName}"`,
  ).join('\n');

  return header + rows;
}
