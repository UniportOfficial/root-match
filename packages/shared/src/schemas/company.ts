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
