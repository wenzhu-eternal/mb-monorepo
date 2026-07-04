import { Global, Module } from '@nestjs/common'
import { CacheInterceptor } from './cache.interceptor'
import { CacheService } from './cache.service'

@Global()
@Module({
  providers: [CacheService, CacheInterceptor],
  exports: [CacheService, CacheInterceptor],
})
export class CacheModule {}
