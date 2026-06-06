'use client'

import * as React from 'react'

import { cn } from '@/lib/utils'

export interface SeniorInputProps extends React.ComponentProps<'input'> {
  label: string
  error?: string
  helperText?: string
}

const SeniorInput = React.forwardRef<HTMLInputElement, SeniorInputProps>(
  ({ className, id, label, error, helperText, ...props }, ref) => {
    const generatedId = React.useId()
    const inputId = id ?? generatedId
    const describedBy = error ? `${inputId}-error` : helperText ? `${inputId}-help` : undefined

    return (
      <div className="space-y-1.5">
        <label
          htmlFor={inputId}
          className="text-kr-keep block text-[15px] font-semibold text-foreground"
        >
          {label}
        </label>
        <input
          ref={ref}
          id={inputId}
          aria-invalid={!!error}
          aria-describedby={describedBy}
          className={cn(
            'h-12 w-full rounded-lg border bg-background px-4 text-[16px] text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 transition-colors',
            error ? 'border-danger' : 'border-input',
            className,
          )}
          {...props}
        />
        {error ? (
          <p
            id={`${inputId}-error`}
            className="text-kr-pretty text-[14px] font-semibold text-danger"
          >
            {error}
          </p>
        ) : helperText ? (
          <p id={`${inputId}-help`} className="text-kr-pretty text-[14px] text-muted-foreground">
            {helperText}
          </p>
        ) : null}
      </div>
    )
  },
)
SeniorInput.displayName = 'SeniorInput'

export { SeniorInput }
