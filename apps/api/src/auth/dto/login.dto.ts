import { LoginSchema } from '@rootmatching/shared';
import { createZodDto } from 'nestjs-zod';

export class LoginDto extends createZodDto(LoginSchema) {}
