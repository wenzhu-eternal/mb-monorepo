import { Controller, Get, HttpCode, HttpStatus, ServiceUnavailableException } from '@nestjs/common'
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger'
import { SkipThrottle } from '@nestjs/throttler'
import { Public } from '@/common/decorators/public.decorator'
import { HealthService } from './health.service'

@ApiTags('Health')
@Controller('health')
@Public()
@SkipThrottle() // 健康检查不被限流，避免探针误判
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '健康检查' })
  @ApiResponse({ status: 200, description: '服务正常' })
  @ApiResponse({ status: 503, description: '服务异常' })
  async check() {
    const result = await this.healthService.check()
    // DB 异常时返回 503，便于 Docker/K8s 探针据此重启
    if (result.status === 'error') {
      throw new ServiceUnavailableException(result)
    }
    return result
  }
}
