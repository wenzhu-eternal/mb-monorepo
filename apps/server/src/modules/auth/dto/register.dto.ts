import { RegisterWithCodeSchema } from '@shared/schemas/user'
import { createZodDto } from 'nestjs-zod'

export class RegisterDto extends createZodDto(RegisterWithCodeSchema) {}
