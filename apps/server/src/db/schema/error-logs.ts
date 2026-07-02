import { jsonb, pgTable, serial, text, timestamp, varchar } from 'drizzle-orm/pg-core'

export const errorLogs = pgTable('error_logs', {
  id: serial('id').primaryKey(),
  message: text('message').notNull(),
  stack: text('stack'),
  context: jsonb('context'),
  userId: serial('user_id'),
  ip: varchar('ip', { length: 45 }),
  userAgent: text('user_agent'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export type ErrorLog = typeof errorLogs.$inferSelect
export type NewErrorLog = typeof errorLogs.$inferInsert
