import { pgTable, uuid, varchar, numeric, boolean, timestamp, text, date } from 'drizzle-orm/pg-core';
import { users } from './users.js';
import { accounts } from './accounts.js';
import { categories } from './categories.js';
import { creditCards } from './credit-cards.js';

export const transactions = pgTable('transactions', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  accountId: uuid('account_id').notNull().references(() => accounts.id, { onDelete: 'cascade' }),
  categoryId: uuid('category_id').references(() => categories.id, { onDelete: 'set null' }),
  creditCardId: uuid('credit_card_id').references(() => creditCards.id, { onDelete: 'set null' }),
  type: varchar('type', { length: 20 }).notNull().default('expense'),
  amount: numeric('amount', { precision: 15, scale: 2 }).notNull(),
  description: varchar('description', { length: 500 }).notNull(),
  date: date('date').notNull(),
  isPaid: boolean('is_paid').notNull().default(true),
  isRecurring: boolean('is_recurring').notNull().default(false),
  notes: text('notes'),
  pluggyTransactionId: varchar('pluggy_transaction_id', { length: 255 }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});
