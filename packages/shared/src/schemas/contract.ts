import { z } from 'zod'

export const ContractStatusSchema = z
  .enum(['draft', 'pending', 'in_progress', 'completed', 'cancelled'])
  .meta({ id: 'ContractStatus' })
export type ContractStatus = z.infer<typeof ContractStatusSchema>

export const ContractParticipantRoleSchema = z
  .enum(['client', 'factory'])
  .meta({ id: 'ContractParticipantRole' })
export type ContractParticipantRole = z.infer<typeof ContractParticipantRoleSchema>

export const ContractSigningMethodSchema = z
  .enum(['email', 'kakao', 'none'])
  .meta({ id: 'ContractSigningMethod' })
export type ContractSigningMethod = z.infer<typeof ContractSigningMethodSchema>

export const ContractAuthTypeSchema = z
  .enum(['password', 'mobile_identification', 'mobile_otp'])
  .meta({ id: 'ContractAuthType' })
export type ContractAuthType = z.infer<typeof ContractAuthTypeSchema>

export const CreateContractParticipantSchema = z
  .object({
    role: ContractParticipantRoleSchema,
    name: z.string().min(1).max(100),
    email: z.email({ error: '유효한 이메일을 입력하세요.' }).optional(),
    phone: z.string().optional(),
    signingOrder: z.number().int().positive(),
    signingMethodType: ContractSigningMethodSchema.default('email'),
    authType: ContractAuthTypeSchema.optional(),
  })
  .meta({ id: 'CreateContractParticipant' })
export type CreateContractParticipant = z.infer<typeof CreateContractParticipantSchema>

export const CreateContractSchema = z
  .object({
    templateId: z.string().min(1, 'templateId is required'),
    title: z.string().min(1).max(200),
    participants: z.array(CreateContractParticipantSchema).min(2).max(5),
    quoteRequestId: z.string().optional(),
    acceptedQuoteId: z.string().optional(),
    clientCompanyId: z.string().optional(),
    factoryCompanyId: z.string().optional(),
    expiryMinutes: z.number().int().positive().optional(),
  })
  .meta({ id: 'CreateContract' })
export type CreateContractInput = z.infer<typeof CreateContractSchema>

export const CancelContractSchema = z
  .object({
    reason: z.string().max(500).optional(),
  })
  .meta({ id: 'CancelContract' })
export type CancelContractInput = z.infer<typeof CancelContractSchema>
