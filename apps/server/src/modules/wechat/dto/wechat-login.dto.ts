import { WechatLoginSchema } from '@shared/schemas/wechat'
import { createZodDto } from 'nestjs-zod'

export class WechatLoginDto extends createZodDto(WechatLoginSchema) {}
