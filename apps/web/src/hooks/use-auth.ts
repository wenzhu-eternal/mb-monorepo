import type { ApiResponse, Login, User, WechatLoginType } from '@shared'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useEffect } from 'react'
import { api } from '@/lib/api'
import { useAuthStore } from '@/store/auth-store'

interface LoginResponse {
  accessToken: string
  user: User
}

interface WechatQrCodeResponse {
  qrCodeUrl: string
  state: string
  expiresIn: number
}

interface WechatStatusResponse {
  enabled: boolean
}

export const useLogin = () => {
  const { login } = useAuthStore()

  return useMutation({
    mutationFn: async (data: Login) => {
      const response = await api.post<ApiResponse<LoginResponse>>('/api/v1/auth/login', data)
      return response.data.data!
    },
    onSuccess: (data) => {
      // refreshToken 已由后端写入 httpOnly cookie，前端只存 accessToken
      login(data.user, data.accessToken)
    },
  })
}

export const useLogout = () => {
  const { logout } = useAuthStore()

  return useMutation({
    mutationFn: async () => {
      // 调用后端清除 httpOnly cookie
      try {
        await api.post('/api/v1/auth/logout')
      } catch {
        // 即使后端调用失败也继续前端登出
      }
    },
    onSuccess: () => {
      logout()
    },
  })
}

export const useCurrentUser = () => {
  const { token, setUser } = useAuthStore()

  const query = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: async () => {
      const response = await api.get<ApiResponse<User>>('/api/v1/auth/me')
      return response.data.data!
    },
    enabled: !!token,
    retry: false,
  })

  useEffect(() => {
    if (query.data) setUser(query.data)
  }, [query.data, setUser])

  return query
}

/** 查询微信登录是否启用 */
export const useWechatStatus = () =>
  useQuery({
    queryKey: ['wechat', 'status'],
    queryFn: async () => {
      const response = await api.get<ApiResponse<WechatStatusResponse>>('/api/v1/wechat/status')
      return response.data.data!
    },
    retry: false,
  })

/** 获取微信扫码登录二维码 */
export const useWechatQrCode = () =>
  useMutation({
    mutationFn: async () => {
      const response = await api.get<ApiResponse<WechatQrCodeResponse>>('/api/v1/wechat/qrcode')
      return response.data.data!
    },
  })

/** 微信登录（扫码 code 或小程序 code） */
export const useWechatLogin = () => {
  const { login } = useAuthStore()

  return useMutation({
    mutationFn: async (data: { code: string; loginType: WechatLoginType }) => {
      const response = await api.post<ApiResponse<LoginResponse>>('/api/v1/wechat/login', data)
      return response.data.data!
    },
    onSuccess: (data) => {
      login(data.user, data.accessToken)
    },
  })
}

export const useAuth = () => {
  const { user, token, isAuthenticated } = useAuthStore()
  const loginMutation = useLogin()
  const logoutMutation = useLogout()

  return {
    user,
    token,
    isAuthenticated,
    login: loginMutation,
    logout: logoutMutation,
  }
}
