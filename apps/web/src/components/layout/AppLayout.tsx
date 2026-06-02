'use client'

import { useEffect, type ReactNode } from 'react'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/cn'
import { AppHeader } from '@/components/layout/AppHeader'
import { AppSidebar } from '@/components/layout/AppSidebar'

interface AppLayoutProps {
  children: ReactNode
  className?: string
}

const ROUTE_TITLES: Record<string, string> = {
  '/dashboard': '대시보드',
  '/quotes': '견적 모집 게시판',
  '/request': '새 견적 요청',
  '/matching': 'AI 매칭 결과',
  '/requests': '내 견적 요청',
  '/factory/onboarding': '공장 프로필 등록',
  '/factory/requests': '받은 견적 요청',
  '/contract': '계약 및 결제',
  '/transactions': '거래 진행 현황',
  '/transaction/review': '거래 완료 및 리뷰',
  '/transaction/progress': '거래 진행 상세',
  '/disputes': '분쟁 중재 센터',
  '/disputes/mediation': '분쟁 중재 신청',
  '/companies': '기업 디렉토리',
  '/messages': '메시지',
  '/mypage': '마이페이지',
  '/mypage/analytics': '활동 분석',
  '/mypage/settings': '계정 설정',
}

const DYNAMIC_TITLE_PREFIXES: Array<{ prefix: string; title: string }> = [
  { prefix: '/factories/', title: '공장 상세' },
  { prefix: '/factory/requests/', title: '견적 제출' },
  { prefix: '/requests/', title: '견적 요청 상세' },
  { prefix: '/transactions/', title: '거래 진행 상세' },
  { prefix: '/disputes/', title: '분쟁 상세' },
  { prefix: '/companies/', title: '기업 상세' },
]

function resolveTitleForPath(pathname: string): string {
  if (ROUTE_TITLES[pathname]) return ROUTE_TITLES[pathname]
  for (const { prefix, title } of DYNAMIC_TITLE_PREFIXES) {
    if (pathname.startsWith(prefix)) return title
  }
  return '홈'
}

export function AppLayout({ children, className }: AppLayoutProps) {
  const pathname = usePathname()

  useEffect(() => {
    const title = resolveTitleForPath(pathname)
    document.title = `${title} - RootMatching B2B`
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
