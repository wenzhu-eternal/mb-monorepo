import { Injectable, NestMiddleware } from '@nestjs/common'
import type { Request, Response } from 'express'

// 需要脱敏的字段名（小写匹配）
const SENSITIVE_FIELDS = [
  'password',
  'passwd',
  'token',
  'accesstoken',
  'refreshtoken',
  'secret',
  'authorization',
  'creditcard',
  'idcard',
  'phonenumber',
]

const MASK = '***REDACTED***'

/**
 * 数据脱敏中间件: 克隆 body 并脱敏敏感字段后赋回 req.body
 * 用于日志记录场景（AuditInterceptor / HttpExceptionFilter），避免敏感信息落盘
 *
 * 实现方式: 将脱敏后的 body 存到 req.sanitizedBody，日志记录时取此字段
 */
@Injectable()
export class SanitizeMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: () => void) {
    if (req.body && typeof req.body === 'object') {
      req.sanitizedBody = this.sanitize(req.body)
    }
    next()
  }

  /**
   * 递归脱敏对象中的敏感字段
   */
  private sanitize(obj: unknown): unknown {
    if (Array.isArray(obj)) {
      return obj.map((item) => this.sanitize(item))
    }

    if (obj && typeof obj === 'object') {
      const result: Record<string, unknown> = {}
      for (const [key, value] of Object.entries(obj)) {
        const lowerKey = key.toLowerCase()
        if (SENSITIVE_FIELDS.some((field) => lowerKey.includes(field))) {
          result[key] = MASK
        } else if (value && typeof value === 'object') {
          result[key] = this.sanitize(value)
        } else {
          result[key] = value
        }
      }
      return result
    }

    return obj
  }
}

// 扩展 Express Request 类型
declare module 'express' {
  interface Request {
    sanitizedBody?: unknown
  }
}
