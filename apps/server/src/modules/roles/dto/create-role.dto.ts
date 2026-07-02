import { CreateRoleSchema } from '@shared/schemas/role'
import { createZodDto } from 'nestjs-zod'

export class CreateRoleDto extends createZodDto(CreateRoleSchema) {}
