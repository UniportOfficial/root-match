'use client'

import Link from 'next/link'
import { MessageSquare } from 'lucide-react'
import { useMessagesUnreadCount } from '@/state/MessagesContext'
import { cn } from '@/lib/utils'

interface HeaderMessagesButtonProps {
  className?: string
}

export function HeaderMessagesButton({ className }: HeaderMessagesButtonProps) {
  const unreadCount = useMessagesUnreadCount()
  const ariaLabel = unreadCount > 0 ? `메시지 ${unreadCount}개 안 읽음` : '메시지'

  return (
    <Link
      href="/messages"
      aria-label={ariaLabel}
      className={cn(
        'relative inline-flex h-12 w-12 items-center justify-center rounded-full text-foreground/80 transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
        className,
      )}
    >
      <MessageSquare className="h-5 w-5" />
      {unreadCount > 0 && (
        <span
          className="absolute right-1 top-1 flex h-[20px] min-w-[20px] items-center justify-center rounded-full bg-info px-1 text-[12px] font-bold leading-none text-info-foreground ring-2 ring-card"
          aria-hidden="true"
        >
          {unreadCount > 99 ? '99+' : unreadCount}
        </span>
      )}
    </Link>
  )
}
