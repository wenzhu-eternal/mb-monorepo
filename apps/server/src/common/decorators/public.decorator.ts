import { SetMetadata } from '@nestjs/common'

export const IS_PUBLIC_KEY = 'isPublic'

/**
 * 标记接口为公开访问，跳过全局 AuthGuard
 * 用于 login / refresh / health / setup 等无需认证的接口
 */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true)
