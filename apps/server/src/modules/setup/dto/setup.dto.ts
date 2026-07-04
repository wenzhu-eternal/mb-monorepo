import { SetupSchema } from '@shared/schemas/setup'
import { createZodDto } from 'nestjs-zod'

export class SetupDto extends createZodDto(SetupSchema) {}
