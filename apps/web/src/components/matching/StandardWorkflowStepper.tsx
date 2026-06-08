'use client'

import { cn } from '@/lib/cn'
import { MiniHorizontalStepper } from './MiniHorizontalStepper'

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

      <MiniHorizontalStepper
        steps={WORKFLOW_STEPS}
        currentStep={currentStep}
        theme="brand"
        ariaLabel="11단계 표준 워크플로 진행 상태"
        minStepWidthClass="min-w-[64px]"
        className="overflow-x-auto pb-1"
      />
    </section>
  )
}
