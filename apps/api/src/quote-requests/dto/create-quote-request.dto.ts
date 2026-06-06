import { CreateQuoteRequestSchema } from '@rootmatching/shared/schemas';
import { createZodDto } from 'nestjs-zod';

export { CreateQuoteRequestSchema } from '@rootmatching/shared/schemas';
export type { CreateQuoteRequestInput } from '@rootmatching/shared/schemas';

export class CreateQuoteRequestDto extends createZodDto(
  CreateQuoteRequestSchema,
) {}
