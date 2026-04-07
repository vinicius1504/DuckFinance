import { pgTable, uuid, varchar, numeric, boolean, timestamp } from 'drizzle-orm/pg-core';
import { users } from './users.js';
import { pluggyItems } from './pluggy-items.js';

export const accounts = pgTable('accounts', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 255 }).notNull(),
  type: varchar('type', { length: 50 }).notNull().default('checking'),
  balance: numeric('balance', { precision: 15, scale: 2 }).notNull().default('0'),
  color: varchar('color', { length: 7 }).notNull().default('#FFD700'),
  institution: varchar('institution', { length: 255 }),
  pluggyItemId: uuid('pluggy_item_id').references(() => pluggyItems.id),
  pluggyAccountId: varchar('pluggy_account_id', { length: 255 }),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});
