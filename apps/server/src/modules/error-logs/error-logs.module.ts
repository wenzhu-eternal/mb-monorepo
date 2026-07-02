import { Module } from '@nestjs/common'
import { AuthModule } from '@/modules/auth/auth.module'
import { ErrorLogsController } from './error-logs.controller'
import { ErrorLogsService } from './error-logs.service'

@Module({
  imports: [AuthModule],
  controllers: [ErrorLogsController],
  providers: [ErrorLogsService],
  exports: [ErrorLogsService],
})
export class ErrorLogsModule {}
