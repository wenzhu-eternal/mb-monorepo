import { createZodDto } from 'nestjs-zod'
import { z } from 'zod'

export const NotifySchema = z.object({
  userId: z.number().int().positive('用户 ID 必须为正整数'),
  type: z.string().max(50).default('test'),
  title: z.string().min(1, '标题不能为空').max(200),
  content: z.string().max(2000).optional(),
})

export class NotifyDto extends createZodDto(NotifySchema) {}
