import { z } from 'zod'

const envSchema = z
  .object({
    DATABASE_URL: z.string().url(),

    // Redis (optional，未接入使用时可不配置)
    REDIS_URL: z.string().url().optional(),

    // JWT: 强制 32 字符以上，防止弱密钥
    JWT_SECRET: z.string().min(32),
    JWT_REFRESH_SECRET: z.string().min(32),

    API_PORT: z.coerce.number().default(9000),
    API_PREFIX: z.string().default('/api/v1'),

    ALLOW_ORIGIN: z.string().default('http://localhost:3000'),

    // Cookie: 字符串 "true"/"false" 正确转 boolean（z.coerce.boolean() 对非空字符串恒为 true，有 bug）
    COOKIE_SECURE: z
      .union([z.boolean(), z.string()])
      .transform((v) => v === true || v === 'true')
      .default(false),

    MAIL_HOST: z.string().optional(),
    MAIL_PORT: z.coerce.number().optional(),
    MAIL_USER: z.string().optional(),
    MAIL_PASSWORD: z.string().optional(),
    MAIL_FROM: z.string().optional(),

    WEAPP_APPID: z.string().optional(),
    WEAPP_SECRET: z.string().optional(),
    // 微信扫码登录回调地址（网站应用 OAuth）
    WECHAT_REDIRECT_URI: z.string().url().optional(),

    // Throttle: 登录接口建议单独更严格限流
    THROTTLE_TTL: z.coerce.number().default(60),
    THROTTLE_LIMIT: z.coerce.number().default(10),

    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  })
  .superRefine((data, ctx) => {
    // 生产环境警告 COOKIE_SECURE 未启用（不强制退出，允许单容器 HTTP 部署配合 ngrok）
    if (data.NODE_ENV === 'production' && !data.COOKIE_SECURE) {
      console.warn(
        '⚠️  生产环境未启用 COOKIE_SECURE，refresh cookie 可能被明文截获。' +
          '若通过 ngrok(https) 或反向代理终结 SSL，请在 .env 设置 COOKIE_SECURE=true',
      )
    }
  })

export type Env = z.infer<typeof envSchema>

let validatedEnv: Env | null = null

export function validateEnv() {
  if (validatedEnv) {
    return validatedEnv
  }

  const result = envSchema.safeParse(process.env)

  if (!result.success) {
    console.error('❌ Invalid environment variables:')
    console.error(result.error.flatten().fieldErrors)
    process.exit(1)
  }

  validatedEnv = result.data
  return validatedEnv
}

export function getEnv() {
  if (!validatedEnv) {
    return validateEnv()
  }
  return validatedEnv
}
