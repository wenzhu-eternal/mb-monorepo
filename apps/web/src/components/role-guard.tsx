import { useNavigate } from '@tanstack/react-router'
import { Button, Result } from 'antd'
import type { ReactNode } from 'react'
import { useAuthStore } from '@/store/auth-store'

interface RoleGuardProps {
  roles: string[]
  children: ReactNode
}

export const RoleGuard = ({ roles, children }: RoleGuardProps) => {
  const user = useAuthStore((state) => state.user)
  const navigate = useNavigate()

  const hasRole = user?.roles?.some((role: { name: string }) => roles.includes(role.name)) ?? false

  if (!hasRole) {
    return (
      <Result
        status="403"
        title="403"
        subTitle="Sorry, you are not authorized to access this page."
        extra={
          <Button type="primary" onClick={() => navigate({ to: '/dashboard' })}>
            Back Home
          </Button>
        }
      />
    )
  }

  return <>{children}</>
}
