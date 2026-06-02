'use client'

import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  CalendarDays,
  CheckCircle2,
  Factory,
  FileText,
  Package,
  Send,
  Wallet,
} from 'lucide-react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import type { Message, ReceivedQuoteRequestStatus } from '@rootmatching/shared'
import { AppBadge } from '@/components/ui/AppBadge'
import { AppButton } from '@/components/ui/AppButton'
import { mockReceivedQuoteRequests } from '@/data/requestData'
import { useMessagesDispatch } from '@/state/MessagesContext'

const quoteSubmissionSchema = z.object({
  quoteAmount: z.string().min(1, '견적 금액을 입력해주세요'),
  productionPeriod: z.string().min(1, '제작 기간을 입력해주세요'),
  possibleDeadline: z.string().min(1, '가능 납기를 입력해주세요'),
  paymentTerms: z.string().min(1, '결제 조건을 선택해주세요'),
  proposalMessage: z.string().min(10, '제안 메시지를 10자 이상 입력해주세요'),
})

type QuoteSubmission = z.infer<typeof quoteSubmissionSchema>

const PAYMENT_TERM_OPTIONS = [
  '선급 30%, 잔금 70% (납품 후)',
  '30일 후 결제',
  '60일 후 결제',
  '현금 결제 (납품 시)',
]

const labelClassName = 'mb-2 block text-sm font-bold text-ink-950'
const inputClassName =
  'w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-base outline-none transition placeholder:text-ink-400 focus:border-brand focus:ring-4 focus:ring-brand-light'
const errorClassName = 'mt-2 text-sm font-semibold text-danger'

function getStatusLabel(status: ReceivedQuoteRequestStatus): string {
  if (status === 'new') return '신규 요청'
  if (status === 'reviewing') return '검토 중'
  return '견적 제출 완료'
}

function getStatusVariant(status: ReceivedQuoteRequestStatus): 'blue' | 'green' | 'amber' {
  if (status === 'new') return 'blue'
  if (status === 'reviewing') return 'amber'
  return 'green'
}

