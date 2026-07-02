import { Injectable, NotFoundException } from '@nestjs/common'
import { count, desc, eq, ilike } from 'drizzle-orm'
import { db } from '@/db'
import { errorLogs } from '@/db/schema'

export interface RecordErrorLogParams {
  message: string
  stack?: string
  context?: Record<string, unknown>
  userId?: number
  ip?: string
  userAgent?: string
}

export interface PaginatedErrorLogs {
  list: Array<{
    id: number
    message: string
    stack: string | null
    context: unknown
    userId: number | null
    ip: string | null
    userAgent: string | null
    createdAt: Date
  }>
  total: number
  page: number
  pageSize: number
  totalPages: number
}

@Injectable()
export class ErrorLogsService {
  async record(params: RecordErrorLogParams): Promise<void> {
    await db.insert(errorLogs).values({
      message: params.message,
      stack: params.stack,
      context: params.context,
      userId: params.userId,
      ip: params.ip,
      userAgent: params.userAgent,
    })
  }

  async findAll(
    page = 1,
    pageSize = 10,
    keyword?: string,
  ): Promise<PaginatedErrorLogs> {
    const safePage = Math.max(1, page)
    const safePageSize = Math.min(Math.max(1, pageSize), 100)
    const offset = (safePage - 1) * safePageSize

    // 关键词搜索: message 模糊匹配；无关键词查全表
    const baseQuery = db
      .select({
        id: errorLogs.id,
        message: errorLogs.message,
        stack: errorLogs.stack,
        context: errorLogs.context,
        userId: errorLogs.userId,
        ip: errorLogs.ip,
        userAgent: errorLogs.userAgent,
        createdAt: errorLogs.createdAt,
      })
      .from(errorLogs)
      .orderBy(desc(errorLogs.createdAt))
      .limit(safePageSize)
      .offset(offset)

    const countQuery = db.select({ value: count() }).from(errorLogs)

    const [items, countResult] = keyword
      ? await Promise.all([
          baseQuery.where(ilike(errorLogs.message, `%${keyword}%`)),
          countQuery.where(ilike(errorLogs.message, `%${keyword}%`)),
        ])
      : await Promise.all([baseQuery, countQuery])

    const total = countResult[0]?.value ?? 0
    return {
      list: items,
      total,
      page: safePage,
      pageSize: safePageSize,
      totalPages: Math.ceil(total / safePageSize) || 1,
    }
  }

  async findById(id: number) {
    const log = await db.query.errorLogs.findFirst({
      where: eq(errorLogs.id, id),
    })
    if (!log) {
      throw new NotFoundException(`错误日志 ID ${id} 不存在`)
    }
    return log
  }

  async remove(id: number): Promise<{ message: string }> {
    const log = await db.query.errorLogs.findFirst({
      where: eq(errorLogs.id, id),
    })
    if (!log) {
      throw new NotFoundException(`错误日志 ID ${id} 不存在`)
    }
    await db.delete(errorLogs).where(eq(errorLogs.id, id))
    return { message: `错误日志 ID ${id} 已删除` }
  }
}
