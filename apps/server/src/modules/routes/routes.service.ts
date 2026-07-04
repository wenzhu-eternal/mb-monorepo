import { Injectable, RequestMethod } from '@nestjs/common'
import { METHOD_METADATA, PATH_METADATA } from '@nestjs/common/constants'
import { DiscoveryService, Reflector } from '@nestjs/core'

export interface RouteMeta {
  path: string
  method: string
  controller: string
  handlerName: string
}

// NestJS RequestMethod 是数字枚举，需映射为字符串
const METHOD_NAMES: Record<number, string> = {
  [RequestMethod.GET]: 'GET',
  [RequestMethod.POST]: 'POST',
  [RequestMethod.PUT]: 'PUT',
  [RequestMethod.DELETE]: 'DELETE',
  [RequestMethod.PATCH]: 'PATCH',
  [RequestMethod.OPTIONS]: 'OPTIONS',
  [RequestMethod.HEAD]: 'HEAD',
  [RequestMethod.ALL]: 'ALL',
}

/**
 * 路由扫描服务: 通过 DiscoveryService 遍历所有 controller，提取 path/method 元数据
 */
@Injectable()
export class RoutesService {
  constructor(
    private readonly discoveryService: DiscoveryService,
    private readonly reflector: Reflector,
  ) {}

  list(): RouteMeta[] {
    const controllers = this.discoveryService.getControllers()
    const routes: RouteMeta[] = []

    for (const wrapper of controllers) {
      const instance = wrapper.instance as Record<string, unknown> | undefined
      if (!instance) continue

      const controllerPath = this.reflector.get<string>(
        PATH_METADATA,
        wrapper.metatype as FunctionConstructor,
      )
      if (!controllerPath) continue

      const controllerName = wrapper.metatype?.name ?? 'UnknownController'

      // 遍历 controller 原型上的方法
      const proto = Object.getPrototypeOf(instance) as Record<string, unknown>
      for (const handlerName of Object.getOwnPropertyNames(proto)) {
        if (handlerName === 'constructor') continue
        const handler = proto[handlerName] as ((...args: unknown[]) => unknown) | undefined
        if (typeof handler !== 'function') continue

        const methodPath = this.reflector.get<string>(
          PATH_METADATA,
          handler as unknown as FunctionConstructor,
        )
        // METHOD_METADATA 存的是 RequestMethod 数字枚举，需映射为字符串
        const methodEnum = this.reflector.get<number>(
          METHOD_METADATA,
          handler as unknown as FunctionConstructor,
        )
        if (methodPath === undefined || methodEnum === undefined) continue

        const httpMethod = METHOD_NAMES[methodEnum] ?? 'UNKNOWN'
        const fullPath = `/${controllerPath}/${methodPath}`.replace(/\/+/g, '/')
        routes.push({
          path: fullPath,
          method: httpMethod,
          controller: controllerName,
          handlerName,
        })
      }
    }

    return routes.sort((a, b) =>
      a.path === b.path ? a.method.localeCompare(b.method) : a.path.localeCompare(b.path),
    )
  }
}