export default function FactoryRequestDetailPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const dispatch = useMessagesDispatch()
  const request = mockReceivedQuoteRequests.find((item) => item.id === params.id)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<QuoteSubmission>({
    resolver: zodResolver(quoteSubmissionSchema),
    defaultValues: {
      quoteAmount: '',
      productionPeriod: '',
      possibleDeadline: '',
      paymentTerms: '',
      proposalMessage: '',
    },
  })

  if (!request) {
    return (
      <div className="min-h-screen bg-surface-muted px-4 py-8 sm:px-6 lg:px-8">
        <main className="mx-auto max-w-6xl">
          <section className="rounded-2xl border border-border bg-white p-12 text-center shadow-sm">
            <Factory className="mx-auto h-12 w-12 text-ink-400" />
            <h1 className="mt-4 text-2xl font-bold text-ink-950">요청을 찾을 수 없습니다.</h1>
            <Link
              href="/factory/requests"
              className="mt-6 inline-flex items-center justify-center gap-2 rounded-xl bg-brand px-5 py-3 text-sm font-bold text-white transition hover:bg-brand-hover"
            >
              받은 요청 목록
              <ArrowRight className="h-4 w-4" />
            </Link>
          </section>
        </main>
      </div>
    )
  }

  const currentRequest = request

  function submitQuote(data: QuoteSubmission) {
    const newMessageId = `msg-quote-${Date.now()}`
    const newMessage: Message = {
      id: newMessageId,
      senderId: 'user1',
      senderName: '홍길동',
      senderCompany: '테크솔루션 주식회사',
      receiverId: 'client-' + currentRequest.id,
      receiverName: currentRequest.clientName,
      receiverCompany: currentRequest.clientName,
      subject: `[견적 협의] ${currentRequest.projectName}`,
      content: `프로젝트: ${currentRequest.projectName}\n견적 금액: ${data.quoteAmount}\n제작 기간: ${data.productionPeriod}일\n가능 납기: ${data.possibleDeadline}\n결제 조건: ${data.paymentTerms}\n\n${data.proposalMessage}`,
      isRead: false,
      createdAt: new Date().toISOString(),
    }

    dispatch({ type: 'messages/sendMessage', payload: newMessage })
    router.push(`/messages?message=${newMessageId}&context=quote`)
  }

  return (
    <div className="min-h-screen bg-surface-muted px-4 py-8 sm:px-6 lg:px-8">
      <main className="mx-auto max-w-6xl">
        <Link
          href="/factory/requests"
          className="mb-5 inline-flex items-center gap-2 text-sm font-bold text-ink-700 transition hover:text-brand"
        >
          <ArrowLeft className="h-4 w-4" />
          받은 요청 목록
        </Link>

        <section className="space-y-6">
          <header className="rounded-2xl border border-border bg-white p-6 shadow-sm sm:p-8">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <div className="mb-4 flex flex-wrap items-center gap-2">
                  <AppBadge variant={getStatusVariant(request.status)}>
                    {getStatusLabel(request.status)}
                  </AppBadge>
                  <span className="text-sm font-semibold text-ink-400">{request.requestedAt}</span>
                </div>
                <h1 className="text-3xl font-bold tracking-normal text-ink-950 sm:text-4xl">
                  {request.projectName}
                </h1>
                <p className="mt-3 flex items-center gap-2 text-base font-semibold text-ink-700">
                  <Building2 className="h-4 w-4 text-ink-400" />
                  {request.clientName}
                </p>
              </div>

              <AppBadge variant="blue">
                <Factory className="h-4 w-4" />
                받은 견적 요청
              </AppBadge>
            </div>
          </header>

          <section className="rounded-2xl border border-border bg-white p-6 shadow-sm sm:p-8">
            <h2 className="text-xl font-bold text-ink-950">요청 상세 정보</h2>
            <dl className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
              <DetailItem
                icon={<Package className="h-5 w-5" />}
                label="품목 / 공정"
                title={request.productItem}
                subtitle={request.processType}
              />
              <DetailItem
                icon={<CheckCircle2 className="h-5 w-5" />}
                label="수량"
                title={request.quantity}
              />
              <DetailItem
                icon={<Wallet className="h-5 w-5" />}
                label="예산"
                title={request.budgetRange}
              />
              <DetailItem
                icon={<CalendarDays className="h-5 w-5" />}
                label="희망 납기"
                title={request.desiredDeadline}
              />
              <div className="rounded-xl bg-surface-muted p-4 md:col-span-2">
                <dt className="text-sm font-semibold text-ink-400">요청 내용</dt>
                <dd className="mt-2 whitespace-pre-line text-base leading-7 text-ink-700">
                  {request.description}
                </dd>
              </div>
              <div className="rounded-xl bg-surface-muted p-4 md:col-span-2">
                <dt className="text-sm font-semibold text-ink-400">첨부 자료</dt>
                <dd className="mt-3 space-y-2">
                  {request.attachments.map((attachment) => (
                    <a
                      key={attachment.id}
                      href={attachment.url}
                      className="flex items-center justify-between rounded-xl border border-border bg-white px-4 py-3 text-sm font-semibold text-ink-700 transition hover:border-brand-light hover:bg-brand-light/40 hover:text-brand"
                    >
                      <span className="inline-flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        {attachment.name}
                      </span>
                      <span className="text-xs text-ink-400">
                        {Math.round(attachment.size / 1000).toLocaleString()}KB
                      </span>
                    </a>
                  ))}
                </dd>
              </div>
            </dl>
          </section>

          <section className="rounded-2xl border border-border bg-white p-6 shadow-sm sm:p-8">
            <div className="mb-6">
              <h2 className="text-xl font-bold text-ink-950">견적 제출</h2>
              <p className="mt-2 text-sm leading-6 text-ink-400">
                발주처가 바로 검토할 수 있도록 금액, 납기, 결제 조건을 명확히 작성해주세요.
              </p>
            </div>

            <form onSubmit={handleSubmit(submitQuote)} className="space-y-5">
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                <div>
                  <label htmlFor="quoteAmount" className={labelClassName}>
                    견적 금액
                  </label>
                  <input
                    id="quoteAmount"
                    type="text"
                    placeholder="예: 5,000,000원"
                    className={inputClassName}
                    {...register('quoteAmount')}
                  />
                  {errors.quoteAmount && (
                    <p className={errorClassName}>{errors.quoteAmount.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="productionPeriod" className={labelClassName}>
                    제작 기간 (일)
                  </label>
                  <input
                    id="productionPeriod"
                    type="text"
                    inputMode="numeric"
                    placeholder="예: 30"
                    className={inputClassName}
                    {...register('productionPeriod')}
                  />
                  {errors.productionPeriod && (
                    <p className={errorClassName}>{errors.productionPeriod.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="possibleDeadline" className={labelClassName}>
                    가능 납기
                  </label>
                  <input
                    id="possibleDeadline"
                    type="text"
                    placeholder="예: 2026-06-15"
                    className={inputClassName}
                    {...register('possibleDeadline')}
                  />
                  {errors.possibleDeadline && (
                    <p className={errorClassName}>{errors.possibleDeadline.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="paymentTerms" className={labelClassName}>
                    결제 조건
                  </label>
                  <select
                    id="paymentTerms"
                    className={`${inputClassName} appearance-none`}
                    {...register('paymentTerms')}
                  >
                    <option value="">결제 조건을 선택해주세요</option>
                    {PAYMENT_TERM_OPTIONS.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                  {errors.paymentTerms && (
                    <p className={errorClassName}>{errors.paymentTerms.message}</p>
                  )}
                </div>
              </div>

              <div>
                <label htmlFor="proposalMessage" className={labelClassName}>
                  제안 메시지
                </label>
                <textarea
                  id="proposalMessage"
                  rows={6}
                  placeholder="발주처에 전달할 제안 내용..."
                  className={inputClassName}
                  {...register('proposalMessage')}
                />
                {errors.proposalMessage && (
                  <p className={errorClassName}>{errors.proposalMessage.message}</p>
                )}
              </div>

              <AppButton
                type="submit"
                variant="primary"
                size="lg"
                fullWidth
                disabled={isSubmitting}
              >
                <Send className="h-5 w-5" />
                견적 제출하기
              </AppButton>
            </form>
          </section>
        </section>
      </main>
    </div>
  )
}

function DetailItem({
  icon,
  label,
  title,
  subtitle,
}: {
  icon: React.ReactNode
  label: string
  title: string
  subtitle?: string
}) {
  return (
    <div className="rounded-xl bg-surface-muted p-4">
      <dt className="flex items-center gap-2 text-sm font-semibold text-ink-400">
        {icon}
        {label}
      </dt>
      <dd className="mt-2 font-bold text-ink-950">{title}</dd>
      {subtitle && <dd className="mt-1 text-sm text-ink-400">{subtitle}</dd>}
    </div>
  )
}
