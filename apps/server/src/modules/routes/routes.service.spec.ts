import { RequestMethod } from '@nestjs/common'
import { METHOD_METADATA, PATH_METADATA } from '@nestjs/common/constants'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { RoutesService } from './routes.service'

describe('RoutesService', () => {
  let service: RoutesService
  let discoveryService: { getControllers: ReturnType<typeof vi.fn> }
  let reflector: { get: ReturnType<typeof vi.fn> }

  beforeEach(() => {
    vi.clearAllMocks()
    discoveryService = {
      getControllers: vi.fn().mockReturnValue([]),
    }
    reflector = {
      get: vi.fn().mockReturnValue(undefined),
    }
    service = new RoutesService(discoveryService as never, reflector as never)
  })

  describe('list', () => {
    it('空 controllers 列表返回空数组', () => {
      discoveryService.getControllers.mockReturnValue([])

      const result = service.list()
      expect(result).toEqual([])
    })

    it('跳过 instance 为 undefined 的 wrapper', () => {
      discoveryService.getControllers.mockReturnValue([{ instance: undefined, metatype: class {} }])

      const result = service.list()
      expect(result).toEqual([])
    })

    it('跳过没有 controller path 元数据的 wrapper', () => {
      class FakeController {
        list() {}
      }
      const instance = new FakeController()
      discoveryService.getControllers.mockReturnValue([{ instance, metatype: FakeController }])
      // PATH_METADATA on metatype 返回 undefined
      reflector.get.mockReturnValue(undefined)

      const result = service.list()
      expect(result).toEqual([])
    })

    it('从 controller 提取 path/method/controller/handlerName', () => {
      class UserController {
        list() {}
      }
      const instance = new UserController()
      const listHandler = UserController.prototype.list
      discoveryService.getControllers.mockReturnValue([{ instance, metatype: UserController }])

      // reflector.get 按 (key, target) 区分返回值
      reflector.get.mockImplementation((key: string, target: unknown) => {
        if (target === UserController && key === PATH_METADATA) return 'users'
        if (target === listHandler && key === PATH_METADATA) return 'list'
        if (target === listHandler && key === METHOD_METADATA) return RequestMethod.GET
        return undefined
      })

      const result = service.list()

      expect(result).toHaveLength(1)
      expect(result[0]).toEqual({
        path: '/users/list',
        method: 'GET',
        controller: 'UserController',
        handlerName: 'list',
      })
    })

    it('多个 handler 按路径与方法排序', () => {
      class UserController {
        create() {}
        list() {}
      }
      const instance = new UserController()
      const listHandler = UserController.prototype.list
      const createHandler = UserController.prototype.create
      discoveryService.getControllers.mockReturnValue([{ instance, metatype: UserController }])

      reflector.get.mockImplementation((key: string, target: unknown) => {
        if (target === UserController && key === PATH_METADATA) return 'users'
        if (target === listHandler && key === PATH_METADATA) return 'list'
        if (target === listHandler && key === METHOD_METADATA) return RequestMethod.GET
        if (target === createHandler && key === PATH_METADATA) return 'create'
        if (target === createHandler && key === METHOD_METADATA) return RequestMethod.POST
        return undefined
      })

      const result = service.list()

      expect(result).toHaveLength(2)
      // 按 path 字典序: /users/create 在 /users/list 之前
      expect(result[0].path).toBe('/users/create')
      expect(result[0].method).toBe('POST')
      expect(result[1].path).toBe('/users/list')
      expect(result[1].method).toBe('GET')
    })

    it('跳过没有方法元数据的 handler', () => {
      class UserController {
        list() {}
        helper() {} // 无 PATH/METHOD 元数据，应被跳过
      }
      const instance = new UserController()
      const listHandler = UserController.prototype.list
      const helperHandler = UserController.prototype.helper
      discoveryService.getControllers.mockReturnValue([{ instance, metatype: UserController }])

      reflector.get.mockImplementation((key: string, target: unknown) => {
        if (target === UserController && key === PATH_METADATA) return 'users'
        if (target === listHandler && key === PATH_METADATA) return 'list'
        if (target === listHandler && key === METHOD_METADATA) return RequestMethod.GET
        // helper 不返回 PATH_METADATA / METHOD_METADATA
        if (target === helperHandler) return undefined
        return undefined
      })

      const result = service.list()
      expect(result).toHaveLength(1)
      expect(result[0].handlerName).toBe('list')
    })

    it('路径中的多余斜杠被压缩', () => {
      class UserController {
        list() {}
      }
      const instance = new UserController()
      const listHandler = UserController.prototype.list
      discoveryService.getControllers.mockReturnValue([{ instance, metatype: UserController }])

      reflector.get.mockImplementation((key: string, target: unknown) => {
        if (target === UserController && key === PATH_METADATA) return '/users/' // 带斜杠
        if (target === listHandler && key === PATH_METADATA) return '/list' // 带斜杠
        if (target === listHandler && key === METHOD_METADATA) return RequestMethod.GET
        return undefined
      })

      const result = service.list()
      expect(result[0].path).toBe('/users/list')
    })
  })
})
