import { z } from 'zod'

const envSchema = z.object({
  // 同源部署时留空，走相对路径；分离部署时配 VITE_API_BASE_URL=http://localhost:9000
  VITE_API_BASE_URL: z.string().default(''),
})

export const env = envSchema.parse(import.meta.env)
