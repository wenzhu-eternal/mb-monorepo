import { Global, Module, type OnModuleDestroy } from '@nestjs/common'
import { client, db } from './index'

@Global()
@Module({
  providers: [
    {
      provide: 'DATABASE',
      useValue: db,
    },
  ],
  exports: ['DATABASE'],
})
export class DatabaseModule implements OnModuleDestroy {
  // 优雅关闭: 应用退出时释放 postgres 连接池，避免连接泄漏
  async onModuleDestroy() {
    await client.end({ timeout: 5 })
  }
}
