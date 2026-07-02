import { UpdateUserSchema } from '@shared/schemas/user'
import { createZodDto } from 'nestjs-zod'

export class UpdateUserDto extends createZodDto(UpdateUserSchema) {}
