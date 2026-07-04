import { describe, expect, it } from 'vitest'
import { env } from './env'

describe('env', () => {
  it('should parse environment variables correctly', () => {
    expect(env).toBeDefined()
    expect(typeof env.VITE_API_BASE_URL).toBe('string')
  })

  it('should have default value for VITE_API_BASE_URL', () => {
    expect(env.VITE_API_BASE_URL).toBe('')
  })
})
