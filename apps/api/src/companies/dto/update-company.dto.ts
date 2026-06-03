import { CompanyUpdateSchema } from '@rootmatching/shared';
import { createZodDto } from 'nestjs-zod';

export class UpdateCompanyDto extends createZodDto(CompanyUpdateSchema) {}
