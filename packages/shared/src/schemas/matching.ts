import { z } from 'zod'
import type { QuoteRequestDraft } from '../types/matching.js'

export const QuoteRequestDraftSchema = z
  .object({
    projectName: z.string().min(1, '프로젝트명을 입력하세요.'),
    processType: z.string().min(1, '공정 유형을 선택하세요.'),
    productItem: z.string().min(1, '제작 품목을 입력하세요.'),
    estimatedQuantity: z.string().min(1, '예상 수량을 입력하세요.'),
    desiredDeadline: z.string().min(1, '희망 납기를 입력하세요.'),
    budgetRange: z.string().min(1, '예산 범위를 입력하세요.'),
    detailRequirements: z.string().min(1, '상세 요구사항을 입력하세요.'),
  })
  .meta({ id: 'QuoteRequestDraft' })

type QuoteRequestDraftSchemaType = z.infer<typeof QuoteRequestDraftSchema>

const _quoteRequestDraftSchemaMatchesType = true satisfies [QuoteRequestDraftSchemaType] extends [
  QuoteRequestDraft,
]
  ? [QuoteRequestDraft] extends [QuoteRequestDraftSchemaType]
    ? true
    : never
  : never

void _quoteRequestDraftSchemaMatchesType
