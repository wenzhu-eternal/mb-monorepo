import type { Notification } from '@shared'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import { wsClient } from '@/lib/ws'
import { useAuthStore } from '@/store/auth-store'

interface OnlineResponse {
  count: number
  userIds: number[]
}

interface MeResponse {
  userId: number
  online: boolean
}

interface NotifyResponse {
  message: string
  notification: Notification
  delivered: boolean
}

/**
 * WebSocket 连接 hook: 登录后自动连接，登出自动断开
 */
export function useWebSocket() {
  const token = useAuthStore((state) => state.token)
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const [connected, setConnected] = useState(false)

  useEffect(() => {
    if (!isAuthenticated || !token) {
      wsClient.disconnect()
      setConnected(false)
      return
    }

    if (!token.trim()) {
      setConnected(false)
      return
    }

    wsClient.connect(token)

    const onConnect = () => setConnected(true)
    const onDisconnect = () => setConnected(false)

    wsClient.on('connect', onConnect)
    wsClient.on('disconnect', onDisconnect)

    return () => {
      wsClient.off('connect', onConnect)
      wsClient.off('disconnect', onDisconnect)
    }
  }, [isAuthenticated, token])

  return { connected }
}

/**
 * WebSocket 演示页专用 hook
 * - 在线用户列表
 * - 当前用户在线状态
 * - 收到的实时通知队列
 * - 发送测试通知
 */
export function useWebSocketDemo() {
  const queryClient = useQueryClient()
  const { connected } = useWebSocket()
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const [receivedNotifications, setReceivedNotifications] = useState<Notification[]>([])

  // 在线用户列表
  const onlineQuery = useQuery({
    queryKey: ['websocket', 'online'],
    queryFn: async () => {
      const response = await api.get<{ data: OnlineResponse }>('/api/v1/websocket/online')
      return response.data.data!
    },
    enabled: isAuthenticated,
    refetchInterval: isAuthenticated ? 10000 : false,
  })

  // 当前用户在线状态
  const meQuery = useQuery({
    queryKey: ['websocket', 'me'],
    queryFn: async () => {
      const response = await api.get<{ data: MeResponse }>('/api/v1/websocket/me')
      return response.data.data!
    },
    enabled: isAuthenticated,
    refetchInterval: isAuthenticated ? 10000 : false,
  })

  // 监听实时推送
  useEffect(() => {
    const onNotification = (data: unknown) => {
      const notification = data as Notification
      setReceivedNotifications((prev) => [notification, ...prev].slice(0, 20))
    }
    wsClient.on('notification', onNotification)
    return () => {
      wsClient.off('notification', onNotification)
    }
  }, [])

  // 发送测试通知
  const sendNotify = useMutation({
    mutationFn: async (input: {
      userId: number
      type?: string
      title: string
      content?: string
    }) => {
      const response = await api.post<{ data: NotifyResponse }>('/api/v1/websocket/notify', {
        userId: input.userId,
        type: input.type ?? 'test',
        title: input.title,
        content: input.content,
      })
      return response.data.data!
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['websocket', 'online'] })
    },
  })

  return {
    connected,
    onlineUsers: onlineQuery.data,
    me: meQuery.data,
    receivedNotifications,
    sendNotify,
  }
}
