import {
  BadRequestException,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Query,
  UseGuards,
} from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger'
import { Roles } from '@/common/decorators/roles.decorator'
import { RolesGuard } from '@/common/guards/roles.guard'
import { AuthGuard } from '@/modules/auth/auth.guard'
import { ErrorLogsService } from './error-logs.service'

@ApiTags('ErrorLogs')
@Controller('error-logs')
@UseGuards(AuthGuard, RolesGuard)
@ApiBearerAuth()
export class ErrorLogsController {
  constructor(private readonly errorLogsService: ErrorLogsService) {}

  @Get()
  @Roles('admin')
  @ApiOperation({ summary: '分页查询错误日志（仅管理员）' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'pageSize', required: false, type: Number })
  @ApiQuery({ name: 'keyword', required: false, type: String })
  async findAll(
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('keyword') keyword?: string,
  ) {
    const pageNum = page ? Number.parseInt(page, 10) : 1
    const size = pageSize ? Number.parseInt(pageSize, 10) : 10
    if (Number.isNaN(pageNum) || pageNum < 1) {
      throw new BadRequestException('page 必须为正整数')
    }
    if (Number.isNaN(size) || size < 1) {
      throw new BadRequestException('pageSize 必须为正整数')
    }
    return this.errorLogsService.findAll(pageNum, size, keyword)
  }

  @Get(':id')
  @Roles('admin')
  @ApiOperation({ summary: '按ID查询错误日志（仅管理员）' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.errorLogsService.findById(id)
  }

  @Delete(':id')
  @Roles('admin')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '删除错误日志（仅管理员）' })
  async remove(@Param('id', ParseIntPipe) id: number) {
    return this.errorLogsService.remove(id)
  }
}
