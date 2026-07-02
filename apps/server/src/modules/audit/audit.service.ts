import { Injectable, NotFoundException } from '@nestjs/common'
import { count, desc, eq } from 'drizzle-orm'
import { db } from '@/db'
import { auditLogs } from '@/db/schema'

export interface RecordAuditLogParams {
  userId: number
  action: string
  resource: string
  resourceId?: number
  oldValue?: Record<string, unknown>
  newValue?: Record<string, unknown>
  ip?: string
  userAgent?: string
}

export interface PaginatedAuditLogs {
  list: Array<{
    id: number
    userId: number
    action: string
    resource: string
    resourceId: number | null
    oldValue: unknown
    newValue: unknown
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
export class AuditService {
  async record(params: RecordAuditLogParams): Promise<void> {
    await db.insert(auditLogs).values({
      userId: params.userId,
      action: params.action,
      resource: params.resource,
      resourceId: params.resourceId,
      oldValue: params.oldValue,
      newValue: params.newValue,
      ip: params.ip,
      userAgent: params.userAgent,
    })
  }

  async findAll(page = 1, pageSize = 10): Promise<PaginatedAuditLogs> {
    const safePage = Math.max(1, page)
    const safePageSize = Math.min(Math.max(1, pageSize), 100)
    const offset = (safePage - 1) * safePageSize

    const [items, countResult] = await Promise.all([
      db
        .select({
          id: auditLogs.id,
          userId: auditLogs.userId,
          action: auditLogs.action,
          resource: auditLogs.resource,
          resourceId: auditLogs.resourceId,
          oldValue: auditLogs.oldValue,
          newValue: auditLogs.newValue,
          ip: auditLogs.ip,
          userAgent: auditLogs.userAgent,
          createdAt: auditLogs.createdAt,
        })
        .from(auditLogs)
        .limit(safePageSize)
        .offset(offset)
        .orderBy(desc(auditLogs.createdAt)),
      db.select({ value: count() }).from(auditLogs),
    ])

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
    const log = await db.query.auditLogs.findFirst({
      where: eq(auditLogs.id, id),
    })
    if (!log) {
      throw new NotFoundException(`审计日志 ID ${id} 不存在`)
    }
    return log
  }
}
