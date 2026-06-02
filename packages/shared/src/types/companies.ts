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
}
