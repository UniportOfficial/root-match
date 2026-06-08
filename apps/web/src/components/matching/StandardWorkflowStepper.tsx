'use client'

import { Check } from 'lucide-react'
import { cn } from '@/lib/cn'

interface StandardWorkflowStepperProps {
  currentStep?: number
  className?: string
}

const WORKFLOW_STEPS = [
  '의뢰 등록',
  'AI 매칭',
  '견적 수신',
  '비교·선택',
  '전자계약',
  '에스크로',
  '제작 진행',
  '현장 검수',
  '납품',
  '분쟁 중재',
  '정산',
] as const

export function StandardWorkflowStepper({
  currentStep = 2,
  className,
}: StandardWorkflowStepperProps) {
  return (
    <section
      className={cn(
        'rounded-2xl border border-brand-light bg-brand-light/30 p-4 sm:p-5',
        className,
      )}
      aria-label="RootMatching 11단계 표준 워크플로"
    >
      <header className="mb-3 flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <p className="text-kr-pretty text-[15px] font-bold text-brand">11단계 표준 워크플로</p>
        <span className="text-kr-pretty text-[13px] font-semibold text-muted-foreground">
          현재 {currentStep}단계 · 의뢰 → 정산까지 단일 흐름
        </span>
      </header>

      <ol className="flex items-stretch gap-1 overflow-x-auto pb-1" role="list">
        {WORKFLOW_STEPS.map((label, index) => {
          const stepNumber = index + 1
          const isDone = stepNumber < currentStep
          const isCurrent = stepNumber === currentStep
          const isLast = stepNumber === WORKFLOW_STEPS.length

          return (
            <li
              key={label}
              className="flex flex-1 min-w-[64px] items-center gap-1"
              aria-current={isCurrent ? 'step' : undefined}
            >
              <div className="flex flex-col items-center gap-1">
                <div
                  className={cn(
                    'flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[12px] font-extrabold transition',
                    isDone
                      ? 'bg-brand text-primary-foreground'
                      : isCurrent
                        ? 'bg-brand text-primary-foreground ring-4 ring-brand-light'
                        : 'bg-card text-brand ring-1 ring-brand-light',
                  )}
                  aria-hidden="true"
                >
                  {isDone ? <Check className="h-3.5 w-3.5" /> : stepNumber}
                </div>
                <span
                  className={cn(
                    'text-kr-keep whitespace-nowrap text-[12px] font-bold',
                    isDone || isCurrent ? 'text-brand' : 'text-muted-foreground',
                  )}
                >
                  {label}
                </span>
              </div>
              {!isLast && (
                <div
                  aria-hidden="true"
                  className={cn(
                    'mt-3.5 h-0.5 flex-1 rounded-full',
                    isDone ? 'bg-brand' : 'bg-brand-light',
                  )}
                />
              )}
            </li>
          )
        })}
      </ol>
    </section>
  )
}
