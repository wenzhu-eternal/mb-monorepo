import { Controller, Get, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger'
import { Roles } from '@/common/decorators/roles.decorator'
import { RolesGuard } from '@/common/guards/roles.guard'
import { RoutesService } from './routes.service'

@ApiTags('Routes')
@ApiBearerAuth()
@Controller('routes')
@UseGuards(RolesGuard)
@Roles('admin')
export class RoutesController {
  constructor(private readonly routesService: RoutesService) {}

  @Get()
  @ApiOperation({ summary: '获取全部 API 路由元数据（仅管理员）' })
  list() {
    return this.routesService.list()
  }
}
