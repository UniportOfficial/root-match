'use client'

import { useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { Bell, Search, UserCircle } from 'lucide-react'
import { cn } from '@/lib/cn'
import { useMessagesUnreadCount } from '@/state/MessagesContext'
import { useNotificationsUnreadCount } from '@/state/NotificationsContext'
import { useUserState } from '@/state/UserContext'
import { NotificationDropdown } from '@/components/notification/NotificationDropdown'
import { AppButton } from '@/components/ui/AppButton'

interface AppHeaderProps {
  className?: string
}

export function AppHeader({ className }: AppHeaderProps) {
  const router = useRouter()
  const [keyword, setKeyword] = useState('')
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const notificationUnreadCount = useNotificationsUnreadCount()
  const messageUnreadCount = useMessagesUnreadCount()
  const totalUnreadCount = notificationUnreadCount + messageUnreadCount
  const { currentUser, isAuthenticated } = useUserState()

  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const value = keyword.trim()
    if (!value) return
    router.push(`/companies?keyword=${encodeURIComponent(value)}`)
  }

  return (
    <header
      className={cn(
        'sticky top-0 z-30 h-16 border-b border-border bg-white px-4 sm:px-6 lg:px-8',
        className,
      )}
    >
      <div className="flex h-full items-center justify-between gap-4">
        <form onSubmit={submitSearch} className="min-w-0 flex-1 sm:max-w-md">
          <label className="relative block">
            <span className="sr-only">검색</span>
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
            <input
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
              type="search"
              placeholder="기업, 키워드 검색"
              className="h-11 w-full rounded-xl border border-border bg-surface-muted pl-10 pr-4 text-sm font-semibold text-ink-950 outline-none transition placeholder:text-ink-400 focus:border-brand focus:bg-white focus:ring-4 focus:ring-brand-light"
            />
          </label>
        </form>

        <div className="flex shrink-0 items-center gap-3">
          <div className="relative">
            <button
              type="button"
              onClick={() => setDropdownOpen((open) => !open)}
              className="relative flex h-11 w-11 items-center justify-center rounded-xl border border-border bg-white text-ink-700 transition hover:border-brand-light hover:text-brand"
              aria-label="알림"
            >
              <Bell className="h-5 w-5" />
              {totalUnreadCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-danger px-1 text-xs font-black text-white">
                  {totalUnreadCount}
                </span>
              )}
            </button>
            <NotificationDropdown open={dropdownOpen} onClose={() => setDropdownOpen(false)} />
          </div>

          {isAuthenticated && currentUser ? (
            <div className="hidden items-center gap-3 rounded-xl border border-border bg-surface-muted px-3 py-2 sm:flex">
              <UserCircle className="h-6 w-6 text-brand" />
              <div className="leading-tight">
                <p className="text-sm font-bold text-ink-950">{currentUser.name}</p>
                <p className="text-xs font-semibold text-ink-400">
                  {currentUser.position ?? '회원'}
                </p>
              </div>
            </div>
          ) : (
            <AppButton variant="secondary" onClick={() => router.push('/login')}>
              로그인
            </AppButton>
          )}
        </div>
      </div>
    </header>
  )
}
