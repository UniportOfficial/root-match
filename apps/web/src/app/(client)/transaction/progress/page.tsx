import { redirect } from 'next/navigation'

const DEFAULT_TRANSACTION_ID = 'TXN-2026-018'

export default function TransactionProgressAliasPage() {
  redirect(`/transactions/${DEFAULT_TRANSACTION_ID}`)
}
