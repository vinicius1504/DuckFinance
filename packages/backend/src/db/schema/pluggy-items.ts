import { pgTable, uuid, varchar, timestamp } from 'drizzle-orm/pg-core';
import { users } from './users.js';

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
