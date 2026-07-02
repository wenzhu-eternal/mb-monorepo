import { z } from 'zod'

export const ApiResponseSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
  z.object({
    code: z.number().int(),
    message: z.string(),
    data: dataSchema.nullable(),
  })

export const ErrorCodeSchema = z.enum([
  'SUCCESS',
  'BAD_REQUEST',
  'UNAUTHORIZED',
  'FORBIDDEN',
  'NOT_FOUND',
  'INTERNAL_SERVER_ERROR',
  'USER_NOT_FOUND',
  'USER_ALREADY_EXISTS',
  'INVALID_PASSWORD',
  'INVALID_TOKEN',
  'TOKEN_EXPIRED',
])

export type ErrorCode = z.infer<typeof ErrorCodeSchema>
