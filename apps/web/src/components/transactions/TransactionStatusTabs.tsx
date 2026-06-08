'use client'

import type { ComponentType } from 'react'
import Link from 'next/link'
import { AlertTriangle, Briefcase, FileSignature } from 'lucide-react'
import { cn } from '@/lib/utils'

export type TransactionStatusKey = 'contracts' | 'transactions' | 'disputes'

interface TabItem {
  key: TransactionStatusKey
  href: string
  label: string
  icon: ComponentType<{ className?: string }>
}

const TABS: TabItem[] = [
  { key: 'contracts', href: '/contracts', label: '계약', icon: FileSignature },
  { key: 'transactions', href: '/transactions', label: '진행 중', icon: Briefcase },
  { key: 'disputes', href: '/disputes', label: '분쟁', icon: AlertTriangle },
]

interface TransactionStatusTabsProps {
  current: TransactionStatusKey
  className?: string
}

export function TransactionStatusTabs({ current, className }: TransactionStatusTabsProps) {
  return (
    <nav
      aria-label="거래 단계"
      className={cn(
        'mb-6 inline-flex max-w-full flex-wrap gap-1 rounded-pill bg-muted/50 p-1',
        className,
      )}
    >
      {TABS.map((tab) => {
        const Icon = tab.icon
        const active = tab.key === current
        return (
          <Link
            key={tab.key}
            href={tab.href}
            aria-current={active ? 'page' : undefined}
            className={cn(
              'inline-flex min-h-tap-min items-center gap-2 rounded-pill px-4 py-2 text-rm-body-d font-bold transition-colors',
              active
                ? 'bg-card text-foreground shadow-toss-sm'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            <Icon className="h-4 w-4 shrink-0" />
            <span className="text-kr-keep">{tab.label}</span>
          </Link>
        )
      })}
    </nav>
  )
}
