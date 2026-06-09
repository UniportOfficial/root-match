import { z } from 'zod'

export const CompanyUpdateSchema = z
  .object({
    name: z.string().min(1, '회사명을 입력하세요.').optional(),
    industry: z.string().min(1, '업종을 입력하세요.').optional(),
    region: z.string().min(1, '지역을 입력하세요.').optional(),
    size: z.string().min(1, '회사 규모를 입력하세요.').optional(),
    description: z.string().min(1, '회사 소개를 입력하세요.').optional(),
    contactEmail: z.email({ error: '유효한 이메일을 입력하세요.' }).optional(),
    contactPhone: z.string().min(1, '연락처를 입력하세요.').optional(),
    website: z.url({ error: '유효한 URL을 입력하세요.' }).optional(),
    establishedYear: z.number().int().min(1800).max(2100).optional(),
    employeeCount: z.number().int().min(0).optional(),
    revenue: z.string().min(1, '매출 규모를 입력하세요.').optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: '수정할 회사 정보를 입력하세요.',
  })
  .meta({ id: 'CompanyUpdate' })

export type CompanyUpdate = z.infer<typeof CompanyUpdateSchema>

export const ConfidenceTierSchema = z.enum([
  'A_CERTIFIED_ROOT',
  'B_LOCAL_STRONG_INSIDE',
  'C_BORDERLINE_INSIDE',
  'D_LOW_CONFIDENCE',
])

export const CompanyListQuerySchema = z
  .object({
    keyword: z.string().min(1).optional(),
    industry: z.string().min(1).optional(),
    region: z.string().min(1).optional(),
    size: z.string().min(1).optional(),
    confidenceTier: ConfidenceTierSchema.optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
  })
  .meta({ id: 'CompanyListQuery' })

export type CompanyListQueryParsed = z.infer<typeof CompanyListQuerySchema>

export const QuoteRequestStatusCountsSchema = z.object({
  pending: z.number().int().nonnegative(),
  awaitingResponse: z.number().int().nonnegative(),
  decisionRequired: z.number().int().nonnegative(),
  ongoing: z.number().int().nonnegative(),
})

export const ConfidenceTierCountsSchema = z.object({
  A_CERTIFIED_ROOT: z.number().int().nonnegative(),
  B_LOCAL_STRONG_INSIDE: z.number().int().nonnegative(),
  C_BORDERLINE_INSIDE: z.number().int().nonnegative(),
  D_LOW_CONFIDENCE: z.number().int().nonnegative(),
})

export const RegionDistributionItemSchema = z.object({
  region: z.string(),
  count: z.number().int().nonnegative(),
})

export const MonthlyAmountItemSchema = z.object({
  month: z.string().regex(/^\d{4}-\d{2}$/),
  amount: z.number().nonnegative(),
  isCurrent: z.boolean(),
})

export const CompanySummaryResponseSchema = z.object({
  totalCompanies: z.number().int().nonnegative(),
  verifiedCompanies: z.number().int().nonnegative(),
  activeRegions: z.number().int().nonnegative(),
  confidenceTierCounts: ConfidenceTierCountsSchema,
  regionDistribution: z.array(RegionDistributionItemSchema),
  quoteRequestStatusCounts: QuoteRequestStatusCountsSchema,
  pendingInquiries: z.number().int().nonnegative(),
  currentMonthAmount: z.number().nonnegative(),
  escrowBalance: z.number().nonnegative(),
  settlementPending: z.number().nonnegative(),
  settlementPendingDueDate: z.string(),
  settlementCompleted: z.number().nonnegative(),
  monthlyAmounts: z.array(MonthlyAmountItemSchema),
  unreadMessages: z.number().int().nonnegative(),
  meta: z.object({
    mockFields: z.array(z.string()),
  }),
})
