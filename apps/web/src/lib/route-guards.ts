import { redirect } from '@tanstack/react-router'
import { useAuthStore } from '@/store/auth-store'
import type { PermissionCode } from './permissions'

/**
 * 路由级认证守卫：仅检查登录状态，不检查权限
 */
export function requireAuth() {
  return () => {
    const { isAuthenticated } = useAuthStore.getState()
    if (!isAuthenticated) {
      throw redirect({ to: '/login' })
    }
  }
}

/**
 * 路由级权限守卫：无指定权限时重定向到 /403
 * 在路由的 beforeLoad 中调用
 */
export function requirePermission(permission: PermissionCode) {
  return () => {
    const { user, isAuthenticated } = useAuthStore.getState()

    if (!isAuthenticated) {
      throw redirect({ to: '/login' })
    }

    if (user?.permissions?.includes(permission)) {
      return
    }

    throw redirect({ to: '/403' })
  }
}
