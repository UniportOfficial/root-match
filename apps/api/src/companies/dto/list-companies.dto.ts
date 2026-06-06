import { CompanyListQuerySchema } from '@rootmatching/shared';
import { createZodDto } from 'nestjs-zod';

export class ListCompaniesDto extends createZodDto(CompanyListQuerySchema) {}
