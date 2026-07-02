import { SetMetadata } from '@nestjs/common'

export const ROLES_KEY = 'roles'

/**
 * 标记接口所需角色。未标记则任意登录用户可访问。
 * @example
 * @Roles('admin')
 * @Roles('admin', 'superadmin')
 */
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles)
