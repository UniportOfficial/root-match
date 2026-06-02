'use client'

import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { cn } from '@/lib/cn'

type ButtonVariant = 'primary' | 'secondary' | 'danger'
type ButtonSize = 'md' | 'lg'

const variantStyles: Record<ButtonVariant, string> = {
  primary: 'bg-brand text-white hover:bg-brand-hover',
  secondary:
    'border border-border bg-white text-ink-700 hover:border-brand-light hover:bg-brand-light/40 hover:text-brand',
  danger: 'bg-danger text-white hover:bg-red-600',
}

const sizeStyles: Record<ButtonSize, string> = {
  md: 'px-4 py-2.5 text-sm',
  lg: 'px-5 py-3 text-base',
}

interface AppButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  fullWidth?: boolean
  children: ReactNode
  className?: string
}

export function AppButton({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  children,
  className,
  type = 'button',
  ...buttonProps
}: AppButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-xl font-bold transition disabled:cursor-not-allowed disabled:opacity-60',
        sizeStyles[size],
        variantStyles[variant],
        fullWidth && 'w-full',
        className,
      )}
      {...buttonProps}
    >
      {children}
    </button>
  )
}
