import { Injectable, OnModuleDestroy } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import Redis from 'ioredis'

@Injectable()
export class RedisService implements OnModuleDestroy {
  private readonly client: Redis

  constructor(private readonly configService: ConfigService) {
    const redisUrl = this.configService.get<string>('REDIS_URL')
    if (!redisUrl) {
      throw new Error('REDIS_URL 未配置')
    }
    this.client = new Redis(redisUrl, {
      maxRetriesPerRequest: 3,
      enableReadyCheck: true,
      retryStrategy: (times) => Math.min(times * 200, 2000),
    })
    this.client.on('error', (err) => {
      console.error('[Redis] 连接错误:', err.message)
    })
  }

  /**
   * 健康检查: PING Redis
   */
  async ping(): Promise<boolean> {
    try {
      const res = await this.client.ping()
      return res === 'PONG'
    } catch {
      return false
    }
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    if (ttlSeconds && ttlSeconds > 0) {
      await this.client.set(key, value, 'EX', ttlSeconds)
    } else {
      await this.client.set(key, value)
    }
  }

  async get(key: string): Promise<string | null> {
    return this.client.get(key)
  }

  async del(key: string): Promise<void> {
    await this.client.del(key)
  }

  async exists(key: string): Promise<boolean> {
    const r = await this.client.exists(key)
    return r === 1
  }

  /**
   * 删除匹配模式的所有 key（用 SCAN 避免阻塞，禁用 KEYS）
   */
  async deleteByPattern(pattern: string): Promise<number> {
    let cursor = '0'
    let deleted = 0
    do {
      const [next, keys] = await this.client.scan(cursor, 'MATCH', pattern, 'COUNT', 100)
      cursor = next
      if (keys.length > 0) {
        await this.client.del(...keys)
        deleted += keys.length
      }
    } while (cursor !== '0')
    return deleted
  }

  async onModuleDestroy(): Promise<void> {
    await this.client.quit()
  }
}
