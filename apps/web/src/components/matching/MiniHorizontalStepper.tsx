'use client'

import { Check } from 'lucide-react'
import { cn } from '@/lib/cn'

export type MiniStepperTheme = 'brand' | 'escrow'

interface MiniHorizontalStepperProps {
  steps: readonly string[]
  currentStep: number
  theme: MiniStepperTheme
  ariaLabel: string
  minStepWidthClass?: string
  className?: string
}

const THEME_CLASSES: Record<
  MiniStepperTheme,
  {
    done: string
    current: string
    pending: string
    doneLabel: string
    pendingLabel: string
    connectorDone: string
    connectorPending: string
  }
> = {
  brand: {
    done: 'bg-brand text-primary-foreground',
    current: 'bg-brand text-primary-foreground ring-4 ring-brand-light',
    pending: 'bg-card text-brand ring-1 ring-brand-light',
    doneLabel: 'text-brand',
    pendingLabel: 'text-muted-foreground',
    connectorDone: 'bg-brand',
    connectorPending: 'bg-brand-light',
  },
  escrow: {
    done: 'bg-escrow text-escrow-foreground',
    current: 'bg-escrow text-escrow-foreground ring-4 ring-escrow/20',
    pending: 'bg-card text-escrow ring-1 ring-escrow/30',
    doneLabel: 'text-escrow',
    pendingLabel: 'text-muted-foreground',
    connectorDone: 'bg-escrow',
    connectorPending: 'bg-escrow/20',
  },
}

export function MiniHorizontalStepper({
  steps,
  currentStep,
  theme,
  ariaLabel,
  minStepWidthClass,
  className,
}: MiniHorizontalStepperProps) {
  const classes = THEME_CLASSES[theme]

  return (
    <ol className={cn('flex items-start gap-1', className)} role="list" aria-label={ariaLabel}>
      {steps.map((label, index) => {
        const stepNumber = index + 1
        const isDone = stepNumber < currentStep
        const isCurrent = stepNumber === currentStep
        const isLast = stepNumber === steps.length

        const circleClass = isDone ? classes.done : isCurrent ? classes.current : classes.pending

        const labelClass = isDone || isCurrent ? classes.doneLabel : classes.pendingLabel

        const connectorClass = isDone ? classes.connectorDone : classes.connectorPending

        return (
          <li
            key={label}
            className={cn('flex flex-1 min-w-0 items-start gap-1', minStepWidthClass)}
            aria-current={isCurrent ? 'step' : undefined}
          >
            <div className="flex min-w-0 flex-col items-center gap-1">
              <div
                className={cn(
                  'flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[12px] font-extrabold transition',
                  circleClass,
                )}
                aria-hidden="true"
              >
                {isDone ? <Check className="h-3.5 w-3.5" /> : stepNumber}
              </div>
              <span
                className={cn('text-kr-keep whitespace-nowrap text-[12px] font-bold', labelClass)}
              >
                {label}
              </span>
            </div>
            {!isLast && (
              <div
                aria-hidden="true"
                className={cn('mt-3 h-0.5 flex-1 rounded-full', connectorClass)}
              />
            )}
          </li>
        )
      })}
    </ol>
  )
}
