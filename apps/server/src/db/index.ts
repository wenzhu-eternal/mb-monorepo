import { config } from 'dotenv'
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema'

// 显式加载根目录 .env，避免在 apps/server/ 下运行时找不到环境变量
config({ path: '../../.env' })

const connectionString = process.env.DATABASE_URL!

// 配置连接池: max 10 连接，避免无限制创建连接
export const client = postgres(connectionString, {
  max: 10,
  idle_timeout: 20,
  connect_timeout: 10,
})

export const db = drizzle(client, { schema })
