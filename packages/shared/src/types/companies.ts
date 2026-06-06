export interface CompanyPortfolioItem {
  title: string
  description: string
}

export interface CompanyFilter {
  keyword: string
  industry: string
  region: string
  size: string
}

export type ConfidenceTier =
  | 'A_CERTIFIED_ROOT'
  | 'B_LOCAL_STRONG_INSIDE'
  | 'C_BORDERLINE_INSIDE'
  | 'D_LOW_CONFIDENCE'

export interface Company {
  id: string
  name: string
  industry: string
  region: string
  size: string
  description: string
  headline?: string
  profileColor?: string
  strengths?: string[]
  portfolio?: CompanyPortfolioItem[]
  logo?: string
  tags: string[]
  contactEmail: string
  contactPhone: string
  website: string
  establishedYear: number
  employeeCount: number
  revenue: string
  certifications: string[]
  createdAt: string
  externalId?: string
  confidenceTier?: ConfidenceTier
  processHint?: string
  address?: string
  lat?: number
  lng?: number
  kakaoId?: string
  representative?: string
  sourceTypes?: string[]
}

export interface CompanyListQuery {
  keyword?: string
  industry?: string
  region?: string
  size?: string
  confidenceTier?: ConfidenceTier
  page?: number
  limit?: number
}

export interface CompanyListResponse {
  items: Company[]
  total: number
  page: number
  limit: number
}
