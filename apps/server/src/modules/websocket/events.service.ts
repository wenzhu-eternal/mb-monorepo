import { Injectable } from '@nestjs/common'
import { EventsGateway } from './events.gateway'

/**
 * 事件服务: 业务模块通过此服务推送 WebSocket 消息
 * 解耦业务代码与网关实现
 */
@Injectable()
export class EventsService {
  constructor(private readonly eventsGateway: EventsGateway) {}

  pushToUser(userId: number, event: string, data: unknown): void {
    this.eventsGateway.pushToUser(userId, event, data)
  }

  pushAll(event: string, data: unknown): void {
    this.eventsGateway.pushAll(event, data)
  }

  getOnlineUserIds(): number[] {
    return this.eventsGateway.getOnlineUserIds()
  }

  isUserOnline(userId: number): boolean {
    return this.eventsGateway.isUserOnline(userId)
  }
}
