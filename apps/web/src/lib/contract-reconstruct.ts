import type { CompanyDetail, ContractStatus, FactoryRecommendation } from '@rootmatching/shared'
import { fetchCompanyDetail } from '@/lib/companies-api'

interface ContractRecordLike {
  id: string
  title?: string | null
  status?: ContractStatus
  factoryCompanyId?: string | null
  clientCompanyId?: string | null
  quoteRequestId?: string | null
  acceptedQuoteId?: string | null
  participants?: Array<{
    role?: string
    name?: string
    email?: string | null
    phone?: string | null
  }>
}

export interface ReconstructedWorkflow {
  contractId: string
  contractTitle: string
  factory: FactoryRecommendation
  quoteRequestId: string | null
  acceptedQuoteId: string | null
}

export type ReconstructResult =
  | { ok: true; data: ReconstructedWorkflow }
  | {
      ok: false
      reason: 'unauthenticated' | 'not-found' | 'missing-factory' | 'error'
      message: string
    }

function companyDetailToFactoryRecommendation(
  detail: CompanyDetail,
  contract: ContractRecordLike,
): FactoryRecommendation {
  const profile = detail.factoryProfile
  const factoryParticipant = contract.participants?.find((p) => p.role === 'factory')

  const aiReason = contract.title
    ? `${contract.title} 계약에 매칭된 공장입니다.`
    : '계약에 매칭된 공장입니다.'

  return {
    id: detail.id,
    name: detail.name,
    location: profile?.location ?? detail.address ?? detail.region ?? detail.industry ?? '-',
    processes: profile?.processes ?? [],
    trustScore: profile?.trustScore ?? 0,
    deliveryRate: profile?.deliveryRate ?? 0,
    reorderRate: profile?.reorderRate ?? 0,
    estimateMin: profile?.estimateMin ?? 0,
    estimateMax: profile?.estimateMax ?? 0,
    aiReason,
    qualityScore: profile?.qualityScore ?? 0,
    deliveryScore: profile?.deliveryScore ?? 0,
    priceCompetitiveness: profile?.priceCompetitiveness ?? 0,
    contactEmail: detail.contactEmail || factoryParticipant?.email || undefined,
    contactPhone: detail.contactPhone || factoryParticipant?.phone || undefined,
    employeeCount: detail.employeeCount,
    industrialComplex: profile?.industrialComplex ?? undefined,
    reorderCustomerCount: profile?.reorderCustomerCount ?? undefined,
    externalId: detail.externalId,
    region: detail.region,
    industry: detail.industry,
    confidenceTier: detail.confidenceTier,
    processHint: detail.processHint,
  }
}

async function fetchContractRecord(
  apiUrl: string,
  contractId: string,
): Promise<
  | { ok: true; data: ContractRecordLike }
  | { ok: false; reason: 'unauthenticated' | 'not-found' | 'error'; message: string }
> {
  try {
    const response = await fetch(`${apiUrl}/contracts/${encodeURIComponent(contractId)}`, {
      credentials: 'include',
    })
    if (response.status === 401) {
      return { ok: false, reason: 'unauthenticated', message: 'unauthenticated' }
    }
    if (response.status === 404) {
      return { ok: false, reason: 'not-found', message: 'contract not found' }
    }
    if (!response.ok) {
      return { ok: false, reason: 'error', message: `HTTP ${response.status}` }
    }
    const data = (await response.json()) as ContractRecordLike
    return { ok: true, data }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'network error'
    return { ok: false, reason: 'error', message }
  }
}

export async function reconstructContractWorkflow(
  apiUrl: string,
  contractId: string,
): Promise<ReconstructResult> {
  const contractResult = await fetchContractRecord(apiUrl, contractId)
  if (!contractResult.ok) {
    return { ok: false, reason: contractResult.reason, message: contractResult.message }
  }

  const contract = contractResult.data
  const factoryCompanyId = contract.factoryCompanyId
  if (!factoryCompanyId) {
    return {
      ok: false,
      reason: 'missing-factory',
      message: '계약에 공장 정보가 연결되어 있지 않습니다.',
    }
  }

  const companyResult = await fetchCompanyDetail(apiUrl, factoryCompanyId)
  if (!companyResult.ok) {
    return {
      ok: false,
      reason: companyResult.reason,
      message: companyResult.message,
    }
  }

  const factory = companyDetailToFactoryRecommendation(companyResult.data, contract)

  return {
    ok: true,
    data: {
      contractId: contract.id,
      contractTitle: contract.title ?? '복구된 계약',
      factory,
      quoteRequestId: contract.quoteRequestId ?? null,
      acceptedQuoteId: contract.acceptedQuoteId ?? null,
    },
  }
}
