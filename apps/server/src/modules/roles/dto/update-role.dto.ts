import { UpdateRoleSchema } from '@shared/schemas/role'
import { createZodDto } from 'nestjs-zod'

export class UpdateRoleDto extends createZodDto(UpdateRoleSchema) {}
