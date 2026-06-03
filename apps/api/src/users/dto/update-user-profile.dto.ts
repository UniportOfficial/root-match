import { UserProfileUpdateSchema } from '@rootmatching/shared';
import { createZodDto } from 'nestjs-zod';

export class UpdateUserProfileDto extends createZodDto(
  UserProfileUpdateSchema,
) {}
