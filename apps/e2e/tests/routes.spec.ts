import { loginAsAdmin, loginAsNormalUser } from '@e2e/helpers/auth'
import { expect, test } from '@playwright/test'

/**
 * 路由守卫 e2e
 *
 * 覆盖：
 *   - 未登录访问 /dashboard → 跳转 /login
 *   - 未登录访问 /users → 跳转 /login
 *   - 普通用户访问 /roles → 跳转 /403（无 role:view）
 *   - 普通用户访问 /permissions → 跳转 /403（无 permission:view）
 *   - admin 访问 /roles → 正常显示
 */

test.describe('路由守卫', () => {
  test.describe('未登录', () => {
    test.beforeEach(async ({ page }) => {
      // 确保未登录
      await page.addInitScript(() => {
        localStorage.removeItem('auth-storage')
      })
    })

    test('访问 /dashboard → 跳转 /login', async ({ page }) => {
      await page.goto('/dashboard')
      await expect(page).toHaveURL(/\/login$/)
    })

    test('访问 /users → 跳转 /login', async ({ page }) => {
      await page.goto('/users')
      await expect(page).toHaveURL(/\/login$/)
    })

    test('访问 /files → 跳转 /login', async ({ page }) => {
      await page.goto('/files')
      await expect(page).toHaveURL(/\/login$/)
    })

    test('访问 /websocket → 跳转 /login', async ({ page }) => {
      await page.goto('/websocket')
      await expect(page).toHaveURL(/\/login$/)
    })
  })

  test.describe('普通用户（无 role:view / permission:view）', () => {
    test.beforeEach(async ({ page }) => {
      await loginAsNormalUser(page)
    })

    test('访问 /roles → 跳转 /403', async ({ page }) => {
      await page.goto('/roles')
      await expect(page).toHaveURL(/\/403$/)
    })

    test('访问 /permissions → 跳转 /403', async ({ page }) => {
      await page.goto('/permissions')
      await expect(page).toHaveURL(/\/403$/)
    })

    test('访问 /audit-logs → 跳转 /403', async ({ page }) => {
      await page.goto('/audit-logs')
      await expect(page).toHaveURL(/\/403$/)
    })
  })

  test.describe('admin（全部权限）', () => {
    test.beforeEach(async ({ page }) => {
      await loginAsAdmin(page)
    })

    test('访问 /roles → 正常显示', async ({ page }) => {
      await page.goto('/roles')
      await expect(page).toHaveURL(/\/roles$/)
      await expect(page.getByRole('heading', { name: '角色管理' })).toBeVisible()
    })

    test('访问 /permissions → 正常显示', async ({ page }) => {
      await page.goto('/permissions')
      await expect(page).toHaveURL(/\/permissions$/)
      await expect(page.getByRole('heading', { name: '权限管理' })).toBeVisible()
    })
  })
})
