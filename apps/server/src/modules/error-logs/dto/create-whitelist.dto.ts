import { CreateErrorWhitelistSchema } from '@shared/schemas/error-log'
import { createZodDto } from 'nestjs-zod'

export class CreateWhitelistDto extends createZodDto(CreateErrorWhitelistSchema) {}
