import {
  CancelContractSchema,
  CreateContractSchema,
} from '@rootmatching/shared/schemas';
import { createZodDto } from 'nestjs-zod';

export {
  CancelContractSchema,
  CreateContractParticipantSchema,
  CreateContractSchema,
  ContractStatusSchema,
  ContractParticipantRoleSchema,
  ContractSigningMethodSchema,
  ContractAuthTypeSchema,
} from '@rootmatching/shared/schemas';

export type {
  CancelContractInput,
  CreateContractInput,
  CreateContractParticipant,
  ContractStatus,
  ContractParticipantRole,
  ContractSigningMethod,
  ContractAuthType,
} from '@rootmatching/shared/schemas';

export class CreateContractDto extends createZodDto(CreateContractSchema) {}

export class CancelContractDto extends createZodDto(CancelContractSchema) {}
