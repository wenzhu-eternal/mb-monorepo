import { Module } from '@nestjs/common'
import { MailModule } from '@/modules/mail/mail.module'
import { ScheduleService } from './schedule.service'

@Module({
  imports: [MailModule],
  providers: [ScheduleService],
})
export class ScheduleTasksModule {}
