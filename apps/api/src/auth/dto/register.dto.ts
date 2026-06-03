import { RegisterSchema } from '@rootmatching/shared';
import { createZodDto } from 'nestjs-zod';

export class RegisterDto extends createZodDto(RegisterSchema) {}
