import {
  type CallHandler,
  type ExecutionContext,
  Injectable,
  type NestInterceptor,
} from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import type { Observable } from 'rxjs'
import { tap } from 'rxjs'
import { AuditService } from '@/modules/audit/audit.service'

export const AUDIT_ACTION_KEY = 'audit_action'
export const AUDIT_RESOURCE_KEY = 'audit_resource'

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(
    private readonly reflector: Reflector,
    private readonly auditService: AuditService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest()
    const method = request.method

    if (!['POST', 'PATCH', 'DELETE'].includes(method)) {
      return next.handle()
    }

    const action = this.reflector.get<string>(AUDIT_ACTION_KEY, context.getHandler()) ?? method
    const resource =
      this.reflector.get<string>(AUDIT_RESOURCE_KEY, context.getHandler()) ??
      context.getClass().name

    // 修复: AuthGuard 设置的 payload 字段为 sub（非 id）
    const userId = request.user?.sub as number | undefined
    // 反向代理下 request.ip 是代理 IP，取 x-forwarded-for 第一段作为真实客户端 IP
    const forwardedFor = request.headers['x-forwarded-for'] as string | undefined
    const ip = forwardedFor?.split(',')[0]?.trim() ?? request.ip
    const userAgent = request.headers['user-agent'] as string | undefined
    const resourceId = request.params?.id as string | undefined

    return next.handle().pipe(
      tap((data) => {
        // 审计失败不应阻断主业务，仅记录错误日志
        if (userId) {
          this.auditService
            .record({
              userId,
              action,
              resource,
              resourceId: resourceId ? Number(resourceId) : undefined,
              newValue: data as Record<string, unknown> | undefined,
              ip,
              userAgent,
            })
            .catch((err) => console.error('[Audit] 记录审计日志失败:', err))
        }
      }),
    )
  }
}
