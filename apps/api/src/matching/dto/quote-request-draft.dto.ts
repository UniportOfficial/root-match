import { QuoteRequestDraftSchema } from '@rootmatching/shared';
import { createZodDto } from 'nestjs-zod';

export class QuoteRequestDraftDto extends createZodDto(
  QuoteRequestDraftSchema,
) {}
