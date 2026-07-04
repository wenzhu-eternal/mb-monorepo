import { Global, Module } from '@nestjs/common'
import { NotificationsModule } from '@/modules/notifications/notifications.module'
import { EventsGateway } from './events.gateway'
import { EventsService } from './events.service'
import { WebsocketController } from './websocket.controller'

@Global()
@Module({
  imports: [NotificationsModule],
  controllers: [WebsocketController],
  providers: [EventsGateway, EventsService],
  exports: [EventsService],
})
export class WebSocketModule {}
