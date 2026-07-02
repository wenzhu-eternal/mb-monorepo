import { ConflictException, Injectable, NotFoundException } from '@nestjs/common'
import { desc, eq, sql } from 'drizzle-orm'
import { db } from '@/db'
import type { Role } from '@/db/schema'
import { roles, users } from '@/db/schema'

export interface PaginatedRoles {
  list: Role[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

@Injectable()
export class RolesService {
  async findAll(page = 1, pageSize = 10): Promise<PaginatedRoles> {
    const safePage = Math.max(1, page)
    const safePageSize = Math.min(Math.max(1, pageSize), 100)
    const offset = (safePage - 1) * safePageSize

    const [items, countResult] = await Promise.all([
      db.query.roles.findMany({
        limit: safePageSize,
        offset,
        orderBy: [desc(roles.createdAt)],
      }),
      db.select({ count: sql<number>`count(*)::int` }).from(roles),
    ])

    const total = countResult[0]?.count ?? 0

    return {
      list: items,
      total,
      page: safePage,
      pageSize: safePageSize,
      totalPages: Math.ceil(total / safePageSize) || 1,
    }
  }

  async findById(id: number): Promise<Role> {
    const role = await db.query.roles.findFirst({ where: eq(roles.id, id) })
    if (!role) {
      throw new NotFoundException(`角色 ID ${id} 不存在`)
    }
    return role
  }

  async create(data: { name: string; description?: string }): Promise<Role> {
    const existing = await db.query.roles.findFirst({ where: eq(roles.name, data.name) })
    if (existing) {
      throw new ConflictException('角色名已存在')
    }

    const [created] = await db.insert(roles).values(data).returning()
    if (!created) {
      throw new ConflictException('创建角色失败')
    }
    return created
  }

  async update(
    id: number,
    data: { name?: string; description?: string },
  ): Promise<Role> {
    const existing = await db.query.roles.findFirst({ where: eq(roles.id, id) })
    if (!existing) {
      throw new NotFoundException(`角色 ID ${id} 不存在`)
    }

    if (data.name && data.name !== existing.name) {
      const dup = await db.query.roles.findFirst({ where: eq(roles.name, data.name) })
      if (dup) {
        throw new ConflictException('角色名已存在')
      }
    }

    const [updated] = await db
      .update(roles)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(roles.id, id))
      .returning()

    if (!updated) {
      throw new NotFoundException(`更新角色 ID ${id} 失败`)
    }
    return updated
  }

  async remove(id: number): Promise<{ message: string }> {
    const existing = await db.query.roles.findFirst({ where: eq(roles.id, id) })
    if (!existing) {
      throw new NotFoundException(`角色 ID ${id} 不存在`)
    }

    // 防止删除仍被用户引用的角色
    const userCount = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(users)
      .where(eq(users.roleId, id))
    const count = userCount[0]?.count ?? 0
    if (count > 0) {
      throw new ConflictException(`该角色仍被 ${count} 个用户使用，无法删除`)
    }

    await db.delete(roles).where(eq(roles.id, id))
    return { message: `角色 ID ${id} 已删除` }
  }
}
