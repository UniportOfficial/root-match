import {
  Briefcase,
  Building2,
  Factory,
  Inbox,
  LayoutDashboard,
  MessageSquare,
  Search,
  Sparkles,
  type LucideIcon,
} from 'lucide-react'
import type { AccountType } from '@rootmatching/shared'

export type SidebarItemStyle = 'default' | 'primary-cta'

export interface SidebarNavItem {
  href: string
  label: string
  icon: LucideIcon
  style?: SidebarItemStyle
}

export interface SidebarNavData {
  items: SidebarNavItem[]
  dividerAfterIndex?: number
}

const PUBLIC_NAV: SidebarNavItem[] = [
  { href: '/dashboard', label: '대시보드', icon: LayoutDashboard },
]

const CLIENT_NAV: SidebarNavItem[] = [
  { href: '/dashboard', label: '대시보드', icon: LayoutDashboard },
  { href: '/request', label: 'AI 매칭으로 견적 받기', icon: Sparkles, style: 'primary-cta' },
  { href: '/requests', label: '내 요청', icon: Inbox },
  { href: '/messages', label: '메시지', icon: MessageSquare },
  { href: '/companies', label: '기업 디렉토리', icon: Building2 },
  { href: '/transactions', label: '거래', icon: Briefcase },
]

const FACTORY_NAV: SidebarNavItem[] = [
  { href: '/dashboard', label: '대시보드', icon: LayoutDashboard },
  { href: '/factory/requests', label: '받은 요청', icon: Inbox, style: 'primary-cta' },
  { href: '/quotes', label: '공개 견적', icon: Search },
  { href: '/messages', label: '메시지', icon: MessageSquare },
  { href: '/factory/onboarding', label: '공장 프로필', icon: Factory },
  { href: '/transactions', label: '거래', icon: Briefcase },
]

export function buildSidebarNav(accountType: AccountType | null): SidebarNavData {
  if (!accountType) {
    return { items: PUBLIC_NAV }
  }
  return {
    items: accountType === 'client' ? CLIENT_NAV : FACTORY_NAV,
    dividerAfterIndex: 2,
  }
}
