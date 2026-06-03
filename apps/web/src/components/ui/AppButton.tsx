'use client'

import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { cn } from '@/lib/cn'

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger'
type ButtonSize = 'md' | 'lg' | 'xl'

const variantStyles: Record<ButtonVariant, string> = {
  primary: 'bg-brand text-white shadow-toss-sm hover:bg-brand-hover',
  secondary:
    'border border-border bg-white text-ink-800 shadow-toss-sm hover:border-brand-subtle hover:bg-brand-light/40 hover:text-brand',
  ghost: 'bg-transparent text-brand hover:bg-brand-light',
  danger: 'bg-danger text-white shadow-toss-sm hover:bg-toss-red-600',
}

const sizeStyles: Record<ButtonSize, string> = {
  md: 'min-h-tap-min px-4 py-3 text-base',
  lg: 'min-h-tap-primary px-5 py-3.5 text-sr-button-lg',
  xl: 'min-h-tap-critical px-6 py-4 text-sr-button-xl',
}

interface AppButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  fullWidth?: boolean
  loading?: boolean
  children: ReactNode
  className?: string
}

export function AppButton({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  loading = false,
  children,
  className,
  type = 'button',
  disabled,
  ...buttonProps
}: AppButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-lg font-bold tracking-wide transition disabled:cursor-not-allowed disabled:opacity-60',
        sizeStyles[size],
        variantStyles[variant],
        fullWidth && 'w-full',
        className,
      )}
      {...buttonProps}
    >
      {loading && (
        <span
          className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
          aria-hidden="true"
        />
      )}
      {children}
    </button>
  )
}
