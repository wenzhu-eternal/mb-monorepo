import {
  type CallHandler,
  type ExecutionContext,
  Injectable,
  type NestInterceptor,
} from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { type Observable, of, tap } from 'rxjs'
import { CACHE_KEY_METADATA, CACHE_TTL_METADATA } from './cache.decorator'
import { CacheService } from './cache.service'

@Injectable()
export class CacheInterceptor implements NestInterceptor {
  constructor(
    private readonly cacheService: CacheService,
    private readonly reflector: Reflector,
  ) {}

  async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<unknown>> {
    const cacheKey = this.reflector.get<string>(CACHE_KEY_METADATA, context.getHandler())
    const cacheTtl = this.reflector.get<number>(CACHE_TTL_METADATA, context.getHandler()) ?? 60

    if (!cacheKey) {
      return next.handle()
    }

    // 解析 key 中的 :param 占位符（从请求参数中取）
    const request = context.switchToHttp().getRequest()
    const args = context.getArgs()
    const resolvedKey = this.resolveKey(cacheKey, request, args)

    const cached = await this.cacheService.get(resolvedKey)
    if (cached !== null) {
      return of(cached)
    }

    return next.handle().pipe(
      tap((data) => {
        // 仅缓存成功响应（data 非空）
        if (data !== null && data !== undefined) {
          void this.cacheService.set(resolvedKey, data, cacheTtl)
        }
      }),
    )
  }

  /**
   * 解析缓存 key: 替换 :param 占位符
   * 支持 :id（从 body/params/query 取 id 字段）和 :userId（从 user.sub 取）
   */
  private resolveKey(key: string, request: unknown, args: unknown[]): string {
    let resolved = key

    const req = request as { params?: Record<string, string>; user?: { sub?: number } }
    if (req.params) {
      for (const [paramName, paramValue] of Object.entries(req.params)) {
        resolved = resolved.replace(`:${paramName}`, String(paramValue))
      }
    }

    if (req.user?.sub) {
      resolved = resolved.replace(':userId', String(req.user.sub))
    }

    args.forEach((arg, index) => {
      if (typeof arg === 'number' || typeof arg === 'string') {
        resolved = resolved.replace(`:arg${index}`, String(arg))
      }
    })

    return `cache:${resolved}`
  }
}
