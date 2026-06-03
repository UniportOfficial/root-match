import {
  CompanyUpdateSchema,
  LoginSchema,
  QuoteRequestDraftSchema,
  RegisterSchema,
  UserProfileSchema,
  UserProfileUpdateSchema,
} from '@rootmatching/shared';
import { createZodDto } from 'nestjs-zod';

class LoginOpenApiDto extends createZodDto(LoginSchema) {}
class RegisterOpenApiDto extends createZodDto(RegisterSchema) {}
class UserProfileOpenApiDto extends createZodDto(UserProfileSchema) {}
class UserProfileUpdateOpenApiDto extends createZodDto(
  UserProfileUpdateSchema,
) {}
class CompanyUpdateOpenApiDto extends createZodDto(CompanyUpdateSchema) {}
class QuoteRequestDraftOpenApiDto extends createZodDto(
  QuoteRequestDraftSchema,
) {}

export const swaggerExtraModels = [
  LoginOpenApiDto,
  RegisterOpenApiDto,
  UserProfileOpenApiDto,
  UserProfileUpdateOpenApiDto,
  CompanyUpdateOpenApiDto,
  QuoteRequestDraftOpenApiDto,
];
