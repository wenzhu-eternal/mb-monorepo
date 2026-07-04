import { UpdateErrorWhitelistSchema } from '@shared/schemas/error-log'
import { createZodDto } from 'nestjs-zod'

export class UpdateWhitelistDto extends createZodDto(UpdateErrorWhitelistSchema) {}
