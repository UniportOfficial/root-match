'use client'

import { CheckCircle } from 'lucide-react'
import { cn } from '@/lib/cn'

interface ProcessStep {
  title: string
  description: string
}

interface ProcessStepperProps {
  steps: ProcessStep[]
  currentStep: number
  className?: string
}

export function ProcessStepper({ steps, currentStep, className }: ProcessStepperProps) {
  return (
    <ol className={cn('grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-3', className)}>
      {steps.map((step, index) => {
        const stepNumber = index + 1
        const isCurrent = stepNumber === currentStep
        const isDone = stepNumber < currentStep

        return (
          <li
            key={step.title}
            className={cn(
              'rounded-lg border bg-surface p-4 shadow-toss-sm transition',
              isCurrent
                ? 'border-brand bg-brand-light/60 shadow-toss-md ring-2 ring-brand-subtle'
                : isDone
                  ? 'border-success/30 bg-success-bg'
                  : 'border-border bg-surface-subtle',
            )}
          >
            <div
              className={cn(
                'mb-3 flex h-10 w-10 items-center justify-center rounded-pill text-sm font-black shadow-toss-sm',
                isCurrent
                  ? 'bg-brand text-white'
                  : isDone
                    ? 'bg-success text-white'
                    : 'bg-white text-ink-600 ring-1 ring-border',
              )}
            >
              {isDone ? <CheckCircle className="h-5 w-5" /> : stepNumber}
            </div>
            <p className="text-base font-bold text-ink-950">{step.title}</p>
            <p className="mt-1 text-sm leading-6 text-ink-800">{step.description}</p>
          </li>
        )
      })}
    </ol>
  )
}
