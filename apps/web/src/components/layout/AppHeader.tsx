'use client'

import { useState, type FormEvent } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { Bell, Menu, PanelLeftOpen, Search } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useNotificationsUnreadCount } from '@/state/NotificationsContext'
import { useUserState } from '@/state/UserContext'
import { NotificationDropdown } from '@/components/notification/NotificationDropdown'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetHeader } from '@/components/ui/sheet'
import { AppSidebar } from '@/components/layout/AppSidebar'
import { HeaderMessagesButton } from '@/components/layout/HeaderMessagesButton'
import { HeaderMiniProfile } from '@/components/layout/HeaderMiniProfile'
import { HeaderNewQuoteButton } from '@/components/layout/HeaderNewQuoteButton'
import { HeaderPageTitle } from '@/components/layout/HeaderPageTitle'

interface AppHeaderProps {
  className?: string
  sidebarHidden?: boolean
  onOpenSidebar?: () => void
}

function getSearchPlaceholder(pathname: string): string {
  if (pathname === '/companies' || pathname.startsWith('/companies/')) return '기업명·키워드 검색'
  if (pathname === '/requests' || pathname.startsWith('/requests/')) return '내 요청에서 검색'
  if (pathname === '/factory/requests' || pathname.startsWith('/factory/requests/'))
    return '받은 요청에서 검색'
  if (pathname === '/quotes' || pathname.startsWith('/quotes/')) return '공개 견적에서 검색'
  if (pathname === '/contracts' || pathname.startsWith('/contracts/')) return '계약에서 검색'
  return '기업·키워드 검색'
}

export function AppHeader({ className, sidebarHidden = false, onOpenSidebar }: AppHeaderProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [keyword, setKeyword] = useState('')
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const notificationUnreadCount = useNotificationsUnreadCount()
  const { isAuthenticated } = useUserState()
  const searchPlaceholder = getSearchPlaceholder(pathname)

  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const value = keyword.trim()
    if (!value) return
    router.push(`/companies?keyword=${encodeURIComponent(value)}`)
  }

  return (
    <header
      className={cn(
        'sticky top-0 z-30 h-14 border-b border-border bg-card/95 px-4 backdrop-blur-md sm:h-16 sm:px-6 lg:px-8',
        className,
      )}
    >
      <div className="flex h-full items-center gap-3 lg:gap-5">
        <div className="flex shrink-0 items-center gap-2 lg:gap-3">
          <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon-sm" className="lg:hidden" aria-label="메뉴 열기">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[280px] p-0 sm:max-w-[280px]">
              <SheetHeader className="sr-only">
                <SheetTitle>메뉴</SheetTitle>
              </SheetHeader>
              <AppSidebar onNavigate={() => setMobileNavOpen(false)} />
            </SheetContent>
          </Sheet>

          {sidebarHidden && onOpenSidebar && (
            <Button
              variant="ghost"
              size="icon-sm"
              type="button"
              onClick={onOpenSidebar}
              className="hidden lg:inline-flex"
              aria-label="사이드바 열기"
              title="사이드바 열기"
            >
              <PanelLeftOpen className="h-5 w-5" />
            </Button>
          )}
        </div>

        <HeaderPageTitle className="hidden flex-1 min-w-0 sm:block lg:flex-none lg:max-w-[240px]" />

        <form onSubmit={submitSearch} className="min-w-0 flex-1 sm:max-w-md lg:max-w-xl">
          <label className="relative block">
            <span className="sr-only">검색</span>
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
              type="search"
              placeholder={searchPlaceholder}
              className="h-10 w-full rounded-lg border border-input bg-muted/50 pl-9 pr-3 text-rm-body-d font-medium text-foreground outline-none transition placeholder:text-muted-foreground focus:border-ring focus:bg-card focus:ring-2 focus:ring-ring/20"
            />
          </label>
        </form>

        <div className="ml-auto flex shrink-0 items-center gap-1.5 sm:gap-3 lg:gap-4">
          {isAuthenticated && <HeaderNewQuoteButton />}
          {isAuthenticated && <HeaderMessagesButton className="hidden sm:inline-flex" />}
          <div className="relative">
            <Button
              variant="ghost"
              size="icon"
              type="button"
              onClick={() => setDropdownOpen((open) => !open)}
              className="relative"
              aria-label={
                notificationUnreadCount > 0 ? `알림 ${notificationUnreadCount}개` : '알림'
              }
            >
              <Bell className="h-5 w-5" />
              {notificationUnreadCount > 0 && (
                <span
                  className="absolute right-1 top-1 flex h-[20px] min-w-[20px] items-center justify-center rounded-full bg-destructive px-1 text-[12px] font-bold leading-none text-destructive-foreground ring-2 ring-card"
                  aria-hidden="true"
                >
                  {notificationUnreadCount > 99 ? '99+' : notificationUnreadCount}
                </span>
              )}
            </Button>
            <NotificationDropdown open={dropdownOpen} onClose={() => setDropdownOpen(false)} />
          </div>

          {isAuthenticated ? (
            <HeaderMiniProfile onOpenMobile={() => setMobileNavOpen(true)} />
          ) : (
            <Button variant="secondary" size="default" onClick={() => router.push('/login')}>
              로그인
            </Button>
          )}
        </div>
      </div>
    </header>
  )
}
