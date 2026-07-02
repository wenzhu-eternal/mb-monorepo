import { LoginSchema } from '@shared/schemas/user'
import { createZodDto } from 'nestjs-zod'

export class LoginDto extends createZodDto(LoginSchema) {}
