import { eq, desc } from 'drizzle-orm';
import { chatMessages } from '../db/schema.js';
import type { FastifyInstance } from 'fastify';

export async function getHistory(app: FastifyInstance, userId: string, limit: number = 50) {
  const messages = await app.db
    .select()
    .from(chatMessages)
    .where(eq(chatMessages.userId, userId))
    .orderBy(desc(chatMessages.createdAt))
    .limit(limit);

  return messages.reverse();
}

export async function saveMessage(app: FastifyInstance, userId: string, role: string, content: string) {
  const [message] = await app.db.insert(chatMessages).values({
    userId,
    role,
    content,
  }).returning();
  return message;
}

export async function clearHistory(app: FastifyInstance, userId: string) {
  await app.db.delete(chatMessages).where(eq(chatMessages.userId, userId));
}
