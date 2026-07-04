import { Injectable } from '@nestjs/common'
import { EventsGateway } from './events.gateway'

/**
 * 事件服务: 业务模块通过此服务推送 WebSocket 消息
 * 解耦业务代码与网关实现
 */
@Injectable()
export class EventsService {
  constructor(private readonly eventsGateway: EventsGateway) {}

  /**
   * 推送消息给指定用户
   */
  pushToUser(userId: number, event: string, data: unknown): void {
    this.eventsGateway.pushToUser(userId, event, data)
  }

  /**
   * 广播消息给所有在线用户
   */
  pushAll(event: string, data: unknown): void {
    this.eventsGateway.pushAll(event, data)
  }

  /**
   * 获取在线用户 ID 列表
   */
  getOnlineUserIds(): number[] {
    return this.eventsGateway.getOnlineUserIds()
  }

  /**
   * 检查用户是否在线
   */
  isUserOnline(userId: number): boolean {
    return this.eventsGateway.isUserOnline(userId)
  }
}
