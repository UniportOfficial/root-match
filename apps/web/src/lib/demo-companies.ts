import type { Company, CompanyDetail } from '@rootmatching/shared'
import { mockFactoryRecommendations } from '@rootmatching/shared/fixtures/factory-data'

function regionFromLocation(location: string): string {
  if (location.includes('서울')) return '서울'
  if (location.includes('인천')) return '인천'
  if (location.includes('경기')) return '경기'
  return '수도권'
}

export function getDemoCompanies(): Company[] {
  return mockFactoryRecommendations.map((factory, index) => ({
    id: factory.id,
    name: factory.name,
    industry: '제조/생산',
    region: regionFromLocation(factory.location),
    size: factory.employeeCount && factory.employeeCount >= 30 ? '중소기업' : '스타트업',
    description: factory.aiReason,
    headline: factory.processes.join(' · '),
    strengths: factory.aiReasonBullets,
    tags: factory.processes,
    contactEmail: factory.contactEmail ?? 'contact@rootmatching.demo',
    contactPhone: factory.contactPhone ?? '02-0000-0000',
    website: '',
    establishedYear: 2018 + (index % 5),
    employeeCount: factory.employeeCount ?? 10,
    revenue: '정보 준비 중',
    certifications: factory.trustScore >= 90 ? ['인증 뿌리기업'] : [],
    createdAt: new Date(2026, 0, index + 1).toISOString(),
    confidenceTier: factory.trustScore >= 90 ? 'A_CERTIFIED_ROOT' : 'B_LOCAL_STRONG_INSIDE',
    processHint: factory.processes[0] ?? '제조/생산',
    address: factory.location,
  }))
}

export function getDemoCompanyDetail(id: string): CompanyDetail | null {
  const company = getDemoCompanies().find((nextCompany) => nextCompany.id === id)
  const factory = mockFactoryRecommendations.find((nextFactory) => nextFactory.id === id)

  if (!company || !factory) return null

  return {
    ...company,
    factoryProfile: {
      isSynthesized: true,
      location: factory.location,
      processes: factory.processes,
      trustScore: factory.trustScore,
      deliveryRate: factory.deliveryRate,
      reorderRate: factory.reorderRate,
      qualityScore: factory.qualityScore,
      deliveryScore: factory.deliveryScore,
      priceCompetitiveness: factory.priceCompetitiveness,
      estimateMin: factory.estimateMin,
      estimateMax: factory.estimateMax,
      industrialComplex: factory.industrialComplex ?? null,
      reorderCustomerCount: factory.reorderCustomerCount ?? null,
      verified: factory.trustScore >= 90,
      specialty: factory.processes,
      equipment: [],
      products: [company.processHint ?? '제조 품목'],
      monthlyCapacity: null,
      clients: [],
      qualitySatisfaction: null,
      avgResponseTime: '2시간 이내',
    },
  }
}
