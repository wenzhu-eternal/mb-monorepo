import type { ReactNode } from 'react'
import type { PermissionCode } from '@/lib/permissions'
import { useAuthStore } from '@/store/auth-store'

interface HasPermissionProps {
  code: PermissionCode
  children: ReactNode
  fallback?: ReactNode
}

export const HasPermission = ({ code, children, fallback = null }: HasPermissionProps) => {
  const user = useAuthStore((state) => state.user)

  if (!user) {
    return <>{fallback}</>
  }

  const hasPermission = user.permissions?.includes(code) ?? false

  if (!hasPermission) {
    return <>{fallback}</>
  }

  return <>{children}</>
}
