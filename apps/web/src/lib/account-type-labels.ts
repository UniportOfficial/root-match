import type { AccountType } from '@rootmatching/shared'

const ACCOUNT_TYPE_LABELS: Record<AccountType, string> = {
  client: '발주처 회원',
  factory: '공장 회원',
}

export function getAccountTypeLabel(accountType: AccountType | null | undefined): string {
  if (!accountType) return '회원'
  return ACCOUNT_TYPE_LABELS[accountType] ?? '회원'
}
