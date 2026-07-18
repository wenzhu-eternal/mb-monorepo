import { adminUser } from '@e2e/fixtures/users'
import { apiClient } from '@e2e/helpers/api'
import { cleanupAll } from '@e2e/helpers/cleanup'

/**
 * Playwright 全局 teardown：所有测试后清理
 *
 * 流程：
 *   1. 重新用 admin 登录（token 可能已过期）
 *   2. 清理所有 e2e- 前缀的临时数据
 *
 * 注意：admin 账号 + seed 默认数据保留，不清理
 */
export default async function globalTeardown() {
  console.log('[global-teardown] admin 重新登录...')
  try {
    await apiClient.login(adminUser.username, adminUser.password)
  } catch (err) {
    console.error('[global-teardown] 登录失败，跳过清理:', err)
    return
  }

  console.log('[global-teardown] 清理 e2e 数据...')
  await cleanupAll()

  console.log('[global-teardown] 完成')
}
