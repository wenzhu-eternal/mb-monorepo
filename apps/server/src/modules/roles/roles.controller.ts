import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger'
import { AuthGuard } from '@/modules/auth/auth.guard'
import { RolesGuard } from '@/common/guards/roles.guard'
import { Roles } from '@/common/decorators/roles.decorator'
import { CreateRoleDto } from './dto/create-role.dto'
import { UpdateRoleDto } from './dto/update-role.dto'
import { RolesService } from './roles.service'

@ApiTags('Roles')
@Controller('roles')
@UseGuards(AuthGuard, RolesGuard)
@ApiBearerAuth()
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Get()
  @ApiOperation({ summary: '分页查询角色' })
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
    return this.rolesService.findAll(pageNum, size)
  }

  @Get(':id')
  @ApiOperation({ summary: '按ID查询角色' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.rolesService.findById(id)
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Roles('admin')
  @ApiOperation({ summary: '创建角色（仅管理员）' })
  async create(@Body() createRoleDto: CreateRoleDto) {
    return this.rolesService.create(createRoleDto)
  }

  @Patch(':id')
  @Roles('admin')
  @ApiOperation({ summary: '更新角色（仅管理员）' })
  async update(@Param('id', ParseIntPipe) id: number, @Body() updateRoleDto: UpdateRoleDto) {
    return this.rolesService.update(id, updateRoleDto)
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @Roles('admin')
  @ApiOperation({ summary: '删除角色（仅管理员）' })
  async remove(@Param('id', ParseIntPipe) id: number) {
    return this.rolesService.remove(id)
  }
}
