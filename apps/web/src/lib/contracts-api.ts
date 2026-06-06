import { z } from 'zod'
import { ContractStatusSchema } from '@rootmatching/shared/schemas'

export const ContractListParticipantSchema = z.object({
  role: z.string(),
  name: z.string(),
  email: z.string().nullable().optional(),
  phone: z.string().nullable().optional(),
  status: z.string().optional(),
})

export const ContractListItemSchema = z.object({
  id: z.string(),
  title: z.string(),
  status: ContractStatusSchema,
  factoryCompanyId: z.string().nullable().optional(),
  createdAt: z.string(),
  cancelledAt: z.string().nullable().optional(),
  cancelledReason: z.string().nullable().optional(),
  participants: z.array(ContractListParticipantSchema),
})

export type ContractListItem = z.infer<typeof ContractListItemSchema>

export interface ListMyContractsParams {
  apiUrl: string
}

export type ListMyContractsResult =
  | { ok: true; data: ContractListItem[] }
  | { ok: false; message: string }

export async function mapContractError(response: Response): Promise<string> {
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

  if (status === 401) return '다시 로그인이 필요합니다'
  if (status === 403) return '이 작업을 수행할 권한이 없습니다'
  if (status === 404) return '계약 정보를 찾을 수 없어요'
  if (status === 409) return '이미 발송된 계약입니다. 잠시 후 다시 확인해주세요'
  if (status === 400 && bodyText.includes('signingcontactinfo')) {
    return '참여자 연락처를 확인하고 다시 시도해주세요'
  }
  if (status === 400) return '입력값을 확인해주세요'
  if (status >= 500) return '서버 응답이 지연되고 있어요. 잠시 후 다시 시도해주세요'
  return '요청을 처리할 수 없어요. 잠시 후 다시 시도해주세요'
}

export interface CancelContractParams {
  apiUrl: string
  contractId: string
  reason?: string
  timeoutMs?: number
}

export async function cancelContract({
  apiUrl,
  contractId,
  reason,
  timeoutMs = 10000,
}: CancelContractParams): Promise<Response> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs)
  try {
    return await fetch(`${apiUrl}/contracts/${contractId}/cancel`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(reason ? { reason } : {}),
      signal: controller.signal,
    })
  } finally {
    clearTimeout(timeoutId)
  }
}

export async function listMyContracts({
  apiUrl,
}: ListMyContractsParams): Promise<ListMyContractsResult> {
  try {
    const response = await fetch(`${apiUrl}/contracts/me`, {
      credentials: 'include',
    })

    if (!response.ok) {
      const message = await mapContractError(response)
      return { ok: false, message }
    }

    const json = (await response.json()) as unknown
    const parsed = z.array(ContractListItemSchema).safeParse(json)
    if (!parsed.success) {
      return { ok: false, message: '계약 정보를 불러올 수 없어요. 잠시 후 다시 시도해주세요' }
    }

    return { ok: true, data: parsed.data }
  } catch (error) {
    console.warn('Contract list fetch failed', error)
    return { ok: false, message: '서버 응답이 지연되고 있어요. 잠시 후 다시 시도해주세요' }
  }
}
