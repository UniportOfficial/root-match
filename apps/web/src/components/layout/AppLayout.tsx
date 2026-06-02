'use client'

import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'
import { AppHeader } from '@/components/layout/AppHeader'
import { AppSidebar } from '@/components/layout/AppSidebar'

interface AppLayoutProps {
  children: ReactNode
  className?: string
}

export function AppLayout({ children, className }: AppLayoutProps) {
  return (
    <div
      className={cn(
        'min-h-screen bg-surface-muted lg:grid lg:grid-cols-[260px_minmax(0,1fr)]',
        className,
      )}
    >
      <aside className="hidden border-r border-border bg-white lg:block">
        <AppSidebar />
      </aside>
      <div className="flex min-h-screen flex-col">
        <AppHeader />
        <main className="flex-1">{children}</main>
      </div>
    </div>
  )
}
