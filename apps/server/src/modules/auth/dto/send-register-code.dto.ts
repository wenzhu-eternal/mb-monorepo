import { SendRegisterCodeSchema } from '@shared/schemas/user'
import { createZodDto } from 'nestjs-zod'

export class SendRegisterCodeDto extends createZodDto(SendRegisterCodeSchema) {}
