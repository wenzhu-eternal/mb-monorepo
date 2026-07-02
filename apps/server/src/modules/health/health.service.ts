import { Inject, Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { sql } from 'drizzle-orm'
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js'
import { RedisService } from '@/modules/redis/redis.service'

export interface HealthResult {
  status: 'ok' | 'error'
  timestamp: string
  database: 'ok' | 'error'
  redis: 'ok' | 'error' | 'skipped'
}

@Injectable()
export class HealthService {
  constructor(
    @Inject('DATABASE')
    private readonly db: PostgresJsDatabase<Record<string, never>>,
    private readonly configService: ConfigService,
    private readonly redisService: RedisService,
  ) {}

  async check(): Promise<HealthResult> {
    const result: HealthResult = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      database: 'ok',
      redis: 'skipped',
    }

    // 数据库检查
    try {
      await this.db.execute(sql`SELECT 1`)
    } catch (_error) {
      result.database = 'error'
      result.status = 'error'
    }

    // Redis 检查（仅在配置了 REDIS_URL 时执行）
    const redisUrl = this.configService.get<string>('REDIS_URL')
    if (redisUrl) {
      try {
        const ok = await this.redisService.ping()
        result.redis = ok ? 'ok' : 'error'
        if (!ok) result.status = 'error'
      } catch {
        result.redis = 'error'
        result.status = 'error'
      }
    }

    return result
  }
}
