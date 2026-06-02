'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  AlertTriangle,
  BarChart3,
  Building2,
  Factory,
  FileText,
  Inbox,
  LayoutDashboard,
  MessageSquare,
  PackageCheck,
  Search,
  Settings,
  Sparkles,
  User,
  type LucideIcon,
} from 'lucide-react'
import { cn } from '@/lib/cn'

interface NavItem {
  href: string
  label: string
  icon: LucideIcon
}

interface NavGroup {
  title: string
  items: NavItem[]
}

interface AppSidebarProps {
  className?: string
}

const navGroups: NavGroup[] = [
  {
    title: '공통',
    items: [
      { href: '/dashboard', label: '대시보드', icon: LayoutDashboard },
      { href: '/messages', label: '메시지', icon: MessageSquare },
      { href: '/companies', label: '기업 디렉토리', icon: Building2 },
    ],
  },
  {
    title: '발주처',
    items: [
      { href: '/request', label: '견적 요청', icon: FileText },
      { href: '/matching', label: 'AI 매칭', icon: Sparkles },
      { href: '/requests', label: '내 요청', icon: Inbox },
    ],
  },
  {
    title: '공장',
    items: [
      { href: '/factory/onboarding', label: '공장 등록', icon: Factory },
      { href: '/factory/requests', label: '받은 요청', icon: Inbox },
      { href: '/quotes', label: '공개 견적', icon: Search },
    ],
  },
  {
    title: '거래/분쟁',
    items: [
      { href: '/transactions', label: '거래 현황', icon: PackageCheck },
      { href: '/disputes', label: '분쟁 중재', icon: AlertTriangle },
    ],
  },
  {
    title: '마이페이지',
    items: [
      { href: '/mypage', label: '프로필', icon: User },
      { href: '/mypage/analytics', label: '활동 분석', icon: BarChart3 },
      { href: '/mypage/settings', label: '설정', icon: Settings },
    ],
  },
]

export function AppSidebar({ className }: AppSidebarProps) {
  const pathname = usePathname()

  return (
    <div className={cn('sticky top-0 flex h-screen flex-col overflow-y-auto px-4 py-5', className)}>
      <Link href="/" className="mb-6 flex items-center gap-3 rounded-2xl px-2 py-2 text-ink-950">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand text-white">
          <Sparkles className="h-5 w-5" />
        </span>
        <div className="text-xl font-black">Rootmatching</div>
      </Link>

      <nav className="space-y-5">
        {navGroups.map((group) => (
          <section key={group.title}>
            <h2 className="mb-2 px-3 text-xs font-black uppercase tracking-wide text-ink-400">
              {group.title}
            </h2>
            <ul className="space-y-1">
              {group.items.map((item) => {
                const Icon = item.icon
                const active = pathname === item.href || pathname.startsWith(`${item.href}/`)

                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={cn(
                        'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition',
                        active
                          ? 'bg-brand-light text-brand'
                          : 'text-ink-700 hover:bg-surface-muted hover:text-brand',
                      )}
                    >
                      <Icon className="h-5 w-5" />
                      {item.label}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </section>
        ))}
      </nav>
    </div>
  )
}
