import { eq, and, sql } from 'drizzle-orm';
import { accounts, transactions } from '../db/schema.js';
import type { FastifyInstance } from 'fastify';

// Saldo computado: opening_balance (campo `balance` no DB) + soma das transações pagas.
// Single source of truth = transações. Apagar/editar tx nunca desalinha.
const computedBalance = sql<string>`(
  ${accounts.balance}::numeric
  + COALESCE((
    SELECT SUM(CASE
      WHEN ${transactions.isPaid} AND ${transactions.type} = 'income'   AND ${transactions.accountId}   = ${accounts.id} THEN  ${transactions.amount}
      WHEN ${transactions.isPaid} AND ${transactions.type} = 'expense'  AND ${transactions.accountId}   = ${accounts.id} THEN -${transactions.amount}
      WHEN ${transactions.isPaid} AND ${transactions.type} = 'transfer' AND ${transactions.accountId}   = ${accounts.id} THEN -${transactions.amount}
      WHEN ${transactions.isPaid} AND ${transactions.type} = 'transfer' AND ${transactions.toAccountId} = ${accounts.id} THEN  ${transactions.amount}
      ELSE 0 END)
    FROM ${transactions}
    WHERE ${transactions.accountId} = ${accounts.id} OR ${transactions.toAccountId} = ${accounts.id}
  ), 0)
)::text`;

const accountSelection = {
  id: accounts.id,
  userId: accounts.userId,
  name: accounts.name,
  type: accounts.type,
  balance: computedBalance,
  color: accounts.color,
  institution: accounts.institution,
  pluggyItemId: accounts.pluggyItemId,
  pluggyAccountId: accounts.pluggyAccountId,
  isActive: accounts.isActive,
  createdAt: accounts.createdAt,
  updatedAt: accounts.updatedAt,
};

export async function getAccounts(app: FastifyInstance, userId: string) {
  return app.db.select(accountSelection).from(accounts).where(eq(accounts.userId, userId));
}

export async function getAccountById(app: FastifyInstance, userId: string, id: string) {
  const [account] = await app.db.select(accountSelection).from(accounts)
    .where(and(eq(accounts.id, id), eq(accounts.userId, userId)));
  return account;
}

export async function createAccount(app: FastifyInstance, userId: string, data: {
  name: string;
  type: string;
  balance: number;
  color?: string;
  institution?: string;
}) {
  const [created] = await app.db.insert(accounts).values({
    userId,
    name: data.name,
    type: data.type,
    balance: String(data.balance), // saldo inicial
    color: data.color || '#FFD700',
    institution: data.institution || null,
  }).returning({ id: accounts.id });
  return getAccountById(app, userId, created.id);
}

export async function updateAccount(app: FastifyInstance, userId: string, id: string, data: {
  name?: string;
  type?: string;
  balance?: number;
  color?: string;
  institution?: string;
  isActive?: boolean;
}) {
  const values: Record<string, unknown> = { updatedAt: new Date() };
  if (data.name !== undefined) values.name = data.name;
  if (data.type !== undefined) values.type = data.type;
  // Atualizar "saldo" = redefinir saldo inicial. O total recalcula automaticamente
  // a partir das transações. Se o usuário quer que o saldo total fique X, gravamos
  // openingBalance = X - somaDasTransacoes.
  if (data.balance !== undefined) {
    const [agg] = await app.db.select({
      sum: sql<string>`COALESCE(SUM(CASE
        WHEN ${transactions.isPaid} AND ${transactions.type} = 'income'   AND ${transactions.accountId}   = ${id} THEN  ${transactions.amount}
        WHEN ${transactions.isPaid} AND ${transactions.type} = 'expense'  AND ${transactions.accountId}   = ${id} THEN -${transactions.amount}
        WHEN ${transactions.isPaid} AND ${transactions.type} = 'transfer' AND ${transactions.accountId}   = ${id} THEN -${transactions.amount}
        WHEN ${transactions.isPaid} AND ${transactions.type} = 'transfer' AND ${transactions.toAccountId} = ${id} THEN  ${transactions.amount}
        ELSE 0 END), 0)::text`,
    }).from(transactions).where(sql`${transactions.accountId} = ${id} OR ${transactions.toAccountId} = ${id}`);
    const txSum = Number(agg?.sum ?? 0);
    values.balance = String(data.balance - txSum);
  }
  if (data.color !== undefined) values.color = data.color;
  if (data.institution !== undefined) values.institution = data.institution;
  if (data.isActive !== undefined) values.isActive = data.isActive;

  await app.db.update(accounts).set(values)
    .where(and(eq(accounts.id, id), eq(accounts.userId, userId)));
  return getAccountById(app, userId, id);
}

export async function deleteAccount(app: FastifyInstance, userId: string, id: string) {
  const [account] = await app.db.delete(accounts)
    .where(and(eq(accounts.id, id), eq(accounts.userId, userId)))
    .returning();
  return account;
}
