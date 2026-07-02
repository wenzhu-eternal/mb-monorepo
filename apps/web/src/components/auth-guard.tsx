import { Navigate, Outlet } from '@tanstack/react-router'
import type { ReactNode } from 'react'
import { useAuthStore } from '@/store/auth-store'

interface AuthGuardProps {
  children?: ReactNode
}

export const AuthGuard = ({ children }: AuthGuardProps) => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return children ? children : <Outlet />
}
