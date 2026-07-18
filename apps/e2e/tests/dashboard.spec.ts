import { loginAsAdmin } from '@e2e/helpers/auth'
import { expect, test } from '@playwright/test'

/**
 * Dashboard 显示 e2e
 *
 * 覆盖：
 *   - 显示 3 个统计卡片（用户总数 / 活跃用户 / 系统状态）
 *   - 用户总数显示为数字
 *   - 活跃用户显示为数字
 */

test.describe('Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page)
  })

  test('显示 3 个统计卡片', async ({ page }) => {
    await page.goto('/dashboard')
    await expect(page.getByRole('heading', { name: '仪表盘' })).toBeVisible()

    await expect(page.getByText('用户总数', { exact: true })).toBeVisible()
    await expect(page.getByText('活跃用户', { exact: true })).toBeVisible()
    await expect(page.getByText('系统状态', { exact: true })).toBeVisible()
  })

  test('用户总数显示为数字（非 "-"）', async ({ page }) => {
    await page.goto('/dashboard')

    // 等待数据加载完成（Spin 消失）
    await expect(page.locator('.ant-spin-spinning')).toBeHidden({ timeout: 10_000 })

    // 用户总数卡片内的数字应为数字，不是 "-"
    const userTotalCard = page.locator('.ant-card').filter({ hasText: '用户总数' })
    await expect(userTotalCard.locator('.text-3xl')).not.toHaveText('-')
    await expect(userTotalCard.locator('.text-3xl')).toHaveText(/^\d+$/)
  })

  test('活跃用户显示为数字', async ({ page }) => {
    await page.goto('/dashboard')
    await expect(page.locator('.ant-spin-spinning')).toBeHidden({ timeout: 10_000 })

    const activeCard = page.locator('.ant-card').filter({ hasText: '活跃用户' })
    await expect(activeCard.locator('.text-3xl')).not.toHaveText('-')
    await expect(activeCard.locator('.text-3xl')).toHaveText(/^\d+$/)
  })

  test('系统状态显示"在线"', async ({ page }) => {
    await page.goto('/dashboard')
    const statusCard = page.locator('.ant-card').filter({ hasText: '系统状态' })
    await expect(statusCard.locator('.text-3xl')).toHaveText('在线')
  })
})
