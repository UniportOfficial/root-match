'use client'

import Link from 'next/link'
import { Plus } from 'lucide-react'
import { useUserState } from '@/state/UserContext'
import { cn } from '@/lib/utils'
import type { AccountType } from '@rootmatching/shared'

interface HeaderNewQuoteButtonProps {
  className?: string
}

export function HeaderNewQuoteButton({ className }: HeaderNewQuoteButtonProps) {
  const { currentUser } = useUserState()
  const accountType = currentUser?.accountType as AccountType | undefined

  if (accountType !== 'client') return null

  return (
    <Link
      href="/request"
      className={cn(
        'hidden h-12 items-center gap-1.5 rounded-pill bg-primary px-5 text-rm-body-d font-bold text-primary-foreground shadow-toss-sm transition-all hover:bg-primary/90 hover:shadow-toss-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background sm:inline-flex',
        className,
      )}
    >
      <Plus className="h-4 w-4 shrink-0" aria-hidden="true" />
      <span className="text-kr-keep">새 견적</span>
    </Link>
  )
}
