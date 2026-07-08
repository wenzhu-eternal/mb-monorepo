import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Res,
  ServiceUnavailableException,
} from '@nestjs/common'
import { ApiOperation, ApiTags } from '@nestjs/swagger'
import type { Response } from 'express'
import { Public } from '@/common/decorators/public.decorator'
import { WechatLoginDto } from './dto/wechat-login.dto'
import { WechatService } from './wechat.service'

@ApiTags('Wechat')
@Controller('wechat')
@Public()
export class WechatController {
  constructor(private readonly wechatService: WechatService) {}

  @Get('qrcode')
  @ApiOperation({ summary: '获取微信扫码登录二维码 URL' })
  async getQrCode() {
    if (!this.wechatService.isEnabled()) {
      throw new ServiceUnavailableException('微信登录未启用，请配置 WEAPP_APPID 与 WEAPP_SECRET')
    }
    return this.wechatService.getQrCode()
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '微信登录（扫码 code 或小程序 code）' })
  async login(@Body() dto: WechatLoginDto, @Res({ passthrough: true }) response: Response) {
    if (!this.wechatService.isEnabled()) {
      throw new ServiceUnavailableException('微信登录未启用，请配置 WEAPP_APPID 与 WEAPP_SECRET')
    }
    const result = await this.wechatService.login(dto.code, dto.loginType)

    // 扫码/小程序登录的 refreshToken 也写入 httpOnly cookie，与账号密码登录一致
    response.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/api/v1/auth',
    })

    return {
      accessToken: result.accessToken,
      user: result.user,
    }
  }

  @Get('status')
  @ApiOperation({ summary: '查询微信登录是否启用' })
  status() {
    return { enabled: this.wechatService.isEnabled() }
  }
}
