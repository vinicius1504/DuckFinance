import { eq, and } from 'drizzle-orm';
import { categories } from '../db/schema.js';
import type { FastifyInstance } from 'fastify';

export async function getCategories(app: FastifyInstance, userId: string) {
  return app.db.select().from(categories).where(eq(categories.userId, userId));
}

export async function getCategoryById(app: FastifyInstance, userId: string, id: string) {
  const [category] = await app.db.select().from(categories)
    .where(and(eq(categories.id, id), eq(categories.userId, userId)));
  return category;
}

export async function createCategory(app: FastifyInstance, userId: string, data: {
  name: string;
  type: string;
  icon?: string;
  color?: string;
  parentId?: string;
}) {
  const [category] = await app.db.insert(categories).values({
    userId,
    name: data.name,
    type: data.type,
    icon: data.icon || 'tag',
    color: data.color || '#FFD700',
    parentId: data.parentId || null,
  }).returning();
  return category;
}

export async function updateCategory(app: FastifyInstance, userId: string, id: string, data: {
  name?: string;
  type?: string;
  icon?: string;
  color?: string;
  parentId?: string | null;
}) {
  const values: Record<string, unknown> = {};
  if (data.name !== undefined) values.name = data.name;
  if (data.type !== undefined) values.type = data.type;
  if (data.icon !== undefined) values.icon = data.icon;
  if (data.color !== undefined) values.color = data.color;
  if (data.parentId !== undefined) values.parentId = data.parentId;

  const [category] = await app.db.update(categories).set(values)
    .where(and(eq(categories.id, id), eq(categories.userId, userId)))
    .returning();
  return category;
}

export async function deleteCategory(app: FastifyInstance, userId: string, id: string) {
  const [category] = await app.db.delete(categories)
    .where(and(eq(categories.id, id), eq(categories.userId, userId)))
    .returning();
  return category;
}
