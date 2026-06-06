import { z } from 'zod'
import {
  UpdateQuoteRequestSchema,
  type UpdateQuoteRequestInput,
} from '@rootmatching/shared/schemas'

const QuoteRequestStatusSchema = z.enum([
  'NEW',
  'REVIEWING',
  'MATCHED',
  'QUOTED',
  'CONTRACTED',
  'CANCELLED',
])

const MatchingSourceSchema = z.enum(['DETERMINISTIC_MOCK', 'OPENAI_ADAPTER', 'MANUAL_ADMIN'])

export const QuoteRequestSchema = z.object({
  id: z.string(),
  clientUserId: z.string(),
  clientCompanyId: z.string().nullable().optional(),
  projectName: z.string(),
  processType: z.string(),
  productItem: z.string(),
  estimatedQuantity: z.string(),
  desiredDeadline: z.string(),
  budgetRange: z.string(),
  detailRequirements: z.string(),
  status: QuoteRequestStatusSchema,
  createdAt: z.string(),
  updatedAt: z.string(),
})

export const MatchRecommendationSchema = z.object({
  id: z.string(),
  quoteRequestId: z.string(),
  factoryId: z.string(),
  score: z.number(),
  qualityScore: z.number(),
  deliveryScore: z.number(),
  priceScore: z.number(),
  trustScore: z.number(),
  reason: z.string(),
  estimateMin: z.number(),
  estimateMax: z.number(),
  source: MatchingSourceSchema,
  createdAt: z.string(),
})

export const QuoteRequestDetailSchema = QuoteRequestSchema.extend({
  recommendations: z.array(MatchRecommendationSchema),
})

export type QuoteRequest = z.infer<typeof QuoteRequestSchema>
export type QuoteRequestStatus = z.infer<typeof QuoteRequestStatusSchema>
export type MatchRecommendation = z.infer<typeof MatchRecommendationSchema>
export type QuoteRequestDetail = z.infer<typeof QuoteRequestDetailSchema>
export type { UpdateQuoteRequestInput }

interface BaseQuoteRequestParams {
  apiUrl: string
  signal?: AbortSignal
  timeoutMs?: number
}

export interface GetMyQuoteRequestParams extends BaseQuoteRequestParams {
  id: string
}

export interface UpdateMyQuoteRequestParams extends GetMyQuoteRequestParams {
  input: UpdateQuoteRequestInput
}

export type QuoteRequestsApiResult<T> =
  | { ok: true; data: T }
  | { ok: false; message: string; status?: number }

function createTimeoutSignal(signal: AbortSignal | undefined, timeoutMs: number) {
  const controller = new AbortController()
  const timeoutId = window.setTimeout(() => controller.abort(), timeoutMs)

  function abortFromParent() {
    controller.abort()
  }

  if (signal) {
    if (signal.aborted) {
      controller.abort()
    } else {
      signal.addEventListener('abort', abortFromParent, { once: true })
    }
  }

  return {
    signal: controller.signal,
    cleanup: () => {
      window.clearTimeout(timeoutId)
      signal?.removeEventListener('abort', abortFromParent)
    },
  }
}

export async function mapQuoteRequestError(response: Response): Promise<string> {
  const status = response.status
  let bodyText = ''
  try {
    const body = (await response.json()) as { message?: unknown; error?: unknown }
    const msg = typeof body.message === 'string' ? body.message : ''
    const err = typeof body.error === 'string' ? body.error : ''
    bodyText = `${msg} ${err}`.toLowerCase()
  } catch {
    bodyText = ''
  }

  if (status === 401) return '로그인 후 견적 요청을 확인할 수 있습니다'
  if (status === 403) return '접근 권한이 없습니다'
  if (status === 404) return '견적 요청을 찾을 수 없습니다'
  if (status === 409 && bodyText.includes('projectname')) {
    return '이미 동일한 프로젝트명으로 등록된 요청이 있습니다.'
  }
  if (status === 409 && bodyText.includes('contracted')) return '체결된 요청은 변경할 수 없습니다'
  if (status === 409 && bodyText.includes('cancelled')) return '취소된 요청은 변경할 수 없습니다'
  if (status === 409) return '현재 상태에서는 요청을 변경할 수 없습니다'
  if (status === 400) return '입력값을 확인해주세요'
  if (status >= 500) return '서버 응답이 지연되고 있어요. 잠시 후 다시 시도해주세요'
  return '요청을 처리할 수 없어요. 잠시 후 다시 시도해주세요'
}

async function requestJson<T>({
  apiUrl,
  path,
  method = 'GET',
  body,
  schema,
  signal,
  timeoutMs = 10000,
}: BaseQuoteRequestParams & {
  path: string
  method?: 'GET' | 'PATCH' | 'DELETE'
  body?: unknown
  schema: z.ZodType<T>
}): Promise<QuoteRequestsApiResult<T>> {
  const timeout = createTimeoutSignal(signal, timeoutMs)
  try {
    const response = await fetch(`${apiUrl}${path}`, {
      method,
      credentials: 'include',
      headers: body ? { 'Content-Type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined,
      signal: timeout.signal,
    })

    if (!response.ok) {
      const message = await mapQuoteRequestError(response)
      return { ok: false, message, status: response.status }
    }

    const json = (await response.json()) as unknown
    const parsed = schema.safeParse(json)
    if (!parsed.success) {
      return { ok: false, message: '견적 요청 정보를 불러올 수 없어요. 잠시 후 다시 시도해주세요' }
    }

    return { ok: true, data: parsed.data }
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError' && signal?.aborted) {
      return { ok: false, message: '요청이 취소되었습니다' }
    }
    console.warn('Quote request API failed', error)
    return { ok: false, message: '서버 응답이 지연되고 있어요. 잠시 후 다시 시도해주세요' }
  } finally {
    timeout.cleanup()
  }
}

export async function listMyQuoteRequests({
  apiUrl,
  signal,
  timeoutMs,
}: BaseQuoteRequestParams): Promise<QuoteRequestsApiResult<QuoteRequest[]>> {
  return requestJson({
    apiUrl,
    path: '/quote-requests',
    schema: z.array(QuoteRequestSchema),
    signal,
    timeoutMs,
  })
}

export async function getMyQuoteRequest({
  apiUrl,
  id,
  signal,
  timeoutMs,
}: GetMyQuoteRequestParams): Promise<QuoteRequestsApiResult<QuoteRequestDetail>> {
  return requestJson({
    apiUrl,
    path: `/quote-requests/${id}`,
    schema: QuoteRequestDetailSchema,
    signal,
    timeoutMs,
  })
}

export async function updateMyQuoteRequest({
  apiUrl,
  id,
  input,
  signal,
  timeoutMs,
}: UpdateMyQuoteRequestParams): Promise<QuoteRequestsApiResult<QuoteRequest>> {
  const parsed = UpdateQuoteRequestSchema.safeParse(input)
  if (!parsed.success) return { ok: false, message: '변경된 내용을 확인해주세요', status: 400 }

  return requestJson({
    apiUrl,
    path: `/quote-requests/${id}`,
    method: 'PATCH',
    body: parsed.data,
    schema: QuoteRequestSchema,
    signal,
    timeoutMs,
  })
}

export async function cancelMyQuoteRequest({
  apiUrl,
  id,
  signal,
  timeoutMs,
}: GetMyQuoteRequestParams): Promise<QuoteRequestsApiResult<QuoteRequest>> {
  return requestJson({
    apiUrl,
    path: `/quote-requests/${id}`,
    method: 'DELETE',
    schema: QuoteRequestSchema,
    signal,
    timeoutMs,
  })
}
