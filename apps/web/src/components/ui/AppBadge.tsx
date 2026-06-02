import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

type BadgeVariant = 'blue' | 'green' | 'amber' | 'slate'

const variantStyles: Record<BadgeVariant, string> = {
  blue: 'bg-brand-light text-brand',
  green: 'bg-emerald-50 text-emerald-700',
  amber: 'bg-amber-50 text-amber-700',
  slate: 'bg-slate-100 text-slate-700',
}

interface AppBadgeProps {
  variant?: BadgeVariant
  children: ReactNode
  className?: string
}

export function AppBadge({ variant = 'blue', children, className }: AppBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold',
        variantStyles[variant],
        className,
      )}
    >
      {children}
    </span>
  )
}
