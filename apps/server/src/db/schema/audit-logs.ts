import { jsonb, pgTable, serial, text, timestamp, varchar } from 'drizzle-orm/pg-core'

export const auditLogs = pgTable('audit_logs', {
  id: serial('id').primaryKey(),
  userId: serial('user_id'),
  action: varchar('action', { length: 50 }).notNull(),
  resource: varchar('resource', { length: 50 }).notNull(),
  resourceId: serial('resource_id'),
  oldValue: jsonb('old_value'),
  newValue: jsonb('new_value'),
  ip: varchar('ip', { length: 45 }),
  userAgent: text('user_agent'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export type AuditLog = typeof auditLogs.$inferSelect
export type NewAuditLog = typeof auditLogs.$inferInsert
