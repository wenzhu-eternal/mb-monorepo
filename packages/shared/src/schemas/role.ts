import { z } from 'zod'

export const RoleSchema = z.object({
  id: z.number().int().positive(),
  name: z.string().min(1).max(50),
  description: z.string().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
})

export const CreateRoleSchema = z.object({
  name: z.string().min(1).max(50),
  description: z.string().optional(),
})

export const UpdateRoleSchema = z.object({
  name: z.string().min(1).max(50).optional(),
  description: z.string().optional(),
})

export type Role = z.infer<typeof RoleSchema>
export type CreateRole = z.infer<typeof CreateRoleSchema>
export type UpdateRole = z.infer<typeof UpdateRoleSchema>
