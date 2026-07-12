import { config } from 'dotenv'
import { defineConfig } from 'drizzle-kit'

// 显式加载根目录 .env，避免在 apps/server/ 下运行时找不到环境变量
config({ path: '../../.env' })

export default defineConfig({
  schema: './src/db/schema/*',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
})
