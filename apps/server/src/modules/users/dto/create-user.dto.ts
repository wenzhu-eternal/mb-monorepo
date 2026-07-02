import { CreateUserSchema } from '@shared/schemas/user'
import { createZodDto } from 'nestjs-zod'

export class CreateUserDto extends createZodDto(CreateUserSchema) {}
