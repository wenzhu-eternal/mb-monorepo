import { describe, expect, it } from 'vitest'
import { env } from './env'

describe('env', () => {
  it('should parse environment variables correctly', () => {
    expect(env).toBeDefined()
    expect(typeof env.VITE_API_BASE_URL).toBe('string')
    expect(typeof env.VITE_APP_NAME).toBe('string')
    expect(typeof env.VITE_APP_SHORT_NAME).toBe('string')
  })
})
