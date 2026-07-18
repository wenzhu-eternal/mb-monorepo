import { forwardRef, Global, MiddlewareConsumer, Module, NestModule } from '@nestjs/common'
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core'
import { ZodSerializerInterceptor } from 'nestjs-zod'
import { ErrorLogsModule } from '@/modules/error-logs/error-logs.module'
import { HttpExceptionFilter } from './filters/http-exception.filter'
import { ResponseInterceptor } from './interceptors/response.interceptor'
import { SanitizeMiddleware } from './middleware/sanitize.middleware'

@Global()
@Module({
  imports: [forwardRef(() => ErrorLogsModule)],
  providers: [
    // 请求方向: Response → ZodSerializer → Controller
    // 响应方向: Controller → ZodSerializer(校验原始返回值) → Response(包装成 {code, message, data})
    // ZodSerializer 必须在 Response 之后注册，才能拿到 controller 的原始返回值
    {
      provide: APP_INTERCEPTOR,
      useClass: ResponseInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: ZodSerializerInterceptor,
    },
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },
  ],
})
export class CommonModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(SanitizeMiddleware).forRoutes('*')
  }
}
