import { Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { JwtService } from '@nestjs/jwt'
import {
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets'
import type { Server, Socket } from 'socket.io'

/**
 * WebSocket 网关: 在线状态登记 + 通知推送
 * 鉴权: 优先从 auth.token（JWT access token）解析 userId
 *       兼容 query.userId（仅开发环境，生产建议关闭）
 */
@WebSocketGateway({
  cors: {
    origin: true,
    credentials: true,
  },
})
export class EventsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server

  private readonly logger = new Logger(EventsGateway.name)

  // userId -> Set<socketId> 在线连接映射（同一用户可多端在线）
  private readonly onlineUsers = new Map<number, Set<string>>()

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  handleConnection(client: Socket) {
    const userId = this.extractUserId(client)
    if (!userId) {
      client.emit('error', { message: '未认证，连接被拒绝' })
      client.disconnect()
      return
    }

    if (!this.onlineUsers.has(userId)) {
      this.onlineUsers.set(userId, new Set())
    }
    this.onlineUsers.get(userId)!.add(client.id)
    client.data.userId = userId

    this.logger.log(`用户 ${userId} 已连接 (socket: ${client.id})`)
  }

  handleDisconnect(client: Socket) {
    const userId = client.data.userId as number | undefined
    if (!userId) return

    const sockets = this.onlineUsers.get(userId)
    if (sockets) {
      sockets.delete(client.id)
      if (sockets.size === 0) {
        this.onlineUsers.delete(userId)
      }
    }

    this.logger.log(`用户 ${userId} 已断开 (socket: ${client.id})`)
  }

  /**
   * 客户端心跳
   */
  @SubscribeMessage('ping')
  handlePing(@MessageBody() data: unknown): { event: string; data: unknown } {
    return { event: 'pong', data }
  }

  /**
   * 标记通知已读（客户端 emit 'notification:read' { id }）
   */
  @SubscribeMessage('notification:read')
  handleNotificationRead(@MessageBody() data: { id?: number }): {
    event: string
    data: { ok: boolean }
  } {
    // 实际持久化由 NotificationsService 负责（前端通过 HTTP 调用）
    return { event: 'notification:read:ack', data: { ok: !!data?.id } }
  }

  /**
   * 推送消息给指定用户
   */
  pushToUser(userId: number, event: string, data: unknown): void {
    const sockets = this.onlineUsers.get(userId)
    if (!sockets || sockets.size === 0) return

    for (const socketId of sockets) {
      this.server.to(socketId).emit(event, data)
    }
  }

  /**
   * 广播消息给所有在线用户
   */
  pushAll(event: string, data: unknown): void {
    this.server.emit(event, data)
  }

  /**
   * 获取在线用户 ID 列表
   */
  getOnlineUserIds(): number[] {
    return Array.from(this.onlineUsers.keys())
  }

  /**
   * 检查用户是否在线
   */
  isUserOnline(userId: number): boolean {
    const sockets = this.onlineUsers.get(userId)
    return !!sockets && sockets.size > 0
  }

  /**
   * 从握手 auth.token（JWT）解析 userId
   * 兼容 query.userId（仅当未配置 JWT 时降级，便于开发调试）
   */
  private extractUserId(client: Socket): number | null {
    // 优先: auth.token = <accessToken>
    const authToken = (client.handshake.auth as { token?: string } | undefined)?.token
    if (authToken) {
      try {
        const secret = this.configService.get<string>('JWT_SECRET')
        const payload = this.jwtService.verify<{ sub: number }>(authToken, { secret })
        if (payload?.sub && payload.sub > 0) {
          return payload.sub
        }
      } catch (err) {
        this.logger.warn(`WebSocket 鉴权失败: ${(err as Error).message}`)
        return null
      }
    }

    // 兼容降级: query.userId（仅开发环境）
    if (this.configService.get<string>('NODE_ENV') !== 'production') {
      const queryUserId = client.handshake.query.userId
      if (typeof queryUserId === 'string') {
        const id = Number.parseInt(queryUserId, 10)
        if (!Number.isNaN(id) && id > 0) return id
      }
    }

    return null
  }
}
