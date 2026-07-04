import 'dotenv/config'
import { eq } from 'drizzle-orm'
import { db } from './index'
import { errorWhitelist, rolePermissions, roles, users } from './schema'

// argon2 hash for password "admin123"
const ADMIN_PASSWORD_HASH =
  '$argon2id$v=19$m=65536,t=3,p=4$Bg27npZWqewGK3lVzGxg3Q$FLi41Lj2tS0ZVMmFmiQqxIwqmDmvQAeMa0MRuDrXGkk'

async function seed() {
  console.log('Seeding database...')

  // Create admin role (idempotent)
  const [adminRole] = await db
    .insert(roles)
    .values({
      name: 'admin',
      description: 'System administrator with full access',
    })
    .onConflictDoNothing()
    .returning()

  // Fetch existing admin role if insert was skipped
  const role = adminRole ?? (await db.query.roles.findFirst({ where: eq(roles.name, 'admin') }))

  if (!role) {
    throw new Error('Failed to create or find admin role')
  }

  console.log('Admin role ready:', role)

  const adminPermissions = [
    'user:view',
    'user:create',
    'user:update',
    'user:delete',
    'role:view',
    'role:create',
    'role:update',
    'role:delete',
    'file:view',
    'file:upload',
  ]
  await db
    .insert(rolePermissions)
    .values(adminPermissions.map((permission) => ({ roleId: role.id, permission })))
    .onConflictDoNothing()
  console.log('Seeded admin permissions:', adminPermissions)

  // Create default admin user (idempotent)
  const [adminUser] = await db
    .insert(users)
    .values({
      username: 'admin',
      email: 'admin@example.com',
      password: ADMIN_PASSWORD_HASH,
      nickname: 'Administrator',
      roleId: role.id,
      status: true,
    })
    .onConflictDoNothing()
    .returning()

  console.log('Created admin user:', adminUser)

  // Create initial error whitelist entries (idempotent)
  const whitelistEntries = await db
    .insert(errorWhitelist)
    .values([
      {
        pattern: 'ECONNREFUSED',
        description: 'Database connection refused - ignore during startup',
        isActive: true,
      },
      {
        pattern: 'ETIMEDOUT',
        description: 'Connection timeout - temporary network issues',
        isActive: true,
      },
      {
        pattern: 'healthcheck',
        description: 'Health check endpoint errors',
        isActive: false,
      },
    ])
    .onConflictDoNothing()
    .returning()

  console.log('Error whitelist entries:', whitelistEntries.length ? 'created' : 'already exist')

  console.log('Database seeded successfully!')
}

seed()
  .then(() => {
    process.exit(0)
  })
  .catch((error: Error) => {
    console.error('Seed failed:', error)
    process.exit(1)
  })
