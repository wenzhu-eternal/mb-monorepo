import {
  type CanActivate,
  type ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { and, eq, inArray } from 'drizzle-orm'
import type { Request } from 'express'
import { PERMISSIONS_KEY } from '@/common/decorators/permissions.decorator'
import { db } from '@/db'
import { notDeleted } from '@/db/helpers'
import { permissions, rolePermissions, users } from '@/db/schema'

interface AuthenticatedRequest extends Request {
  user?: {
    sub: number
    username: string
    email: string
  }
}

/**
 * 权限守卫: 根据 @Permissions(...) 元数据校验当前用户是否拥有指定权限
 * 通过 users.roleId → role_permissions.permission 获取用户权限码列表
 * admin 用户名视为拥有所有权限
 */
@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermissions = this.reflector.getAllAndOverride<string[] | undefined>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    )

    // 未标记 @Permissions 则放行
    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true
    }

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>()
    const userPayload = request.user
    if (!userPayload) {
      throw new ForbiddenException('未认证用户')
    }

    // admin 用户名视为拥有所有权限
    if (userPayload.username === 'admin') {
      return true
    }

    // 查询用户
    const userRecord = await db.query.users.findFirst({
      where: and(eq(users.id, userPayload.sub), notDeleted(users.deletedAt)),
    })
    if (!userRecord?.roleId) {
      throw new ForbiddenException('权限不足，未分配角色')
    }

    // 查询用户权限码（role_permissions 是关联表无软删除，permissions 软删除在 code 查询时过滤）
    const userPermissions = await db
      .select({ permission: rolePermissions.permission })
      .from(rolePermissions)
      .where(eq(rolePermissions.roleId, userRecord.roleId))

    const permissionCodes = userPermissions.map((p) => p.permission)

    // 检查是否拥有所有必需权限（权限码匹配）
    const hasAll = requiredPermissions.every((p) => permissionCodes.includes(p))
    if (hasAll) {
      return true
    }

    // 权限码不足时，检查路由权限白名单（取并集，非仅第一个）
    const permissionRecords =
      permissionCodes.length > 0
        ? await db.query.permissions.findMany({
            where: and(
              inArray(permissions.code, permissionCodes),
              notDeleted(permissions.deletedAt),
            ),
          })
        : []

    const allowedRoutes = permissionRecords.flatMap((p) => p.routes ?? [])

    // 检查当前请求是否在允许的路由中
    const currentMethod = request.method
    const currentPath = request.path
    const currentRoute = `${currentMethod} ${currentPath}`

    // 检查是否匹配（支持通配符）
    const isAllowed = allowedRoutes.some((route) => {
      // 精确匹配
      if (route === currentRoute) return true
      // 通配符匹配 (如 GET /api/users/*)
      if (route.endsWith('*')) {
        const prefix = route.slice(0, -1)
        return currentRoute.startsWith(prefix)
      }
      return false
    })

    if (!isAllowed) {
      throw new ForbiddenException(`权限不足，需要: ${requiredPermissions.join(', ')}`)
    }

    return true
  }
}
