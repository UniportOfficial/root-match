import { CompanySummaryResponseSchema } from '@rootmatching/shared'
import type {
  CompanyDetail,
  CompanyListQuery,
  CompanyListResponse,
  CompanySummaryResponse,
} from '@rootmatching/shared'

export type FetchCompaniesResult =
  | { ok: true; data: CompanyListResponse }
  | { ok: false; message: string }

export type FetchCompanyDetailResult =
  | { ok: true; data: CompanyDetail }
  | {
      ok: false
      reason: 'unauthenticated' | 'not-found' | 'error'
      message: string
    }

export interface FetchCompanySummaryOptions {
  apiUrl?: string
  cookie?: string
}

function buildQueryString(query: CompanyListQuery): string {
  const params = new URLSearchParams()
  if (query.keyword) params.set('keyword', query.keyword)
  if (query.industry) params.set('industry', query.industry)
  if (query.region) params.set('region', query.region)
  if (query.size) params.set('size', query.size)
  if (query.confidenceTier) params.set('confidenceTier', query.confidenceTier)
  if (query.page) params.set('page', String(query.page))
  if (query.limit) params.set('limit', String(query.limit))
  const qs = params.toString()
  return qs ? `?${qs}` : ''
}

export async function fetchCompanies(
  apiUrl: string,
  query: CompanyListQuery = {},
): Promise<FetchCompaniesResult> {
  try {
    const response = await fetch(`${apiUrl}/companies${buildQueryString(query)}`, {
      credentials: 'include',
    })
    if (response.status === 401) {
      return { ok: false, message: 'unauthenticated' }
    }
    if (!response.ok) {
      return { ok: false, message: `HTTP ${response.status}` }
    }
    const data = (await response.json()) as CompanyListResponse
    return { ok: true, data }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'network error'
    return { ok: false, message }
  }
}

export async function fetchCompanySummary(
  options: FetchCompanySummaryOptions = {},
): Promise<CompanySummaryResponse> {
  const apiUrl = options.apiUrl ?? process.env.NEXT_PUBLIC_API_URL ?? ''
  const response = await fetch(`${apiUrl}/companies/summary`, {
    credentials: 'include',
    headers: options.cookie ? { cookie: options.cookie } : undefined,
  })

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`)
  }

  const json: unknown = await response.json()
  return CompanySummaryResponseSchema.parse(json)
}

async function readDetailResponse(response: Response): Promise<FetchCompanyDetailResult> {
  if (response.status === 401) {
    return { ok: false, reason: 'unauthenticated', message: 'unauthenticated' }
  }
  if (response.status === 404) {
    return { ok: false, reason: 'not-found', message: 'company not found' }
  }
  if (!response.ok) {
    return { ok: false, reason: 'error', message: `HTTP ${response.status}` }
  }
  const data = (await response.json()) as CompanyDetail
  return { ok: true, data }
}

export async function fetchCompanyDetail(
  apiUrl: string,
  id: string,
): Promise<FetchCompanyDetailResult> {
  try {
    const response = await fetch(`${apiUrl}/companies/${encodeURIComponent(id)}`, {
      credentials: 'include',
    })
    return readDetailResponse(response)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'network error'
    return { ok: false, reason: 'error', message }
  }
}

export async function fetchCompanyDetailServer(
  apiUrl: string,
  id: string,
  cookieHeader: string,
): Promise<FetchCompanyDetailResult> {
  try {
    const response = await fetch(`${apiUrl}/companies/${encodeURIComponent(id)}`, {
      headers: { cookie: cookieHeader },
      cache: 'no-store',
    })
    return readDetailResponse(response)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'network error'
    return { ok: false, reason: 'error', message }
  }
}
