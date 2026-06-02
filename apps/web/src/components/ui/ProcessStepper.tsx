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
          <li key={step.title} className="rounded-xl border border-border bg-surface-muted p-4">
            <div
              className={cn(
                'mb-3 flex h-9 w-9 items-center justify-center rounded-full text-sm font-black',
                isCurrent
                  ? 'bg-brand text-white'
                  : isDone
                    ? 'bg-emerald-500 text-white'
                    : 'bg-white text-ink-400',
              )}
            >
              {isDone ? <CheckCircle className="h-5 w-5" /> : stepNumber}
            </div>
            <p className="text-sm font-bold text-ink-950">{step.title}</p>
            <p className="mt-1 text-xs leading-5 text-ink-400">{step.description}</p>
          </li>
        )
      })}
    </ol>
  )
}
