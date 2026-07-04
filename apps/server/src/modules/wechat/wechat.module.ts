import { Module } from '@nestjs/common'
import { AuthModule } from '@/modules/auth/auth.module'
import { WechatController } from './wechat.controller'
import { WechatService } from './wechat.service'

@Module({
  imports: [AuthModule],
  controllers: [WechatController],
  providers: [WechatService],
  exports: [WechatService],
})
export class WechatModule {}
