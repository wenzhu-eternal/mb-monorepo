import 'dotenv/config'
import { db } from './index'
import { errorWhitelist, roles, users } from './schema'

// argon2 hash for password "admin123"
const ADMIN_PASSWORD_HASH =
  '$argon2id$v=19$m=65536,t=3,p=4$Bg27npZWqewGK3lVzGxg3Q$FLi41Lj2tS0ZVMmFmiQqxIwqmDmvQAeMa0MRuDrXGkk'

async function seed() {
  console.log('Seeding database...')

  // Create admin role
  const [adminRole] = await db
    .insert(roles)
    .values({
      name: 'admin',
      description: 'System administrator with full access',
    })
    .returning()

  if (!adminRole) {
    throw new Error('Failed to create admin role')
  }

  console.log('Created admin role:', adminRole)

  // Create default admin user
  const [adminUser] = await db
    .insert(users)
    .values({
      username: 'admin',
      email: 'admin@example.com',
      password: ADMIN_PASSWORD_HASH,
      nickname: 'Administrator',
      roleId: adminRole.id,
      status: true,
    })
    .returning()

  console.log('Created admin user:', adminUser)

  // Create initial error whitelist entries
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
    .returning()

  console.log('Created error whitelist entries:', whitelistEntries)

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
