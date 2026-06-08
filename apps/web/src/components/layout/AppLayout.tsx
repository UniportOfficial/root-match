'use client'

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { resolveTitleForPath } from '@/lib/page-titles'
import { AppHeader } from '@/components/layout/AppHeader'
import { AppSidebar } from '@/components/layout/AppSidebar'

interface AppLayoutProps {
  children: ReactNode
  className?: string
}

interface SidebarLayoutValue {
  /** Desktop sidebar가 열려 있는지. lg 미만에서는 의미 없음(false 취급). */
  open: boolean
  /** Sidebar 너비(px). 닫혀 있으면 0. lg breakpoint 미만에서는 의미 없음. */
  widthPx: number
}

const SIDEBAR_WIDTH_PX = 260

const SidebarLayoutContext = createContext<SidebarLayoutValue>({
  open: false,
  widthPx: 0,
})

/**
 * AppLayout 내부에서 desktop sidebar 열림 상태를 읽기 위한 hook.
 * Sticky/fixed footer 등에서 lg 사이드바 너비만큼 offset 줄 때 사용.
 */
export function useSidebarLayout(): SidebarLayoutValue {
  return useContext(SidebarLayoutContext)
}

const SIDEBAR_STORAGE_KEY = 'rm:sidebar-open'

export function AppLayout({ children, className }: AppLayoutProps) {
  const pathname = usePathname()
  /**
   * SSR-safe sidebar open state.
   * Default = open. Client에서 localStorage 읽고 동기화 (첫 frame mismatch 방지를 위해
   * 초기값은 항상 true로 두고, useEffect에서 closed 시에만 false로 전환).
   */
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(true)

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (window.localStorage.getItem(SIDEBAR_STORAGE_KEY) === 'closed') {
      setSidebarOpen(false)
    }
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return
    window.localStorage.setItem(SIDEBAR_STORAGE_KEY, sidebarOpen ? 'open' : 'closed')
  }, [sidebarOpen])

  useEffect(() => {
    const title = resolveTitleForPath(pathname)
    document.title = `${title} | RootMatch`
  }, [pathname])

  useEffect(() => {
    if (typeof window === 'undefined') return
    const hash = window.location.hash
    if (hash) {
      const id = hash.slice(1)
      const el = document.getElementById(id)
      if (el) {
        requestAnimationFrame(() => {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' })
        })
        return
      }
    }
    window.scrollTo({ top: 0, behavior: 'instant' })
  }, [pathname])

  return (
    <SidebarLayoutContext.Provider
      value={{ open: sidebarOpen, widthPx: sidebarOpen ? SIDEBAR_WIDTH_PX : 0 }}
    >
      <div
        className={cn(
          'min-h-screen bg-background',
          sidebarOpen ? 'lg:grid lg:grid-cols-[260px_minmax(0,1fr)]' : 'lg:block',
          className,
        )}
      >
        <aside
          className={cn(
            'hidden border-r border-border bg-card lg:sticky lg:top-0 lg:z-40 lg:h-screen',
            sidebarOpen ? 'lg:block' : 'lg:hidden',
          )}
        >
          <AppSidebar onClose={() => setSidebarOpen(false)} />
        </aside>
        <div className="flex min-h-screen min-w-0 flex-col">
          <AppHeader sidebarHidden={!sidebarOpen} onOpenSidebar={() => setSidebarOpen(true)} />
          <main className="flex-1 min-w-0">{children}</main>
        </div>
      </div>
    </SidebarLayoutContext.Provider>
  )
}
