'use client'

import { Check, Shield } from 'lucide-react'
import { cn } from '@/lib/cn'

interface EscrowMiniStepperProps {
  currentStep?: number
  className?: string
  variant?: 'horizontal' | 'vertical'
}

const ESCROW_STEPS = ['의뢰', '견적', '계약', '입금', '제작', '검수', '납품', '정산'] as const

const VERTICAL_LABEL_OVERRIDES: Record<string, string> = {
  입금: '입금 보호',
}

export function EscrowMiniStepper({
  currentStep = 2,
  className,
  variant = 'horizontal',
}: EscrowMiniStepperProps) {
  return (
    <section
      className={cn('rounded-2xl border border-escrow/30 bg-escrow-subtle p-4', className)}
      aria-label="안심결제 8단계 보호 흐름"
    >
      <header className="mb-3 flex flex-wrap items-center gap-x-2 gap-y-1">
        <Shield className="h-4 w-4 text-escrow" aria-hidden="true" />
        <p className="text-kr-pretty text-[15px] font-bold text-escrow">안심결제 8단계 보호</p>
        <span className="text-kr-pretty ml-auto text-[13px] font-semibold text-escrow/80">
          검수 완료 전까지 대금 보호
        </span>
      </header>

      {variant === 'vertical' ? (
        <ol className="flex flex-col gap-2" role="list">
          {ESCROW_STEPS.map((label, index) => {
            const stepNumber = index + 1
            const isDone = stepNumber < currentStep
            const isCurrent = stepNumber === currentStep
            const displayLabel = VERTICAL_LABEL_OVERRIDES[label] ?? label

            return (
              <li
                key={label}
                className="flex items-center gap-3"
                aria-current={isCurrent ? 'step' : undefined}
              >
                <div
                  className={cn(
                    'flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[13px] font-extrabold transition',
                    isDone
                      ? 'bg-escrow text-escrow-foreground'
                      : isCurrent
                        ? 'bg-escrow text-escrow-foreground ring-4 ring-escrow/20'
                        : 'bg-card text-escrow ring-1 ring-escrow/30',
                  )}
                  aria-hidden="true"
                >
                  {isDone ? <Check className="h-4 w-4" /> : stepNumber}
                </div>
                <span
                  className={cn(
                    'text-kr-keep text-[14px] font-bold',
                    isDone || isCurrent ? 'text-escrow' : 'text-muted-foreground',
                  )}
                >
                  {displayLabel}
                </span>
                {isCurrent && (
                  <span className="text-kr-keep ml-auto text-[12px] font-extrabold text-escrow">
                    진행 중
                  </span>
                )}
                {isDone && (
                  <span className="text-kr-keep ml-auto text-[12px] font-extrabold text-escrow/70">
                    완료
                  </span>
                )}
              </li>
            )
          })}
        </ol>
      ) : (
        <ol className="flex items-start gap-1" role="list">
          {ESCROW_STEPS.map((label, index) => {
            const stepNumber = index + 1
            const isDone = stepNumber < currentStep
            const isCurrent = stepNumber === currentStep
            const isLast = stepNumber === ESCROW_STEPS.length

            return (
              <li
                key={label}
                className="flex flex-1 min-w-0 items-start gap-1"
                aria-current={isCurrent ? 'step' : undefined}
              >
                <div className="flex min-w-0 flex-col items-center gap-1">
                  <div
                    className={cn(
                      'flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[12px] font-extrabold transition',
                      isDone
                        ? 'bg-escrow text-escrow-foreground'
                        : isCurrent
                          ? 'bg-escrow text-escrow-foreground ring-4 ring-escrow/20'
                          : 'bg-card text-escrow ring-1 ring-escrow/30',
                    )}
                    aria-hidden="true"
                  >
                    {isDone ? <Check className="h-3.5 w-3.5" /> : stepNumber}
                  </div>
                  <span
                    className={cn(
                      'text-kr-keep whitespace-nowrap text-[12px] font-bold',
                      isDone || isCurrent ? 'text-escrow' : 'text-muted-foreground',
                    )}
                  >
                    {label}
                  </span>
                </div>
                {!isLast && (
                  <div
                    aria-hidden="true"
                    className={cn(
                      'mt-3 h-0.5 flex-1 rounded-full',
                      isDone ? 'bg-escrow' : 'bg-escrow/20',
                    )}
                  />
                )}
              </li>
            )
          })}
        </ol>
      )}
    </section>
  )
}
