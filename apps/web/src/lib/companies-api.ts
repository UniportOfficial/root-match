import type { CompanyListQuery, CompanyListResponse } from '@rootmatching/shared'

export type FetchCompaniesResult =
  | { ok: true; data: CompanyListResponse }
  | { ok: false; message: string }

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
