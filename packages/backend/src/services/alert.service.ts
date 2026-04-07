import { eq, and, desc, sql } from 'drizzle-orm';
import { alerts } from '../db/schema.js';
import type { FastifyInstance } from 'fastify';

export async function getAlerts(app: FastifyInstance, userId: string, filters?: {
  isRead?: boolean;
  type?: string;
  page?: number;
  limit?: number;
}) {
  const page = filters?.page || 1;
  const limit = filters?.limit || 20;
  const offset = (page - 1) * limit;

  const conditions = [eq(alerts.userId, userId)];
  if (filters?.isRead !== undefined) conditions.push(eq(alerts.isRead, filters.isRead));
  if (filters?.type) conditions.push(eq(alerts.type, filters.type));

  const where = and(...conditions);

  const [data, countResult] = await Promise.all([
    app.db.select().from(alerts).where(where!)
      .orderBy(desc(alerts.triggerDate))
      .limit(limit).offset(offset),
    app.db.select({ count: sql<number>`count(*)::int` }).from(alerts).where(where!),
  ]);

  const total = countResult[0]?.count || 0;
  return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
}

export async function getUnreadCount(app: FastifyInstance, userId: string) {
  const [result] = await app.db
    .select({ count: sql<number>`count(*)::int` })
    .from(alerts)
    .where(and(eq(alerts.userId, userId), eq(alerts.isRead, false)));
  return { count: result?.count || 0 };
}

export async function createAlert(app: FastifyInstance, userId: string, data: {
  type: string;
  title: string;
  message: string;
  referenceId?: string;
  triggerDate: string;
}) {
  const [alert] = await app.db.insert(alerts).values({
    userId,
    type: data.type,
    title: data.title,
    message: data.message,
    referenceId: data.referenceId || null,
    triggerDate: new Date(data.triggerDate),
  }).returning();
  return alert;
}

export async function markAsRead(app: FastifyInstance, userId: string, id: string) {
  const [alert] = await app.db
    .update(alerts)
    .set({ isRead: true })
    .where(and(eq(alerts.id, id), eq(alerts.userId, userId)))
    .returning();
  return alert;
}

export async function markAllAsRead(app: FastifyInstance, userId: string) {
  await app.db
    .update(alerts)
    .set({ isRead: true })
    .where(and(eq(alerts.userId, userId), eq(alerts.isRead, false)));
  return { success: true };
}

export async function deleteAlert(app: FastifyInstance, userId: string, id: string) {
  const [alert] = await app.db
    .delete(alerts)
    .where(and(eq(alerts.id, id), eq(alerts.userId, userId)))
    .returning();
  return alert;
}
