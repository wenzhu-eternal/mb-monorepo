import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'

// E2E 测试配置（HTTP supertest，连真实 DB）
const __dirname = fileURLToPath(new URL('.', import.meta.url))

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['test/e2e/**/*.e2e-spec.ts'],
    exclude: ['node_modules', 'dist', 'src/**'],
    setupFiles: ['./test/setup.ts'],
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, '../src'),
      '@shared': resolve(__dirname, '../../../packages/shared/src'),
    },
  },
})
