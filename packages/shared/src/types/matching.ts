export interface QuoteRequestDraft {
  projectName: string
  processType: string
  productItem: string
  estimatedQuantity: string
  desiredDeadline: string
  budgetRange: string
  detailRequirements: string
}

export interface FactoryRecommendation {
  id: string
  name: string
  location: string
  processes: string[]
  matchScore?: number
  trustScore: number
  deliveryRate: number
  reorderRate: number
  reorderCustomerCount?: number
  distanceKm?: number
  employeeCount?: number
  industrialComplex?: string
  estimateMin: number
  estimateMax: number
  aiReason: string
  aiReasonBullets?: string[]
  qualityScore: number
  deliveryScore: number
  priceCompetitiveness: number
  contactEmail?: string
  contactPhone?: string
}

export interface FactoryPortfolioItem {
  id: number
  image: string
  title: string
  process: string
  period: string
}

export interface FactoryReview {
  id: number
  author: string
  company: string
  rating: number
  content: string
  product: string
  date: string
}

export interface FactoryKpi {
  deliveryRate: number
  qualitySatisfaction: number
  reorderRate: number
  avgResponseTime: string
}

export interface FactoryDetail {
  id: string
  name: string
  location: string
  image: string
  verified: boolean
  trustScore: number
  specialty: string[]
  equipment: string[]
  products: string[]
  monthlyCapacity: string
  clients: string[]
  kpi: FactoryKpi
  portfolio: FactoryPortfolioItem[]
  reviews: FactoryReview[]
}
