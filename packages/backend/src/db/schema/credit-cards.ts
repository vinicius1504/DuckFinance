import { pgTable, uuid, varchar, numeric, integer, boolean, timestamp } from 'drizzle-orm/pg-core';
import { users } from './users.js';
import { accounts } from './accounts.js';

export const creditCards = pgTable('credit_cards', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  accountId: uuid('account_id').references(() => accounts.id, { onDelete: 'set null' }),
  name: varchar('name', { length: 255 }).notNull(),
  lastFourDigits: varchar('last_four_digits', { length: 4 }).notNull(),
  brand: varchar('brand', { length: 50 }).notNull(),
  creditLimit: numeric('credit_limit', { precision: 15, scale: 2 }).notNull(),
  closingDay: integer('closing_day').notNull(),
  dueDay: integer('due_day').notNull(),
  color: varchar('color', { length: 7 }).notNull().default('#FFD700'),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});
