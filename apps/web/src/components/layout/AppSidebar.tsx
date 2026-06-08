'use client'

import { Fragment, useMemo } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { PanelLeftClose } from 'lucide-react'
import { Logo } from '@/components/brand/Logo'
import { useUserState } from '@/state/UserContext'
import { buildSidebarNav } from '@/lib/sidebar-nav'
import { cn } from '@/lib/utils'
import type { AccountType } from '@rootmatching/shared'

interface AppSidebarProps {
  className?: string
  onNavigate?: () => void
  onClose?: () => void
}

export function AppSidebar({ className, onNavigate, onClose }: AppSidebarProps) {
  const pathname = usePathname()
  const { currentUser } = useUserState()
  const accountType = (currentUser?.accountType as AccountType | undefined) ?? null
  const nav = useMemo(() => buildSidebarNav(accountType), [accountType])

  return (
    <div className={cn('flex h-full flex-col overflow-y-auto bg-card px-3 py-4', className)}>
      <div className="mb-5 flex items-center justify-between gap-2 px-2 py-1.5">
        <Link href="/" onClick={onNavigate} className="inline-flex items-center">
          <Logo variant="primary" size="md" href={null} alt="RootMatch — 홈으로" />
        </Link>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="hidden h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring lg:flex"
            aria-label="사이드바 닫기"
            title="사이드바 닫기"
          >
            <PanelLeftClose className="h-5 w-5" />
          </button>
        )}
      </div>

      <nav className="flex-1" aria-label="주요 메뉴">
        <ul className="space-y-1">
          {nav.items.map((item, index) => {
            const Icon = item.icon
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`)
            const isPrimaryCta = item.style === 'primary-cta'
            const showDividerAfter = nav.dividerAfterIndex === index

            return (
              <Fragment key={item.href}>
                <li>
                  <Link
                    href={item.href}
                    onClick={onNavigate}
                    aria-current={active ? 'page' : undefined}
                    className={cn(
                      'flex min-h-tap-min items-center gap-3 rounded-xl px-3 py-2.5 text-rm-body-d font-semibold transition-colors',
                      isPrimaryCta
                        ? 'bg-primary text-primary-foreground shadow-toss-sm hover:bg-primary/90 hover:shadow-toss-md'
                        : active
                          ? 'bg-accent text-accent-foreground'
                          : 'text-foreground/80 hover:bg-muted hover:text-foreground',
                      isPrimaryCta && active && 'shadow-toss-md',
                    )}
                  >
                    <Icon className="h-5 w-5 shrink-0" />
                    <span className="text-kr-keep truncate">{item.label}</span>
                  </Link>
                </li>
                {showDividerAfter && (
                  <li role="separator" aria-hidden="true" className="mx-3 my-2 h-px bg-border/60" />
                )}
              </Fragment>
            )
          })}
        </ul>
      </nav>
    </div>
  )
}
