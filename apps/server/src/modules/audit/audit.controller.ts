import {
  BadRequestException,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Query,
  UseGuards,
} from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger'
import { Roles } from '@/common/decorators/roles.decorator'
import { RolesGuard } from '@/common/guards/roles.guard'
import { AuthGuard } from '@/modules/auth/auth.guard'
import { AuditService } from './audit.service'

@ApiTags('Audit')
@Controller('audit-logs')
@UseGuards(AuthGuard, RolesGuard)
@ApiBearerAuth()
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get()
  @Roles('admin')
  @ApiOperation({ summary: '分页查询审计日志（仅管理员）' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'pageSize', required: false, type: Number })
  async findAll(@Query('page') page?: string, @Query('pageSize') pageSize?: string) {
    const pageNum = page ? Number.parseInt(page, 10) : 1
    const size = pageSize ? Number.parseInt(pageSize, 10) : 10
    if (Number.isNaN(pageNum) || pageNum < 1) {
      throw new BadRequestException('page 必须为正整数')
    }
    if (Number.isNaN(size) || size < 1) {
      throw new BadRequestException('pageSize 必须为正整数')
    }
    return this.auditService.findAll(pageNum, size)
  }

  @Get(':id')
  @Roles('admin')
  @ApiOperation({ summary: '按ID查询审计日志（仅管理员）' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.auditService.findById(id)
  }
}
