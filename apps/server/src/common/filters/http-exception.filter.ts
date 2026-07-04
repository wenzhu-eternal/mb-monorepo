import {
  type ArgumentsHost,
  Catch,
  type ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common'
import { eq } from 'drizzle-orm'
import type { Request, Response } from 'express'
import { appendErrorLog } from '@/common/logger'
import { db } from '@/db'
import { errorLogs } from '@/db/schema'
import { errorWhitelist } from '@/db/schema/error-whitelist'

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name)

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp()
    const response = ctx.getResponse<Response>()
    const request = ctx.getRequest<Request>()

    let status = HttpStatus.INTERNAL_SERVER_ERROR
    let message = '服务器内部错误'
    let shouldRecordToDb = false

    if (exception instanceof HttpException) {
      status = exception.getStatus()
      const exceptionResponse = exception.getResponse()

      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse
      } else if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
        const responseObj = exceptionResponse as Record<string, unknown>
        message = (responseObj.message as string) || exception.message
      } else {
        message = exception.message
      }

      // 5xx 错误入库（4xx 视为客户端错误，不记录）
      shouldRecordToDb = status >= 500
    } else if (exception instanceof Error) {
      // 非业务异常（未捕获的运行时错误）入库
      shouldRecordToDb = true
      this.logger.error(exception.stack || exception.message)
    }

    // 先写文件日志兜底（无论 DB 是否成功都不丢）
    if (shouldRecordToDb) {
      const stack = exception instanceof Error ? exception.stack : undefined
      appendErrorLog(`${request.method} ${request.url} [${status}] ${message}`, stack)
    }

    // 异步入库错误日志（不阻塞响应），带白名单过滤
    if (shouldRecordToDb) {
      this.recordErrorLog(exception, request).catch((err) => {
        this.logger.error('[ErrorLogs] 入库失败:', err)
      })
    }

    response.status(status).json({
      code: status,
      message,
      data: null,
    })
  }

  /**
   * 记录错误日志到 DB，支持白名单过滤（matchType: message/url）
   */
  private async recordErrorLog(exception: unknown, request: Request): Promise<void> {
    const message = exception instanceof Error ? exception.message : String(exception)
    const stack = exception instanceof Error ? exception.stack : undefined

    // 白名单过滤: 查询全部激活白名单，按 matchType 匹配
    try {
      const whitelist = await db
        .select({
          pattern: errorWhitelist.pattern,
          matchType: errorWhitelist.matchType,
        })
        .from(errorWhitelist)
        .where(eq(errorWhitelist.isActive, true))

      const isMatched = whitelist.some((w) => {
        const target = w.matchType === 'url' ? request.url : message
        return target.includes(w.pattern)
      })
      if (isMatched) {
        return
      }
    } catch {
      // 白名单查询失败不影响主流程
    }

    const userPayload = (request as { user?: { sub?: number } }).user
    const forwardedFor = request.headers['x-forwarded-for'] as string | undefined
    const ip = forwardedFor?.split(',')[0]?.trim() ?? request.ip

    await db.insert(errorLogs).values({
      message,
      stack,
      context: {
        method: request.method,
        url: request.url,
        body: (request as { sanitizedBody?: unknown }).sanitizedBody ?? request.body,
      },
      userId: userPayload?.sub,
      ip,
      userAgent: request.headers['user-agent'] ?? null,
    })
  }
}
