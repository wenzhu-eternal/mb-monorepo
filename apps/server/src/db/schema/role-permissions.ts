import { integer, pgTable, primaryKey, varchar } from 'drizzle-orm/pg-core'
import { roles } from './roles'

export const rolePermissions = pgTable(
  'role_permissions',
  {
    roleId: integer('role_id')
      .references(() => roles.id, { onDelete: 'cascade' })
      .notNull(),
    permission: varchar('permission', { length: 50 }).notNull(),
  },
  (t) => [primaryKey({ columns: [t.roleId, t.permission] })],
)

export type RolePermission = typeof rolePermissions.$inferSelect
export type NewRolePermission = typeof rolePermissions.$inferInsert
