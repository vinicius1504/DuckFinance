import { eq, and } from 'drizzle-orm';
import { accounts } from '../db/schema.js';
import type { FastifyInstance } from 'fastify';

export async function getAccounts(app: FastifyInstance, userId: string) {
  return app.db.select().from(accounts).where(eq(accounts.userId, userId));
}

export async function getAccountById(app: FastifyInstance, userId: string, id: string) {
  const [account] = await app.db.select().from(accounts)
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
  const [account] = await app.db.insert(accounts).values({
    userId,
    name: data.name,
    type: data.type,
    balance: String(data.balance),
    color: data.color || '#FFD700',
    institution: data.institution || null,
  }).returning();
  return account;
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
  if (data.balance !== undefined) values.balance = String(data.balance);
  if (data.color !== undefined) values.color = data.color;
  if (data.institution !== undefined) values.institution = data.institution;
  if (data.isActive !== undefined) values.isActive = data.isActive;

  const [account] = await app.db.update(accounts).set(values)
    .where(and(eq(accounts.id, id), eq(accounts.userId, userId)))
    .returning();
  return account;
}

export async function deleteAccount(app: FastifyInstance, userId: string, id: string) {
  const [account] = await app.db.delete(accounts)
    .where(and(eq(accounts.id, id), eq(accounts.userId, userId)))
    .returning();
  return account;
}
