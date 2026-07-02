import {
  type ArgumentsHost,
  Catch,
  type ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common'
import type { Request, Response } from 'express'
import { eq } from 'drizzle-orm'
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
    let message = 'Internal server error'
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
   * 记录错误日志到 DB，支持白名单过滤
   */
  private async recordErrorLog(exception: unknown, request: Request): Promise<void> {
    const message = exception instanceof Error ? exception.message : String(exception)
    const stack = exception instanceof Error ? exception.stack : undefined

    // 白名单过滤: 查询全部激活白名单，若 message 包含任一 pattern 则跳过
    try {
      const whitelist = await db
        .select({ pattern: errorWhitelist.pattern })
        .from(errorWhitelist)
        .where(eq(errorWhitelist.isActive, true))

      if (whitelist.some((w) => message.includes(w.pattern))) {
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
        body: request.body,
      },
      userId: userPayload?.sub,
      ip,
      userAgent: request.headers['user-agent'] ?? null,
    })
  }
}

