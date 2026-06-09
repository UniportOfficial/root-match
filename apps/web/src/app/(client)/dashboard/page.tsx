'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  AlertCircle,
  ArrowRight,
  Building2,
  CheckCircle2,
  CircleDollarSign,
  Clock3,
  FileText,
  Mail,
  MapPin,
  MessageCircle,
  ShieldCheck,
  RefreshCw,
  Sparkles,
  Wallet,
  type LucideIcon,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { fetchCompanySummary } from '@/lib/companies-api'
import { useCompaniesState } from '@/state/CompaniesContext'
import { useUserState } from '@/state/UserContext'
import { cn } from '@/lib/utils'
import type { CompanySummaryResponse } from '@rootmatching/shared'

interface SupportingStat {
  title: string
  value: number
  icon: LucideIcon
  delta: string
  deltaTone: 'success' | 'muted'
  testId: string
}

type FinanceField =
  | 'currentMonthAmount'
  | 'escrowBalance'
  | 'settlementPending'
  | 'settlementCompleted'

type StatusField = 'pending' | 'awaitingResponse' | 'decisionRequired' | 'ongoing'

const formatKoreanWon = (value: number) =>
  new Intl.NumberFormat('ko-KR', {
    style: 'currency',
    currency: 'KRW',
    maximumFractionDigits: 0,
  }).format(value)

