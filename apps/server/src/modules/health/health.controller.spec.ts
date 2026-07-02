import { ServiceUnavailableException } from '@nestjs/common'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { HealthController } from './health.controller'
import type { HealthResult, HealthService } from './health.service'

describe('HealthController', () => {
  let controller: HealthController
  let service: HealthService

  beforeEach(() => {
    service = {
      check: vi.fn(),
    } as unknown as HealthService

    controller = new HealthController(service)
  })

  it('should be defined', () => {
    expect(controller).toBeDefined()
  })

  describe('check', () => {
    it('should return health status', async () => {
      const mockResult: HealthResult = {
        status: 'ok',
        timestamp: new Date().toISOString(),
        database: 'ok',
        redis: 'ok',
      }

      vi.mocked(service.check).mockResolvedValue(mockResult)

      const result = await controller.check()

      expect(result).toEqual(mockResult)
      expect(service.check).toHaveBeenCalledOnce()
    })

    it('should throw 503 when database error', async () => {
      const mockResult: HealthResult = {
        status: 'error',
        timestamp: new Date().toISOString(),
        database: 'error',
        redis: 'error',
      }

      vi.mocked(service.check).mockResolvedValue(mockResult)

      // DB 异常时控制器抛 503，便于探针据此重启
      await expect(controller.check()).rejects.toThrow(ServiceUnavailableException)
      expect(service.check).toHaveBeenCalledOnce()
    })
  })
})
