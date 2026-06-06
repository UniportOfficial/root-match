import { z } from 'zod'

export const CreateQuoteRequestSchema = z
  .object({
    projectName: z.string().min(1).max(200),
    processType: z.string().min(1).max(100),
    productItem: z.string().min(1),
    estimatedQuantity: z.string().min(1).max(200),
    desiredDeadline: z.string().min(1).max(50),
    budgetRange: z.string().min(1).max(100),
    detailRequirements: z.string().min(1),
  })
  .meta({ id: 'CreateQuoteRequest' })
export type CreateQuoteRequestInput = z.infer<typeof CreateQuoteRequestSchema>
