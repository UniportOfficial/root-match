'use client'

import { Bell, Building2, Mail, Sparkles } from 'lucide-react'
import { useRouter } from 'next/navigation'
import type { Notification, NotificationType } from '@rootmatching/shared'
import { cn } from '@/lib/cn'
import { useNotificationsDispatch, useSortedNotifications } from '@/state/NotificationsContext'

interface NotificationDropdownProps {
  open: boolean
  onClose: () => void
  className?: string
}

const iconStyles: Record<NotificationType, typeof Mail> = {
  message: Mail,
  match: Sparkles,
  inquiry: Building2,
  system: Bell,
}

export function NotificationDropdown({ open, onClose, className }: NotificationDropdownProps) {
  const router = useRouter()
  const dispatch = useNotificationsDispatch()
  const notifications = useSortedNotifications().slice(0, 5)

  if (!open) return null

  function clickNotification(notification: Notification) {
    dispatch({ type: 'notifications/markAsRead', payload: { id: notification.id } })
    if (notification.link) {
      router.push(notification.link)
    }
    onClose()
  }

  return (
    <div
      className={cn(
        'absolute right-0 top-full z-40 mt-2 w-96 rounded-2xl border border-border bg-white shadow-lg',
        className,
      )}
    >
      <div className="flex items-center justify-between border-b border-border px-5 py-4">
        <h2 className="text-lg font-bold text-ink-950">알림</h2>
        <button
          type="button"
          onClick={() => dispatch({ type: 'notifications/markAllAsRead' })}
          className="text-sm font-bold text-brand transition hover:text-brand-hover"
        >
          전체 읽음
        </button>
      </div>

      {notifications.length === 0 ? (
        <div className="px-5 py-10 text-center text-sm font-semibold text-ink-400">
          새 알림이 없습니다
        </div>
      ) : (
        <ul className="max-h-96 overflow-y-auto p-2">
          {notifications.map((notification) => {
            const Icon = iconStyles[notification.type]
            return (
              <li key={notification.id}>
                <button
                  type="button"
                  onClick={() => clickNotification(notification)}
                  className={cn(
                    'flex w-full items-start gap-3 rounded-xl px-3 py-3 text-left transition hover:bg-surface-muted',
                    notification.isRead
                      ? 'text-ink-400'
                      : 'bg-brand-light/30 font-bold text-ink-950',
                  )}
                >
                  <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-brand ring-1 ring-border">
                    <Icon className="h-5 w-5" />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm">{notification.title}</span>
                    <span className="mt-1 block text-xs leading-5 text-ink-700">
                      {notification.content}
                    </span>
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
