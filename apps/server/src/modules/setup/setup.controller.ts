import { Body, Controller, Get, HttpCode, HttpStatus, Post } from '@nestjs/common'
import { ApiOperation, ApiTags } from '@nestjs/swagger'
import { Public } from '@/common/decorators/public.decorator'
import { SetupDto } from './dto/setup.dto'
import { SetupService } from './setup.service'

@ApiTags('Setup')
@Controller('setup')
@Public()
export class SetupController {
  constructor(private readonly setupService: SetupService) {}

  @Get('status')
  @ApiOperation({ summary: '查询系统初始化状态（公开）' })
  status() {
    return this.setupService.getStatus()
  }

  @Post()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '一键初始化系统（仅未初始化时可用）' })
  async setup(@Body() dto: SetupDto) {
    return this.setupService.initialize(dto)
  }
}
