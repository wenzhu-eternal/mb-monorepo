import {
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger'
import { CurrentUser } from '@/common/decorators/current-user.decorator'
import { AuthGuard } from '@/modules/auth/auth.guard'
import { type TokenPayload } from '@/modules/auth/auth.service'
import { NotificationsService } from './notifications.service'

@ApiTags('Notifications')
@ApiBearerAuth()
@Controller('notifications')
@UseGuards(AuthGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  @ApiOperation({ summary: '拉取通知列表' })
  list(@CurrentUser() user: TokenPayload, @Query('unreadOnly') unreadOnly?: string) {
    return this.notificationsService.list(user.sub, unreadOnly === 'true')
  }

  @Get('unread-count')
  @ApiOperation({ summary: '未读通知数' })
  unreadCount(@CurrentUser() user: TokenPayload) {
    return this.notificationsService.unreadCount(user.sub)
  }

  @Post(':id/read')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '标记单条已读' })
  markAsRead(@CurrentUser() user: TokenPayload, @Param('id', ParseIntPipe) id: number) {
    return this.notificationsService.markAsRead(user.sub, id)
  }

  @Post('read-all')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '标记全部已读' })
  markAllRead(@CurrentUser() user: TokenPayload) {
    return this.notificationsService.markAllRead(user.sub)
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '删除通知' })
  remove(@CurrentUser() user: TokenPayload, @Param('id', ParseIntPipe) id: number) {
    return this.notificationsService.remove(user.sub, id)
  }
}
