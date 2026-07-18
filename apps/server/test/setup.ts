import { config } from 'dotenv'

/**
 * 测试环境变量设置
 *
 * 先加载根目录 .env（与 db/index.ts 一致），再为未设置的变量提供默认值
 * smoke.e2e-spec.ts 连真实 DB，需要正确的 DATABASE_URL/REDIS_URL
 */
config({ path: '../../.env' })

// 测试专用默认值（仅当未通过 .env 或环境变量传入时生效）
if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test_db'
}
if (!process.env.REDIS_URL) {
  process.env.REDIS_URL = 'redis://localhost:6379'
}
if (!process.env.JWT_SECRET) {
  process.env.JWT_SECRET = 'test-jwt-secret-for-testing-only-must-be-32-chars'
}
if (!process.env.JWT_REFRESH_SECRET) {
  process.env.JWT_REFRESH_SECRET = 'test-jwt-refresh-secret-for-testing-only-must-be-32-chars'
}
if (!process.env.NODE_ENV) {
  process.env.NODE_ENV = 'test'
}
