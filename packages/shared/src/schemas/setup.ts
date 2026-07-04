import { z } from 'zod'

/**
 * 系统初始化请求: 创建首个管理员账号 + 默认角色
 */
export const SetupSchema = z.object({
  username: z
    .string()
    .min(3, '用户名至少 3 个字符')
    .max(50, '用户名最多 50 个字符')
    .regex(/^[a-zA-Z0-9_]+$/, '用户名只能包含字母、数字、下划线'),
  email: z.string().email('邮箱格式不正确'),
  password: z.string().min(8, '密码至少 8 个字符').max(100, '密码最多 100 个字符'),
  nickname: z.string().max(50).optional(),
})

/**
 * 初始化状态响应
 */
export const SetupStatusSchema = z.object({
  initialized: z.boolean(),
  /** 已存在的用户数 */
  userCount: z.number().int(),
  /** 已存在的角色数 */
  roleCount: z.number().int(),
})

/**
 * 单个路由元数据
 */
export const RouteMetaSchema = z.object({
  path: z.string(),
  method: z.string(),
  controller: z.string(),
  handlerName: z.string(),
})

export const RouteListSchema = z.array(RouteMetaSchema)

export type Setup = z.infer<typeof SetupSchema>
export type SetupStatus = z.infer<typeof SetupStatusSchema>
export type RouteMeta = z.infer<typeof RouteMetaSchema>