export default function DashboardPage() {
  const { currentUser } = useUserState()
  const { companies } = useCompaniesState()
  const recentCompanies = companies.slice(0, 3)

  const [retryCount, setRetryCount] = useState(0)
  const [summary, setSummary] = useState<CompanySummaryResponse | null>(null)
  const [summaryError, setSummaryError] = useState<string | null>(null)
  const [minElapsed, setMinElapsed] = useState(false)
  const [fetchDone, setFetchDone] = useState(false)

  useEffect(() => {
    setSummary(null)
    setSummaryError(null)
    setFetchDone(false)
    setMinElapsed(false)
    const timer = setTimeout(() => setMinElapsed(true), 300)
    fetchCompanySummary()
      .then(setSummary)
      .catch((err: unknown) => {
        setSummaryError(err instanceof Error ? err.message : '일시적 오류가 발생했습니다.')
      })
      .finally(() => setFetchDone(true))
    return () => clearTimeout(timer)
  }, [retryCount])

  const handleRetry = () => setRetryCount((c) => c + 1)

  const showSkeleton = !minElapsed || !fetchDone

  const supportingStats: SupportingStat[] = summary
    ? [
        {
          title: '거래 진행 중',
          value: summary.quoteRequestStatusCounts.ongoing,
          icon: RefreshCw,
          delta: '진행 중인 거래',
          deltaTone: 'muted',
          testId: 'dashboard-stat-ongoing',
        },
        {
          title: '검증 기업',
          value: summary.verifiedCompanies,
          icon: CheckCircle2,
          delta: '인증/자격 데이터 기준',
          deltaTone: 'muted',
          testId: 'dashboard-stat-verified-companies',
        },
        {
          title: '활성 권역',
          value: summary.activeRegions,
          icon: MapPin,
          delta: '기업 지역 데이터 기준',
          deltaTone: 'muted',
          testId: 'dashboard-stat-active-regions',
        },
      ]
    : []

  const mockFields = summary?.meta.mockFields ?? []
  const hasMockField = (field: string) => mockFields.includes(field)
  const hasStatusMockField = (field: StatusField) =>
    mockFields.includes(`quoteRequestStatusCounts.${field}`)

  const financeCards: Array<{
    title: string
    description: string
    value: string
    field: FinanceField
    icon: LucideIcon
    testId: string
    tone: string
  }> = summary
    ? [
        {
          title: '이번 달 거래액',
          description: '완료·진행 거래 합산 기준',
          value: formatKoreanWon(summary.currentMonthAmount),
          field: 'currentMonthAmount',
          icon: CircleDollarSign,
          testId: 'kpi-current-month-amount',
          tone: 'border-primary/20 bg-primary/5 text-primary',
        },
        {
          title: '안심결제 예치금',
          description: '안전하게 보관 중인 금액',
          value: formatKoreanWon(summary.escrowBalance),
          field: 'escrowBalance',
          icon: ShieldCheck,
          testId: 'kpi-escrow-balance',
          tone: 'border-[#7C3AED]/30 bg-[#7C3AED]/5 text-[#7C3AED]',
        },
        {
          title: '정산 대기',
          description: '확인 후 지급 예정 금액',
          value: formatKoreanWon(summary.settlementPending),
          field: 'settlementPending',
          icon: Clock3,
          testId: 'kpi-settlement-pending',
          tone: 'border-warning/30 bg-warning-subtle text-warning-foreground',
        },
        {
          title: '정산 완료',
          description: '지급 처리가 끝난 금액',
          value: formatKoreanWon(summary.settlementCompleted),
          field: 'settlementCompleted',
          icon: Wallet,
          testId: 'kpi-settlement-completed',
          tone: 'border-success/30 bg-success-subtle text-success',
        },
      ]
    : []

  const statusCards: Array<{
    title: string
    count: number
    field: StatusField
    activeCopy: string
    emptyCopy: string
    href: string
    cta: string
    icon: LucideIcon
    testId: string
    tone: string
  }> = summary
    ? [
        {
          title: '접수 대기',
          count: summary.quoteRequestStatusCounts.pending,
          field: 'pending',
          activeCopy: '새 견적 요청을 검토해 주세요.',
          emptyCopy: '대기 중인 새 요청이 없습니다. 필요한 품목을 새로 등록해 보세요.',
          href: '/request',
          cta: '새 견적 요청 작성하기',
          icon: FileText,
          testId: 'status-pending',
          tone: 'border-info/30 bg-info-subtle text-info',
        },
        {
          title: '응답 대기',
          count: summary.quoteRequestStatusCounts.awaitingResponse,
          field: 'awaitingResponse',
          activeCopy: '공장 답변을 기다리는 요청입니다.',
          emptyCopy: '현재 기다리는 답변이 없습니다. 진행 현황을 확인하세요.',
          href: '/requests',
          cta: '내 요청 목록 보기',
          icon: MessageCircle,
          testId: 'status-awaiting-response',
          tone: 'border-warning/30 bg-warning-subtle text-warning-foreground',
        },
        {
          title: '결정 필요',
          count: summary.quoteRequestStatusCounts.decisionRequired,
          field: 'decisionRequired',
          activeCopy: '견적 선택 또는 계약 전환이 필요합니다.',
          emptyCopy: '지금 선택할 견적은 없습니다. 추천 결과를 먼저 확인하세요.',
          href: '/matching',
          cta: 'AI 매칭 결과 보기',
          icon: Sparkles,
          testId: 'status-decision-required',
          tone: 'border-primary/30 bg-primary/5 text-primary',
        },
        {
          title: '거래 진행',
          count: summary.quoteRequestStatusCounts.ongoing,
          field: 'ongoing',
          activeCopy: '계약 후 진행 중인 거래입니다.',
          emptyCopy: '진행 중인 거래가 없습니다. 새 매칭에서 시작할 수 있습니다.',
          href: '/transactions',
          cta: '거래 목록 확인하기',
          icon: RefreshCw,
          testId: 'status-ongoing',
          tone: 'border-[#7C3AED]/30 bg-[#7C3AED]/5 text-[#7C3AED]',
        },
      ]
    : []

  return (
    <div className="bg-background px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-8">
        <header
          data-testid="dashboard-hero"
          className="relative overflow-hidden rounded-2xl border border-border bg-card p-6 shadow-ct-soft sm:p-8"
        >
          <div
            className="pointer-events-none absolute -right-12 -top-12 h-56 w-56 rounded-full bg-accent/50 blur-3xl"
            aria-hidden="true"
          />
          <div className="relative space-y-6">
            <div className="grid gap-6 sm:grid-cols-[1fr_auto] sm:items-end">
              <div className="space-y-3">
                <p className="text-kr-keep text-[13px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
                  오늘의 액션 센터
                </p>
                {showSkeleton ? (
                  <div className="animate-pulse space-y-2">
                    <div className="h-9 w-3/4 rounded-lg bg-muted" />
                    <div className="h-9 w-1/2 rounded-lg bg-muted" />
                  </div>
                ) : summaryError ? (
                  <h1 className="text-kr-balance text-[26px] font-bold leading-tight text-foreground sm:text-[32px]">
                    {currentUser ? `${currentUser.name}님, ` : '환영합니다. '}
                    <br className="hidden sm:block" />
                    데이터를 불러오지 못했습니다.
                  </h1>
                ) : (
                  <h1 className="text-kr-balance text-[26px] font-bold leading-tight text-foreground sm:text-[32px]">
                    {currentUser ? `${currentUser.name}님, ` : '환영합니다. '}
                    <br className="hidden sm:block" />
                    등록된 공장{' '}
                    <span className="text-primary">
                      {summary!.totalCompanies.toLocaleString('ko-KR')}곳
                    </span>{' '}
                    중 오늘의 추천을 확인하세요.
                  </h1>
                )}
                <p className="text-kr-pretty text-[15px] leading-7 text-muted-foreground sm:text-[16px]">
                  아래 카드를 눌러 바로 다음 행동을 진행하세요.
                </p>
              </div>
              <Button asChild size="xl" className="w-full shadow-toss-md sm:w-auto">
                <Link href="/matching">
                  <Sparkles className="h-5 w-5" />
                  AI 매칭 결과 보기
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {showSkeleton ? (
                <>
                  {[0, 1, 2].map((i) => (
                    <div key={i} className="h-[76px] animate-pulse rounded-xl bg-muted" />
                  ))}
                </>
              ) : summaryError ? (
                <div className="col-span-full flex flex-col items-start gap-3 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-4 sm:flex-row sm:items-center">
                  <AlertCircle className="h-5 w-5 shrink-0 text-destructive" />
                  <div className="min-w-0 flex-1">
                    <p className="text-kr-keep text-[14px] font-bold text-destructive">
                      현황 데이터를 불러오지 못했습니다.
                    </p>
                    <p className="text-kr-keep mt-0.5 text-[13px] text-muted-foreground">
                      {summaryError}
                    </p>
                  </div>
                  <Button variant="outline" size="sm" onClick={handleRetry} className="shrink-0">
                    <RefreshCw className="h-4 w-4" />
                    다시 시도
                  </Button>
                </div>
              ) : (
                <>
                  <Link
                    href="/companies"
                    className={cn(
                      'group flex items-center gap-3 rounded-xl border px-4 py-3.5 transition-colors',
                      'border-primary/30 bg-primary/5 text-primary hover:bg-primary/10',
                      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40',
                    )}
                  >
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-card/80 shadow-ct-soft">
                      <Building2 className="h-5 w-5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-kr-keep text-[13px] font-bold opacity-80">등록된 공장</p>
                      <p className="text-kr-keep text-[22px] font-extrabold leading-tight tabular-nums">
                        {summary!.totalCompanies.toLocaleString('ko-KR')}곳
                      </p>
                    </div>
                    <ArrowRight className="h-4 w-4 shrink-0 opacity-70 transition-transform group-hover:translate-x-0.5" />
                  </Link>

                  {summary!.pendingInquiries > 0 ? (
                    <Link
                      href="/requests"
                      className={cn(
                        'group flex items-center gap-3 rounded-xl border px-4 py-3.5 transition-colors',
                        'border-warning/30 bg-warning-subtle text-warning-foreground hover:bg-warning/10',
                        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40',
                      )}
                    >
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-card/80 shadow-ct-soft">
                        <MessageCircle className="h-5 w-5" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-kr-keep text-[13px] font-bold opacity-80">
                          답장 필요한 문의
                        </p>
                        <p className="text-kr-keep text-[22px] font-extrabold leading-tight tabular-nums">
                          {summary!.pendingInquiries.toLocaleString('ko-KR')}건
                        </p>
                      </div>
                      <ArrowRight className="h-4 w-4 shrink-0 opacity-70 transition-transform group-hover:translate-x-0.5" />
                    </Link>
                  ) : (
                    <Link
                      href="/request"
                      data-testid="dashboard-inquiry-empty-cta"
                      className={cn(
                        'group flex items-center gap-3 rounded-xl border px-4 py-3.5 transition-colors',
                        'border-border bg-muted/50 text-muted-foreground hover:bg-muted',
                        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40',
                      )}
                    >
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-card/80 shadow-ct-soft">
                        <FileText className="h-5 w-5" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-kr-keep text-[13px] font-bold opacity-80">
                          답장 필요한 문의 없음
                        </p>
                        <p className="text-kr-keep text-[14px] font-semibold leading-tight">
                          새 견적 요청 작성하기 →
                        </p>
                      </div>
                    </Link>
                  )}

                  {summary!.unreadMessages > 0 ? (
                    <Link
                      href="/messages"
                      className={cn(
                        'group flex items-center gap-3 rounded-xl border px-4 py-3.5 transition-colors',
                        'border-info/30 bg-info-subtle text-info hover:bg-info/10',
                        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40',
                      )}
                    >
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-card/80 shadow-ct-soft">
                        <Mail className="h-5 w-5" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-kr-keep text-[13px] font-bold opacity-80">
                          미확인 메시지
                        </p>
                        <p className="text-kr-keep text-[22px] font-extrabold leading-tight tabular-nums">
                          {summary!.unreadMessages.toLocaleString('ko-KR')}건
                        </p>
                      </div>
                      <ArrowRight className="h-4 w-4 shrink-0 opacity-70 transition-transform group-hover:translate-x-0.5" />
                    </Link>
                  ) : (
                    <Link
                      href="/messages"
                      data-testid="dashboard-message-empty-cta"
                      className={cn(
                        'group flex items-center gap-3 rounded-xl border px-4 py-3.5 transition-colors',
                        'border-border bg-muted/50 text-muted-foreground hover:bg-muted',
                        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40',
                      )}
                    >
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-card/80 shadow-ct-soft">
                        <Mail className="h-5 w-5" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-kr-keep text-[13px] font-bold opacity-80">
                          미확인 메시지 없음
                        </p>
                        <p className="text-kr-keep text-[14px] font-semibold leading-tight">
                          받은 메시지 확인하기 →
                        </p>
                      </div>
                    </Link>
                  )}
                </>
              )}
            </div>
          </div>
        </header>

        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr_1fr]">
          {summaryError ? (
            <Card className="sm:col-span-2 lg:col-span-4">
              <CardContent className="flex flex-col items-start gap-3 p-6 sm:flex-row sm:items-center">
                <AlertCircle className="h-5 w-5 shrink-0 text-destructive" />
                <div className="min-w-0 flex-1">
                  <p className="text-kr-keep text-[14px] font-bold text-destructive">
                    통계 데이터를 불러오지 못했습니다.
                  </p>
                  <p className="text-kr-keep mt-0.5 text-[13px] text-muted-foreground">
                    {summaryError}
                  </p>
                </div>
                <Button variant="outline" size="sm" onClick={handleRetry} className="shrink-0">
                  <RefreshCw className="h-4 w-4" />
                  다시 시도
                </Button>
              </CardContent>
            </Card>
          ) : (
            <>
              {showSkeleton ? (
                <div className="h-40 animate-pulse rounded-2xl bg-primary/20 shadow-ct-card sm:col-span-2 lg:col-span-1" />
              ) : (
                <Card
                  data-testid="dashboard-stat-total-companies"
                  className="border-primary/20 bg-primary text-primary-foreground shadow-ct-card sm:col-span-2 lg:col-span-1"
                >
                  <CardContent className="flex h-full flex-col justify-between gap-6 p-6">
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <p className="text-kr-keep text-[14px] font-bold opacity-90">등록 기업</p>
                        <p className="text-kr-keep text-[13px] font-semibold opacity-70">
                          실시간 디렉토리 기준
                        </p>
                      </div>
                      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/10">
                        <Sparkles className="h-5 w-5" />
                      </span>
                    </div>
                    <div>
                      <p className="text-[52px] font-bold leading-none tabular-nums sm:text-[60px]">
                        {summary!.totalCompanies.toLocaleString('ko-KR')}
                      </p>
                      <Link
                        href="/matching"
                        className="text-kr-keep mt-4 inline-flex items-center gap-1 text-[14px] font-bold opacity-90 transition hover:gap-2 hover:opacity-100"
                      >
                        추천 결과 보기 <ArrowRight className="h-3.5 w-3.5" />
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              )}

              {showSkeleton ? (
                <>
                  {[0, 1, 2].map((i) => (
                    <div
                      key={i}
                      className="h-36 animate-pulse rounded-2xl bg-muted shadow-ct-soft"
                    />
                  ))}
                </>
              ) : (
                <>
                  {supportingStats.map((stat) => {
                    const Icon = stat.icon
                    return (
                      <Card
                        key={stat.title}
                        data-testid={stat.testId}
                        className="border-border bg-card shadow-ct-soft transition-shadow hover:shadow-ct-card"
                      >
                        <CardContent className="flex h-full flex-col justify-between gap-4 p-5">
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-kr-keep text-[14px] font-bold text-muted-foreground">
                              {stat.title}
                            </p>
                            <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
                          </div>
                          <div className="space-y-2">
                            <p className="text-[30px] font-bold leading-none tabular-nums text-foreground">
                              {stat.value.toLocaleString('ko-KR')}
                            </p>
                            <p
                              className={cn(
                                'text-kr-keep text-[13px] font-semibold',
                                stat.deltaTone === 'success'
                                  ? 'text-success'
                                  : 'text-muted-foreground',
                              )}
                            >
                              {stat.delta}
                            </p>
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })}
                </>
              )}
            </>
          )}
        </section>

        {!summaryError && (
          <section className="space-y-4">
            <div>
              <h2 className="text-kr-pretty text-[20px] font-bold text-foreground sm:text-[22px]">
                정산 KPI
              </h2>
              <p className="text-kr-pretty mt-1 text-[14px] text-muted-foreground">
                이번 달 거래와 안심결제 흐름을 한눈에 확인하세요.
              </p>
            </div>

            {showSkeleton ? (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {[0, 1, 2, 3].map((i) => (
                  <div key={i} className="h-44 animate-pulse rounded-2xl bg-muted shadow-ct-soft" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {financeCards.map((card) => {
                  const Icon = card.icon
                  return (
                    <Card
                      key={card.testId}
                      data-testid={card.testId}
                      className={cn(
                        'bg-card shadow-ct-soft transition-shadow hover:shadow-ct-card',
                        card.tone,
                      )}
                    >
                      <CardContent className="flex h-full flex-col justify-between gap-5 p-5">
                        <div className="flex items-start justify-between gap-3">
                          <div className="space-y-2">
                            <p className="text-kr-keep text-[14px] font-bold text-foreground">
                              {card.title}
                            </p>
                            <p className="text-kr-pretty text-[13px] leading-5 text-muted-foreground">
                              {card.description}
                            </p>
                          </div>
                          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-card/80 shadow-ct-soft">
                            <Icon className="h-5 w-5" />
                          </span>
                        </div>
                        <div className="space-y-3">
                          <p className="break-keep text-[24px] font-extrabold leading-tight tabular-nums text-foreground sm:text-[26px]">
                            {card.value}
                          </p>
                          {hasMockField(card.field) && (
                            <Badge variant="warning" size="sm" className="text-kr-keep">
                              (시뮬레이션 데이터)
                            </Badge>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            )}
          </section>
        )}

        {!summaryError && (
          <section className="space-y-4">
            <div>
              <h2 className="text-kr-pretty text-[20px] font-bold text-foreground sm:text-[22px]">
                거래 상태
              </h2>
              <p className="text-kr-pretty mt-1 text-[14px] text-muted-foreground">
                대기·응답·결정·진행 단계를 빠르게 점검하세요.
              </p>
            </div>

            {showSkeleton ? (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {[0, 1, 2, 3].map((i) => (
                  <div key={i} className="h-48 animate-pulse rounded-2xl bg-muted shadow-ct-soft" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {statusCards.map((card) => {
                  const Icon = card.icon
                  const hasItems = card.count > 0
                  return (
                    <Card
                      key={card.testId}
                      data-testid={card.testId}
                      className={cn(
                        'bg-card shadow-ct-soft transition-shadow hover:shadow-ct-card',
                        card.tone,
                      )}
                    >
                      <CardContent className="flex h-full flex-col justify-between gap-5 p-5">
                        <div className="flex items-start justify-between gap-3">
                          <div className="space-y-2">
                            <p className="text-kr-keep text-[14px] font-bold text-foreground">
                              {card.title}
                            </p>
                            {hasStatusMockField(card.field) && (
                              <Badge variant="warning" size="sm" className="text-kr-keep">
                                (시뮬레이션 데이터)
                              </Badge>
                            )}
                          </div>
                          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-card/80 shadow-ct-soft">
                            <Icon className="h-5 w-5" />
                          </span>
                        </div>
                        <div className="space-y-3">
                          <p className="text-[30px] font-extrabold leading-none tabular-nums text-foreground">
                            {hasItems ? `${card.count.toLocaleString('ko-KR')}건` : '대기 없음'}
                          </p>
                          <p className="text-kr-pretty text-[14px] leading-6 text-muted-foreground">
                            {hasItems ? card.activeCopy : card.emptyCopy}
                          </p>
                          <Link
                            href={card.href}
                            className="text-kr-keep inline-flex min-h-10 items-center gap-1 rounded-lg text-[14px] font-bold text-primary transition hover:gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
                          >
                            {card.cta} <ArrowRight className="h-3.5 w-3.5" />
                          </Link>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            )}
          </section>
        )}

        <section>
          <div className="mb-4 flex items-end justify-between gap-4">
            <div>
              <h2 className="text-kr-pretty text-[20px] font-bold text-foreground sm:text-[22px]">
                최근 등록 기업
              </h2>
              <p className="text-kr-pretty mt-1 text-[14px] text-muted-foreground">
                기업 디렉토리에서 불러온 최신 기업입니다.
              </p>
            </div>
            <Link
              href="/companies"
              className="text-kr-keep hidden shrink-0 text-[14px] font-bold text-primary hover:underline sm:inline-flex"
            >
              전체 보기 →
            </Link>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {recentCompanies.map((company) => (
              <Card
                key={company.id}
                className="group border-border bg-card shadow-ct-soft transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-ct-card"
              >
                <CardContent className="flex h-full flex-col p-5">
                  <div className="flex items-start gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent text-accent-foreground">
                      <Building2 className="h-5 w-5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-kr-pretty truncate text-[17px] font-bold text-foreground">
                        {company.name}
                      </h3>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        <Badge variant="slate" size="sm" className="text-kr-keep">
                          {company.industry}
                        </Badge>
                        <Badge variant="slate" size="sm" className="text-kr-keep">
                          {company.region}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <p className="text-kr-pretty mt-4 line-clamp-2 flex-1 text-[14px] leading-6 text-muted-foreground">
                    {company.description}
                  </p>
                  <Link
                    href={`/factories/${company.id}`}
                    className="text-kr-keep mt-4 inline-flex items-center gap-1 text-[14px] font-bold text-primary transition group-hover:gap-2"
                  >
                    기업 상세 보기 <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}
