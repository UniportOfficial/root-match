import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

type BadgeVariant = 'blue' | 'green' | 'yellow' | 'amber' | 'red' | 'slate'
type BadgeSize = 'sm' | 'md' | 'lg'

const variantStyles: Record<BadgeVariant, string> = {
  blue: 'bg-brand-light text-brand',
  green: 'bg-success-bg text-success',
  yellow: 'bg-warning-bg text-warning-text',
  amber: 'bg-warning-bg text-warning-text',
  red: 'bg-danger-bg text-danger',
  slate: 'bg-surface-muted text-ink-800',
}

const sizeStyles: Record<BadgeSize, string> = {
  sm: 'px-2.5 py-1 text-sm',
  md: 'px-3 py-1.5 text-sm',
  lg: 'px-3.5 py-2 text-base',
}

interface AppBadgeProps {
  variant?: BadgeVariant
  size?: BadgeSize
  children: ReactNode
  className?: string
}

export function AppBadge({ variant = 'blue', size = 'md', children, className }: AppBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-pill font-semibold leading-none',
        sizeStyles[size],
        variantStyles[variant],
        className,
      )}
    >
      {children}
    </span>
  )
}
