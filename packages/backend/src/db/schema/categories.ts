import { pgTable, uuid, varchar, timestamp } from 'drizzle-orm/pg-core';
import { users } from './users.js';

export const categories = pgTable('categories', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 255 }).notNull(),
  type: varchar('type', { length: 20 }).notNull().default('expense'),
  icon: varchar('icon', { length: 50 }).notNull().default('tag'),
  color: varchar('color', { length: 7 }).notNull().default('#FFD700'),
  parentId: uuid('parent_id'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});
