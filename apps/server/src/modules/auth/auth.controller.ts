import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UnauthorizedException,
} from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger'
import type { Request, Response } from 'express'
import { CurrentUser } from '@/common/decorators/current-user.decorator'
import { Public } from '@/common/decorators/public.decorator'
import { AuthService, type TokenPayload } from './auth.service'
import { LoginDto } from './dto/login.dto'
import { RegisterDto } from './dto/register.dto'
import { SendRegisterCodeDto } from './dto/send-register-code.dto'

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {}

  // ConfigService.get 运行时返回 string，需显式判断（"false" 字符串在 if 中为 truthy）
  private get cookieSecure(): boolean {
    const v = this.configService.get<string | boolean>('COOKIE_SECURE')
    return v === true || v === 'true'
  }

  @Post('login')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '用户登录' })
  async login(@Body() loginDto: LoginDto, @Res({ passthrough: true }) response: Response) {
    const result = await this.authService.login(loginDto.username, loginDto.password)

    response.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: this.cookieSecure,
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/api/v1/auth',
    })

    return {
      accessToken: result.accessToken,
      user: result.user,
    }
  }

  @Post('send-register-code')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '发送注册验证码' })
  async sendRegisterCode(@Body() dto: SendRegisterCodeDto) {
    return this.authService.sendRegisterCode(dto.email)
  }

  @Post('register')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '用户注册' })
  async register(@Body() dto: RegisterDto, @Res({ passthrough: true }) response: Response) {
    const result = await this.authService.registerWithCode(
      dto.username,
      dto.email,
      dto.password,
      dto.code,
    )

    response.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: this.cookieSecure,
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/api/v1/auth',
    })

    return {
      accessToken: result.accessToken,
      user: result.user,
    }
  }

  @Post('refresh')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '刷新访问令牌' })
  async refresh(
    @Req() request: Request,
    @Body('refreshToken') refreshTokenFromBody: string | undefined,
    @Res({ passthrough: true }) response: Response,
  ) {
    // 优先从 httpOnly cookie 读取，兜底 body（兼容旧客户端）
    const refreshToken = request.cookies?.refreshToken ?? refreshTokenFromBody
    if (!refreshToken) {
      throw new UnauthorizedException('缺少刷新令牌')
    }

    const tokens = await this.authService.refresh(refreshToken)

    response.cookie('refreshToken', tokens.refreshToken, {
      httpOnly: true,
      secure: this.cookieSecure,
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/api/v1/auth',
    })

    return {
      accessToken: tokens.accessToken,
    }
  }

  @Post('logout')
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '用户登出' })
  async logout(@CurrentUser() user: TokenPayload, @Res({ passthrough: true }) response: Response) {
    response.clearCookie('refreshToken', { path: '/api/v1/auth' })
    // 实现真正吊销
    return this.authService.logout(user.sub)
  }

  @Get('me')
  @ApiBearerAuth()
  @ApiOperation({ summary: '获取当前用户信息' })
  async getProfile(@CurrentUser() user: TokenPayload) {
    return this.authService.getProfile(user.sub)
  }
}
