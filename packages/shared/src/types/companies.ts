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

export interface QuoteRequestStatusCounts {
  pending: number
  awaitingResponse: number
  decisionRequired: number
  ongoing: number
}

export interface ConfidenceTierCounts {
  A_CERTIFIED_ROOT: number
  B_LOCAL_STRONG_INSIDE: number
  C_BORDERLINE_INSIDE: number
  D_LOW_CONFIDENCE: number
}

export interface RegionDistributionItem {
  region: string
  count: number
}

export interface MonthlyAmountItem {
  month: string
  amount: number
  isCurrent: boolean
}

export interface CompanySummaryResponse {
  totalCompanies: number
  verifiedCompanies: number
  activeRegions: number
  confidenceTierCounts: ConfidenceTierCounts
  regionDistribution: RegionDistributionItem[]
  quoteRequestStatusCounts: QuoteRequestStatusCounts
  pendingInquiries: number
  currentMonthAmount: number
  escrowBalance: number
  settlementPending: number
  settlementPendingDueDate: string
  settlementCompleted: number
  monthlyAmounts: MonthlyAmountItem[]
  unreadMessages: number
  meta: {
    mockFields: string[]
  }
}

export interface CompanyFactoryProfile {
  isSynthesized: boolean
  location: string | null
  processes: string[]
  trustScore: number
  deliveryRate: number
  reorderRate: number
  qualityScore: number
  deliveryScore: number
  priceCompetitiveness: number
  estimateMin: number
  estimateMax: number
  industrialComplex: string | null
  reorderCustomerCount: number | null
  verified: boolean
  specialty: string[]
  equipment: string[]
  products: string[]
  monthlyCapacity: string | null
  clients: string[]
  qualitySatisfaction: number | null
  avgResponseTime: string | null
}

export interface CompanyDetail extends Company {
  factoryProfile: CompanyFactoryProfile | null
}
