import { Controller, Get, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger'
import { PermissionCodes } from '@shared/constants/permissions'
import { RouteListSchema } from '@shared/schemas/setup'
import { ZodSerializerDto } from 'nestjs-zod'
import { Permissions } from '@/common/decorators/permissions.decorator'
import { PermissionsGuard } from '@/common/guards/permissions.guard'
import { RoutesService } from './routes.service'

@ApiTags('Routes')
@ApiBearerAuth()
@Controller('routes')
@UseGuards(PermissionsGuard)
@Permissions(PermissionCodes.PERMISSION_VIEW)
export class RoutesController {
  constructor(private readonly routesService: RoutesService) {}

  @Get()
  @ApiOperation({ summary: '获取全部 API 路由元数据' })
  @ZodSerializerDto(RouteListSchema)
  list() {
    return this.routesService.list()
  }
}
