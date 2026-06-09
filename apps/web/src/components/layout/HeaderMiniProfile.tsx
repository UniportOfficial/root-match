'use client'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useUserState } from '@/state/UserContext'

interface HeaderMiniProfileProps {
  onOpenMobile: () => void
}

function getInitial(name: string): string {
  const trimmed = name.trim()
  if (!trimmed) return '?'
  return trimmed.slice(0, 1).toUpperCase()
}

export function HeaderMiniProfile({ onOpenMobile }: HeaderMiniProfileProps) {
  const { currentUser, isAuthenticated } = useUserState()

  if (!isAuthenticated || !currentUser) return null

  return (
    <button
      type="button"
      data-testid="header-mini-profile"
      className="flex min-h-tap-min min-w-tap-min items-center justify-center rounded-full transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:hidden"
      aria-label={`${currentUser.name} 계정 및 사이드바 메뉴 열기`}
      onClick={onOpenMobile}
    >
      <Avatar className="h-9 w-9">
        {currentUser.avatar && <AvatarImage src={currentUser.avatar} alt="" />}
        <AvatarFallback className="bg-primary text-rm-body-sm font-bold text-primary-foreground">
          {getInitial(currentUser.name)}
        </AvatarFallback>
      </Avatar>
    </button>
  )
}
