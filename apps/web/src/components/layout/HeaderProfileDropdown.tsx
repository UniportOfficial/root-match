'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { BarChart3, ChevronDown, LogOut, Settings, User } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { authClient } from '@/lib/auth-client'
import { getAccountTypeLabel } from '@/lib/account-type-labels'
import { useUserState } from '@/state/UserContext'
import { cn } from '@/lib/utils'
import type { AccountType } from '@rootmatching/shared'

interface HeaderProfileDropdownProps {
  className?: string
}

function getInitial(name: string): string {
  const trimmed = name.trim()
  if (!trimmed) return '?'
  return trimmed.slice(0, 1).toUpperCase()
}

export function HeaderProfileDropdown({ className }: HeaderProfileDropdownProps) {
  const router = useRouter()
  const { currentUser } = useUserState()
  const [isSigningOut, setIsSigningOut] = useState(false)

  if (!currentUser) return null

  const accountTypeLabel = getAccountTypeLabel(currentUser.accountType as AccountType | undefined)
  const companyName = currentUser.company?.name

  async function handleSignOut() {
    if (isSigningOut) return
    setIsSigningOut(true)
    try {
      await authClient.signOut()
      router.push('/login')
      router.refresh()
    } catch {
      setIsSigningOut(false)
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(
          'flex items-center gap-2.5 rounded-full pl-1.5 pr-2 py-1.5 transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:pr-3',
          className,
        )}
        aria-label="계정 메뉴"
      >
        <span
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-rm-body-sm font-bold text-primary-foreground"
          aria-hidden="true"
        >
          {getInitial(currentUser.name)}
        </span>
        <span className="hidden text-left leading-tight sm:block">
          <span className="text-kr-keep block text-rm-body-sm font-bold text-foreground">
            {currentUser.name}
          </span>
          <span className="text-kr-keep block text-rm-caption font-semibold text-muted-foreground">
            {accountTypeLabel}
          </span>
        </span>
        <ChevronDown
          className="hidden h-4 w-4 shrink-0 text-muted-foreground sm:block"
          aria-hidden="true"
        />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" sideOffset={8} className="min-w-[260px] rounded-2xl p-2">
        <DropdownMenuLabel className="px-3 py-2.5">
          <span className="text-kr-keep block text-rm-body-d font-bold text-foreground">
            {currentUser.name}
          </span>
          {companyName && (
            <span className="text-kr-keep mt-0.5 block text-rm-body-sm text-muted-foreground">
              {companyName}
            </span>
          )}
          <span className="text-kr-keep mt-0.5 block text-rm-caption font-semibold text-muted-foreground">
            {accountTypeLabel}
          </span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild className="cursor-pointer rounded-lg px-3 py-2.5">
          <Link href="/mypage" className="flex items-center gap-3 text-rm-body-d font-semibold">
            <User className="h-5 w-5 shrink-0 text-muted-foreground" aria-hidden="true" />
            <span className="text-kr-keep">프로필</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild className="cursor-pointer rounded-lg px-3 py-2.5">
          <Link
            href="/mypage/analytics"
            className="flex items-center gap-3 text-rm-body-d font-semibold"
          >
            <BarChart3 className="h-5 w-5 shrink-0 text-muted-foreground" aria-hidden="true" />
            <span className="text-kr-keep">활동 분석</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild className="cursor-pointer rounded-lg px-3 py-2.5">
          <Link
            href="/mypage/settings"
            className="flex items-center gap-3 text-rm-body-d font-semibold"
          >
            <Settings className="h-5 w-5 shrink-0 text-muted-foreground" aria-hidden="true" />
            <span className="text-kr-keep">설정</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onSelect={(event) => {
            event.preventDefault()
            void handleSignOut()
          }}
          disabled={isSigningOut}
          className="cursor-pointer rounded-lg px-3 py-2.5 text-rm-body-d font-semibold text-destructive focus:bg-destructive/10 focus:text-destructive data-[disabled]:cursor-not-allowed data-[disabled]:opacity-60"
        >
          <LogOut className="mr-3 h-5 w-5 shrink-0" aria-hidden="true" />
          <span className="text-kr-keep">{isSigningOut ? '로그아웃 중…' : '로그아웃'}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
