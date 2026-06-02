'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Bookmark, CheckCircle, RotateCcw, Star, type LucideIcon } from 'lucide-react'
import { AppBadge } from '@/components/ui/AppBadge'
import { AppButton } from '@/components/ui/AppButton'
import { cn } from '@/lib/cn'
import { useWorkflowDispatch, useWorkflowState } from '@/state/WorkflowContext'

type FollowUpAction = 'reorder' | 'crm'

const followUpOptions: Array<{
  value: FollowUpAction
  label: string
  description: string
  icon: LucideIcon
}> = [
  {
    value: 'reorder',
    label: '동일 공장에 재의뢰',
    description: '이번 거래 조건을 기반으로 새 견적 요청을 시작합니다.',
    icon: RotateCcw,
  },
  {
    value: 'crm',
    label: '거래처로 관리',
    description: '공장 정보를 거래처 목록에 저장하고 후속 관리를 이어갑니다.',
    icon: Bookmark,
  },
]

export default function TransactionReviewPage() {
  const router = useRouter()
  const workflowState = useWorkflowState()
  const workflowDispatch = useWorkflowDispatch()
  const [rating, setRating] = useState(0)
  const [hoverRating, setHoverRating] = useState(0)
  const [content, setContent] = useState('')
  const [followUpAction, setFollowUpAction] = useState<FollowUpAction | ''>('')

  const contract = workflowState.hydrated ? workflowState.contract : null
  const displayedRating = hoverRating || rating
  const trimmedContent = content.trim()
  const validationMessage = getValidationMessage(rating, trimmedContent, followUpAction)
  const canSubmit = validationMessage === null
  const projectName = contract?.projectName ?? '이전 거래'
  const factoryName = contract?.factoryName

  function submitReview() {
    if (!canSubmit) return

    workflowDispatch({
      type: 'workflow/submitReview',
      payload: {
        transactionId: workflowState.contract?.transactionId ?? 'TXN-2026-018',
        rating,
        content: trimmedContent,
        submittedAt: new Date().toISOString(),
      },
    })
    router.push('/dashboard')
  }

  return (
    <div className="min-h-screen bg-surface-muted px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl">
        <header className="mb-8 rounded-2xl border border-emerald-100 bg-white p-6 shadow-sm sm:p-8">
          <AppBadge variant="green">
            <CheckCircle className="h-4 w-4" />
            거래 완료
          </AppBadge>
          <h1 className="mt-4 text-3xl font-bold tracking-normal text-ink-950 sm:text-4xl">
            거래 완료 및 리뷰 작성
          </h1>
          <p className="mt-3 text-lg leading-8 text-ink-700">
            거래에 대한 후기를 남기고 후속 액션을 선택하세요.
          </p>
          <div className="mt-6 rounded-2xl bg-surface-muted p-4">
            <p className="text-xs font-semibold text-ink-400">거래 요약</p>
            <p className="mt-2 text-lg font-bold text-ink-950">{projectName}</p>
            {factoryName && <p className="mt-1 text-sm text-ink-700">{factoryName}</p>}
          </div>
        </header>

        <main className="space-y-6">
          <section className="rounded-2xl border border-border bg-white p-5 shadow-sm sm:p-7">
            <div className="mb-4 flex items-center justify-between gap-4">
              <h2 className="text-2xl font-bold text-ink-950">평점</h2>
              <span className="text-sm font-bold text-ink-700">{rating}/5</span>
            </div>
            <div className="flex gap-2" onMouseLeave={() => setHoverRating(0)}>
              {[1, 2, 3, 4, 5].map((index) => (
                <button
                  key={index}
                  type="button"
                  aria-label={`${index}점 선택`}
                  onClick={() => setRating(index)}
                  onMouseEnter={() => setHoverRating(index)}
                  className="rounded-xl p-1 transition focus:outline-none focus:ring-4 focus:ring-brand-light"
                >
                  <Star
                    className={cn(
                      'h-10 w-10 transition',
                      index <= displayedRating
                        ? 'fill-amber-400 text-amber-400'
                        : 'text-ink-400 hover:text-amber-400',
                    )}
                  />
                </button>
              ))}
            </div>
          </section>

          <section className="rounded-2xl border border-border bg-white p-5 shadow-sm sm:p-7">
            <label className="block">
              <span className="mb-4 block text-2xl font-bold text-ink-950">후기</span>
              <textarea
                rows={5}
                value={content}
                onChange={(event) => setContent(event.target.value)}
                placeholder="공장과의 거래 경험을 공유해주세요..."
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-base outline-none focus:border-brand focus:ring-4 focus:ring-brand-light"
              />
            </label>
          </section>

          <section className="rounded-2xl border border-border bg-white p-5 shadow-sm sm:p-7">
            <h2 className="mb-4 text-2xl font-bold text-ink-950">후속 액션</h2>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {followUpOptions.map((option) => {
                const Icon = option.icon
                const selected = followUpAction === option.value

                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setFollowUpAction(option.value)}
                    className={cn(
                      'flex cursor-pointer items-start gap-3 rounded-xl border-2 p-4 text-left transition focus:outline-none focus:ring-4 focus:ring-brand-light',
                      selected
                        ? 'border-brand bg-brand-light/30'
                        : 'border-border hover:border-brand-light',
                    )}
                  >
                    <Icon className="mt-0.5 h-5 w-5 text-brand" />
                    <span>
                      <span className="block text-base font-bold text-ink-950">{option.label}</span>
                      <span className="mt-1 block text-sm leading-6 text-ink-700">
                        {option.description}
                      </span>
                    </span>
                  </button>
                )
              })}
            </div>
          </section>

          <section className="rounded-2xl border border-border bg-white p-5 shadow-sm sm:p-7">
            <AppButton size="lg" fullWidth disabled={!canSubmit} onClick={submitReview}>
              리뷰 제출
            </AppButton>
            {validationMessage && (
              <p className="mt-3 text-center text-sm font-semibold text-danger">
                {validationMessage}
              </p>
            )}
          </section>
        </main>
      </div>
    </div>
  )
}

function getValidationMessage(
  rating: number,
  content: string,
  followUpAction: FollowUpAction | '',
): string | null {
  if (rating === 0) return '평점을 선택해주세요.'
  if (content.length < 10) return '후기를 10자 이상 입력해주세요.'
  if (!followUpAction) return '후속 액션을 선택해주세요.'
  return null
}
