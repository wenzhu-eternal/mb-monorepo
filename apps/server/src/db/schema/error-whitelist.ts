import { boolean, pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core'

export const errorWhitelist = pgTable('error_whitelist', {
  id: serial('id').primaryKey(),
  pattern: text('pattern').notNull(),
  description: text('description'),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

export type ErrorWhitelistItem = typeof errorWhitelist.$inferSelect
export type NewErrorWhitelistItem = typeof errorWhitelist.$inferInsert
