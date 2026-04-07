import {
  pgTable, uuid, varchar, numeric, integer, boolean, timestamp, text, date,
} from 'drizzle-orm/pg-core';

// ─── Users ──────────────────────────────────────────────────
export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  passwordHash: varchar('password_hash', { length: 255 }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// ─── Pluggy Items ───────────────────────────────────────────
export const pluggyItems = pgTable('pluggy_items', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  pluggyItemId: varchar('pluggy_item_id', { length: 255 }).notNull().unique(),
  connectorName: varchar('connector_name', { length: 255 }).notNull(),
  status: varchar('status', { length: 50 }).notNull().default('connected'),
  lastSyncAt: timestamp('last_sync_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// ─── Accounts ───────────────────────────────────────────────
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

// ─── Categories ─────────────────────────────────────────────
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

// ─── Credit Cards ───────────────────────────────────────────
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

// ─── Transactions ───────────────────────────────────────────
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

// ─── Budgets ────────────────────────────────────────────────
export const budgets = pgTable('budgets', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  categoryId: uuid('category_id').notNull().references(() => categories.id, { onDelete: 'cascade' }),
  amount: numeric('amount', { precision: 15, scale: 2 }).notNull(),
  month: integer('month').notNull(),
  year: integer('year').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// ─── Alerts ─────────────────────────────────────────────────
export const alerts = pgTable('alerts', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  type: varchar('type', { length: 50 }).notNull().default('general'),
  title: varchar('title', { length: 255 }).notNull(),
  message: text('message').notNull(),
  isRead: boolean('is_read').notNull().default(false),
  referenceId: uuid('reference_id'),
  triggerDate: timestamp('trigger_date', { withTimezone: true }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// ─── Chat Messages ─────────────────────────────────────────
export const chatMessages = pgTable('chat_messages', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  role: varchar('role', { length: 20 }).notNull(),
  content: text('content').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// ─── Subscriptions ─────────────────────────────────────────
export const subscriptions = pgTable('subscriptions', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  plan: varchar('plan', { length: 50 }).notNull().default('free'),
  status: varchar('status', { length: 50 }).notNull().default('active'),
  providerOrderId: varchar('provider_order_id', { length: 255 }),
  providerCustomerEmail: varchar('provider_customer_email', { length: 255 }),
  currentPeriod: integer('current_period').notNull().default(1),
  expiresAt: timestamp('expires_at', { withTimezone: true }),
  canceledAt: timestamp('canceled_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// ─── WhatsApp Links ────────────────────────────────────────
export const whatsappLinks = pgTable('whatsapp_links', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  groupId: varchar('group_id', { length: 255 }),
  linkCode: varchar('link_code', { length: 10 }).notNull().unique(),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});
