import { SetMetadata } from '@nestjs/common'

export const CACHE_KEY_METADATA = 'cache:key'
export const CACHE_TTL_METADATA = 'cache:ttl'

/**
 * 方法级缓存装饰器: 自动缓存返回值
 * @param key 缓存 key（支持 :id 占位符，会从参数中取 id 字段）
 * @param ttl 缓存 TTL（秒），默认 60
 *
 * @example
 * @Cacheable('user:id', 300)
 * async findById(id: number) { ... }
 *
 * @Cacheable('users:list', 60)
 * async findAll() { ... }
 */
export const Cacheable = (key: string, ttl = 60): MethodDecorator => {
  return (target, propertyKey, descriptor) => {
    SetMetadata(CACHE_KEY_METADATA, key)(target, propertyKey, descriptor)
    SetMetadata(CACHE_TTL_METADATA, ttl)(target, propertyKey, descriptor)
  }
}
