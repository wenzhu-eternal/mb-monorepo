import { z } from 'zod'

export const FileSchema = z.object({
  id: z.number().int().positive(),
  filename: z.string(),
  originalName: z.string(),
  mimeType: z.string(),
  size: z.number().int().nonnegative(),
  path: z.string(),
  uploadedBy: z.number().int().positive().nullable().optional(),
  createdAt: z.date(),
})

export type FileRecord = z.infer<typeof FileSchema>
