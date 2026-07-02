import { z } from 'zod'

export const PaginationQuerySchema = z.object({
  page: z.number().int().positive().default(1),
  pageSize: z.number().int().positive().max(100).default(10),
  sort: z.string().optional(),
  order: z.enum(['asc', 'desc']).default('desc'),
})

export const PaginatedResponseSchema = <T extends z.ZodTypeAny>(itemSchema: T) =>
  z.object({
    list: z.array(itemSchema),
    total: z.number().int().positive(),
    page: z.number().int().positive(),
    pageSize: z.number().int().positive(),
    totalPages: z.number().int().positive(),
  })

export type PaginationQuery = z.infer<typeof PaginationQuerySchema>
export type PaginatedResponse<T> = {
  list: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}
