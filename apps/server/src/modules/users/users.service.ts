import { ConflictException, Injectable, NotFoundException } from '@nestjs/common'
import * as argon2 from 'argon2'
import { desc, eq, sql } from 'drizzle-orm'
import { db } from '@/db'
import type { User } from '@/db/schema'
import { users } from '@/db/schema'
import { Cacheable } from '@/modules/cache/cache.decorator'
import { CacheService } from '@/modules/cache/cache.service'

// PostgreSQL 唯一约束违反错误码
function isUniqueViolation(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code: string }).code === '23505'
  )
}

export interface PaginatedUsers {
  list: Omit<User, 'password'>[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

@Injectable()
export class UsersService {
  constructor(private readonly cacheService: CacheService) {}

  async findAll(page = 1, pageSize = 10): Promise<PaginatedUsers> {
    const safePage = Math.max(1, page)
    const safePageSize = Math.min(Math.max(1, pageSize), 100)
    const offset = (safePage - 1) * safePageSize

    const [items, countResult] = await Promise.all([
      db.query.users.findMany({
        limit: safePageSize,
        offset,
        orderBy: [desc(users.createdAt)],
      }),
      db.select({ count: sql<number>`count(*)::int` }).from(users),
    ])

    const total = countResult[0]?.count ?? 0
    const list = items.map(({ password: _, ...rest }) => rest)

    return {
      list,
      total,
      page: safePage,
      pageSize: safePageSize,
      totalPages: Math.ceil(total / safePageSize) || 1,
    }
  }

  async getStats(): Promise<{ totalUsers: number; activeUsers: number }> {
    // 使用聚合查询避免全表扫描，正确统计超过 100 人场景
    const [totalResult, activeResult] = await Promise.all([
      db.select({ count: sql<number>`count(*)::int` }).from(users),
      db.select({ count: sql<number>`count(*)::int` }).from(users).where(eq(users.status, true)),
    ])

    return {
      totalUsers: totalResult[0]?.count ?? 0,
      activeUsers: activeResult[0]?.count ?? 0,
    }
  }

  @Cacheable('user:id', 300)
  async findById(id: number): Promise<Omit<User, 'password'>> {
    const user = await db.query.users.findFirst({
      where: eq(users.id, id),
    })

    if (!user) {
      throw new NotFoundException(`用户 ID ${id} 不存在`)
    }

    const { password: _, ...userWithoutPassword } = user
    return userWithoutPassword
  }

  async create(data: {
    username: string
    email: string
    password: string
    nickname?: string
    phone?: string
  }): Promise<Omit<User, 'password'>> {
    const existingUsername = await db.query.users.findFirst({
      where: eq(users.username, data.username),
    })

    if (existingUsername) {
      throw new ConflictException('用户名已存在')
    }

    const existingEmail = await db.query.users.findFirst({
      where: eq(users.email, data.email),
    })

    if (existingEmail) {
      throw new ConflictException('邮箱已存在')
    }

    const hashedPassword = await argon2.hash(data.password)

    try {
      const [newUser] = await db
        .insert(users)
        .values({
          ...data,
          password: hashedPassword,
        })
        .returning()

      if (!newUser) {
        throw new ConflictException('创建用户失败')
      }

      const { password: _, ...userWithoutPassword } = newUser
      return userWithoutPassword
    } catch (error) {
      // TOCTOU 兜底: 并发场景下唯一约束冲突转 409
      if (isUniqueViolation(error)) {
        throw new ConflictException('用户名或邮箱已存在')
      }
      throw error
    }
  }

  async update(
    id: number,
    data: {
      email?: string
      nickname?: string
      avatar?: string
      phone?: string
      status?: boolean
      password?: string
    },
  ): Promise<Omit<User, 'password'>> {
    const existingUser = await db.query.users.findFirst({
      where: eq(users.id, id),
    })

    if (!existingUser) {
      throw new NotFoundException(`用户 ID ${id} 不存在`)
    }

    // email 唯一性校验（排除自身）
    if (data.email && data.email !== existingUser.email) {
      const duplicateEmail = await db.query.users.findFirst({
        where: eq(users.email, data.email),
      })
      if (duplicateEmail) {
        throw new ConflictException('邮箱已存在')
      }
    }

    const { password: rawPassword, ...rest } = data
    const updateData: Record<string, unknown> = { ...rest, updatedAt: new Date() }
    if (rawPassword) {
      updateData.password = await argon2.hash(rawPassword)
    }

    try {
      const [updatedUser] = await db
        .update(users)
        .set(updateData)
        .where(eq(users.id, id))
        .returning()

      if (!updatedUser) {
        throw new NotFoundException(`更新用户 ID ${id} 失败`)
      }

      const { password: _, ...userWithoutPassword } = updatedUser
      return userWithoutPassword
    } catch (error) {
      // TOCTOU 兜底: 并发场景下 email 唯一约束冲突转 409
      if (isUniqueViolation(error)) {
        throw new ConflictException('邮箱已被占用')
      }
      throw error
    } finally {
      // 更新后清缓存（按 pattern 删除该用户的所有缓存变体）
      await this.cacheService.delByPattern(`cache:user:*${id}*`)
    }
  }

  async remove(id: number): Promise<{ message: string }> {
    const existingUser = await db.query.users.findFirst({
      where: eq(users.id, id),
    })

    if (!existingUser) {
      throw new NotFoundException(`用户 ID ${id} 不存在`)
    }

    await db.delete(users).where(eq(users.id, id))

    // 删除后清缓存
    await this.cacheService.delByPattern(`cache:user:*${id}*`)

    return { message: `用户 ID ${id} 已删除` }
  }
}
