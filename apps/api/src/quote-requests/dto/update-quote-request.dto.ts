import { UpdateQuoteRequestSchema } from '@rootmatching/shared/schemas';
import { createZodDto } from 'nestjs-zod';

export { UpdateQuoteRequestSchema } from '@rootmatching/shared/schemas';
export type { UpdateQuoteRequestInput } from '@rootmatching/shared/schemas';

export class UpdateQuoteRequestDto extends createZodDto(
  UpdateQuoteRequestSchema,
) {}
