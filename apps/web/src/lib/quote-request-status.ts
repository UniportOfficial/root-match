import type { BadgeProps } from '@/components/ui/badge'

export const QUOTE_REQUEST_STATUS_VALUES = [
  'NEW',
  'REVIEWING',
  'MATCHED',
  'QUOTED',
  'CONTRACTED',
  'CANCELLED',
] as const

export type QuoteRequestStatus = (typeof QUOTE_REQUEST_STATUS_VALUES)[number]

export const QUOTE_REQUEST_STATUS_LABELS: Record<QuoteRequestStatus, string> = {
  NEW: '공장 검토 전',
  REVIEWING: '공장 검토 중',
  MATCHED: '매칭 완료',
  QUOTED: '견적 도착',
  CONTRACTED: '계약 체결',
  CANCELLED: '요청 취소됨',
}

export const QUOTE_REQUEST_BADGE_VARIANTS: Record<QuoteRequestStatus, BadgeProps['variant']> = {
  NEW: 'info',
  REVIEWING: 'warning',
  MATCHED: 'success',
  QUOTED: 'success',
  CONTRACTED: 'success',
  CANCELLED: 'destructive',
}

export const QUOTE_REQUEST_APP_BADGE_VARIANTS: Record<
  QuoteRequestStatus,
  'blue' | 'amber' | 'green' | 'red'
> = {
  NEW: 'blue',
  REVIEWING: 'amber',
  MATCHED: 'green',
  QUOTED: 'green',
  CONTRACTED: 'green',
  CANCELLED: 'red',
}

export function isTerminalQuoteRequestStatus(status: QuoteRequestStatus): boolean {
  return status === 'CANCELLED' || status === 'CONTRACTED'
}

export function terminalQuoteRequestEditMessage(status: QuoteRequestStatus): string | null {
  if (status === 'CANCELLED') return '취소된 요청은 수정할 수 없습니다'
  if (status === 'CONTRACTED') return '체결된 요청은 수정할 수 없습니다'
  return null
}

export function formatKoreanDate(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return iso
  return new Intl.DateTimeFormat('ko-KR', { dateStyle: 'medium' }).format(date)
}

export function formatKoreanDateTime(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return iso
  return new Intl.DateTimeFormat('ko-KR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date)
}
