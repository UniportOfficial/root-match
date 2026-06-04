'use client'

import { useEffect, useMemo, useState, type ReactNode } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Check,
  ChevronDown,
  ChevronUp,
  Clock,
  MapPin,
  RefreshCw,
  Settings,
  Shield,
  Sparkles,
  TrendingUp,
  Trophy,
  UsersRound,
  Wallet,
  Zap,
} from 'lucide-react'
import type { FactoryRecommendation, QuoteRequestDraft } from '@rootmatching/shared'
import { mockFactoryRecommendations } from '@rootmatching/shared/fixtures/factory-data'
import { AppBadge } from '@/components/ui/AppBadge'
import { AppButton } from '@/components/ui/AppButton'
import { cn } from '@/lib/cn'
import { useDemoMode } from '@/lib/demo-mode'

const MATCHING_RESULTS_KEY = 'rm:matchingResults'
const SELECTED_FACTORY_KEY = 'rm:selectedFactory'
const STALE_AFTER_MS = 60 * 60 * 1000

const PROCESS_OPTIONS = [
  '전체',
  'CNC 절삭',
  '금형',
  '소성가공',
  '용접',
  '표면처리',
  '주조',
  '열처리',
]
const REGION_OPTIONS = ['전체', '서울', '경기', '인천']
const TRUST_SCORE_OPTIONS = ['전체', '90점 이상', '85점 이상', '80점 이상']

interface MatchingResultsPayload {
  results: DemoFactoryRecommendation[]
  request: QuoteRequestDraft
  submittedAt: number
}

type DemoFactoryRecommendation = FactoryRecommendation & {
  matchScore?: number
  reorderCustomerCount?: number
  distanceKm?: number
  employeeCount?: number
  industrialComplex?: string
  aiReasonBullets?: string[]
}

type LoadState = 'loading' | 'ready' | 'empty'

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === 'string')
}

function isFactoryRecommendation(value: unknown): value is FactoryRecommendation {
  if (!isRecord(value)) return false

  return (
    typeof value.id === 'string' &&
    typeof value.name === 'string' &&
    typeof value.location === 'string' &&
    isStringArray(value.processes) &&
    typeof value.trustScore === 'number' &&
    typeof value.deliveryRate === 'number' &&
    typeof value.reorderRate === 'number' &&
    typeof value.estimateMin === 'number' &&
    typeof value.estimateMax === 'number' &&
    typeof value.aiReason === 'string' &&
    typeof value.qualityScore === 'number' &&
    typeof value.deliveryScore === 'number' &&
    typeof value.priceCompetitiveness === 'number'
  )
}

function isQuoteRequestDraft(value: unknown): value is QuoteRequestDraft {
  if (!isRecord(value)) return false

  return (
    typeof value.projectName === 'string' &&
    typeof value.processType === 'string' &&
    typeof value.productItem === 'string' &&
    typeof value.estimatedQuantity === 'string' &&
    typeof value.desiredDeadline === 'string' &&
    typeof value.budgetRange === 'string' &&
    typeof value.detailRequirements === 'string'
  )
}

function isMatchingResultsPayload(value: unknown): value is MatchingResultsPayload {
  if (!isRecord(value)) return false

  return (
    Array.isArray(value.results) &&
    value.results.every(isFactoryRecommendation) &&
    isQuoteRequestDraft(value.request) &&
    typeof value.submittedAt === 'number'
  )
}

function formatPrice(value: number): string {
  return `${value}만원`
}

function getMatchScore(factory: DemoFactoryRecommendation): number {
  return (
    factory.matchScore ??
    Math.round(
      factory.trustScore * 0.3 +
        factory.deliveryScore * 0.25 +
        factory.qualityScore * 0.25 +
        factory.priceCompetitiveness * 0.2,
    )
  )
}

function getDeliveryTone(rate: number): {
  text: string
  bg: string
  badge: 'green' | 'amber' | 'red'
} {
  if (rate >= 90) return { text: 'text-success', bg: 'bg-success', badge: 'green' }
  if (rate >= 70) return { text: 'text-warning-text', bg: 'bg-warning', badge: 'amber' }
  return { text: 'text-danger', bg: 'bg-danger', badge: 'red' }
}

function getTrustScoreVariant(score: number): 'green' | 'blue' | 'amber' {
  if (score >= 90) return 'green'
  if (score >= 80) return 'blue'
  return 'amber'
}

function getTrustScoreTextClass(score: number): string {
  if (score >= 90) return 'text-success'
  if (score >= 80) return 'text-brand'
  return 'text-warning'
}

function getTrustScoreBorderClass(score: number): string {
  if (score >= 90) return 'border-emerald-200'
  if (score >= 80) return 'border-brand-light'
  return 'border-amber-200'
}

function parseMinimumTrustScore(option: string): number | null {
  if (option === '전체') return null

  const parsed = Number.parseInt(option, 10)
  return Number.isNaN(parsed) ? null : parsed
}

function ProgressMetric({
  icon,
  label,
  value,
  barClassName,
}: {
  icon: ReactNode
  label: string
  value: number
  barClassName: string
}) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {icon}
          <span className="text-sm font-medium text-ink-700">{label}</span>
        </div>
        <span className="text-sm font-semibold text-ink-950">{value}점</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-surface-muted">
        <div
          className={cn('h-full rounded-full transition-all duration-500', barClassName)}
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  )
}

function FilterSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string
  value: string
  options: string[]
  onChange: (value: string) => void
}) {
  return (
    <label className="relative min-w-[160px] flex-1 sm:flex-none">
      <span className="mb-1 block text-xs font-medium text-ink-400">{label}</span>
      <span className="relative block">
        <select
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="h-11 w-full appearance-none rounded-xl border border-border bg-surface-muted px-3 pr-9 text-sm text-ink-700 outline-none transition focus:border-brand focus:ring-4 focus:ring-brand-light"
        >
          {options.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
      </span>
    </label>
  )
}

export default function MatchingResultPage() {
  const router = useRouter()
  const isDemoMode = useDemoMode()
  const [loadState, setLoadState] = useState<LoadState>('loading')
  const [factories, setFactories] = useState<DemoFactoryRecommendation[]>([])
  const [request, setRequest] = useState<QuoteRequestDraft | null>(null)
  const [selectedFactory, setSelectedFactory] = useState<DemoFactoryRecommendation | null>(null)
  const [expandedFactoryId, setExpandedFactoryId] = useState<string | null>('1')
  const [processFilter, setProcessFilter] = useState('전체')
  const [regionFilter, setRegionFilter] = useState('전체')
  const [trustScoreFilter, setTrustScoreFilter] = useState('전체')
  const [deliveryFilter, setDeliveryFilter] = useState(false)

  useEffect(() => {
    function showDemoFactories() {
      setFactories(mockFactoryRecommendations as DemoFactoryRecommendation[])
      setRequest({
        projectName: '알루미늄 하우징 시제품',
        processType: 'CNC 절삭 + 표면처리',
        productItem: '알루미늄 하우징 시제품',
        estimatedQuantity: '초도 5,000개',
        desiredDeadline: '2026년 4월말',
        budgetRange: '400만원 ~ 500만원',
        detailRequirements: 'RoHS 준수, 표면 거칠기 Ra 0.8 이하, 안정적 납기 보증 우선',
      })
      setSelectedFactory((mockFactoryRecommendations as DemoFactoryRecommendation[])[0] ?? null)
      setLoadState('ready')
    }

    if (isDemoMode) {
      showDemoFactories()
      return
    }

    const storedValue = window.sessionStorage.getItem(MATCHING_RESULTS_KEY)

    if (!storedValue) {
      setLoadState('empty')
      return
    }

    try {
      const parsedValue: unknown = JSON.parse(storedValue)

      if (!isMatchingResultsPayload(parsedValue)) {
        setLoadState('empty')
        return
      }

      if (Date.now() - parsedValue.submittedAt > STALE_AFTER_MS) {
        setLoadState('empty')
        return
      }

      setFactories(parsedValue.results)
      setRequest(parsedValue.request)
      setSelectedFactory(parsedValue.results[0] ?? null)
      setLoadState('ready')
    } catch {
      setLoadState('empty')
    }
  }, [isDemoMode])

  const filteredFactories = useMemo(() => {
    const minimumTrustScore = parseMinimumTrustScore(trustScoreFilter)

    return factories.filter((factory) => {
      if (processFilter !== '전체' && !factory.processes.includes(processFilter)) return false
      if (regionFilter !== '전체' && !factory.location.includes(regionFilter)) return false
      if (minimumTrustScore !== null && factory.trustScore < minimumTrustScore) return false
      if (deliveryFilter && factory.deliveryRate < 90) return false
      return true
    })
  }, [deliveryFilter, factories, processFilter, regionFilter, trustScoreFilter])

  function goToDetail(id: string) {
    router.push(`/factories/${id}`)
  }

  function requestQuote(factory?: DemoFactoryRecommendation) {
    const factoryToStore = factory ?? selectedFactory ?? filteredFactories[0]

    if (factoryToStore) {
      setSelectedFactory(factoryToStore)
      window.sessionStorage.setItem(SELECTED_FACTORY_KEY, JSON.stringify(factoryToStore))
    }

    router.push('/contract')
  }

  function showExampleRecommendations() {
    setFactories(mockFactoryRecommendations as DemoFactoryRecommendation[])
    setSelectedFactory((mockFactoryRecommendations as DemoFactoryRecommendation[])[0] ?? null)
    setRequest({
      projectName: '알루미늄 하우징 시제품',
      processType: 'CNC 절삭 + 표면처리',
      productItem: '알루미늄 하우징 시제품',
      estimatedQuantity: '초도 5,000개',
      desiredDeadline: '2026년 4월말',
      budgetRange: '400만원 ~ 500만원',
      detailRequirements: 'RoHS 준수, 표면 거칠기 Ra 0.8 이하, 안정적 납기 보증 우선',
    })
    setLoadState('ready')
  }

  const averageMatchScore = useMemo(() => {
    if (factories.length === 0) return 0
    return factories.reduce((sum, factory) => sum + getMatchScore(factory), 0) / factories.length
  }, [factories])

  if (loadState === 'loading') {
    return (
      <div className="min-h-screen bg-surface-muted px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto flex min-h-[60vh] max-w-7xl flex-col items-center justify-center gap-6">
          <div className="h-16 w-16 animate-spin rounded-full border-4 border-brand-light border-t-brand" />
          <div className="text-center">
            <h2 className="text-xl font-bold text-ink-950">AI가 최적 공장을 분석 중입니다</h2>
            <p className="mt-2 text-ink-400">공정·납기·품질·가격을 종합적으로 검토하고 있어요</p>
          </div>
        </div>
      </div>
    )
  }

  if (loadState === 'empty') {
    return (
      <div className="min-h-screen bg-surface-muted px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto flex min-h-[60vh] max-w-3xl items-center justify-center">
          <section className="w-full rounded-2xl border border-border bg-white p-8 text-center shadow-sm sm:p-10">
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-brand-light">
              <Settings className="h-8 w-8 text-brand" />
            </div>
            <h1 className="text-2xl font-bold text-ink-950">최근 매칭 결과가 없습니다</h1>
            <p className="mt-3 text-base leading-7 text-ink-700">
              저장된 추천 결과가 없거나 1시간이 지나 만료되었습니다.
            </p>
            <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
              <AppButton
                type="button"
                variant="primary"
                size="lg"
                onClick={showExampleRecommendations}
              >
                <Sparkles className="h-5 w-5" />
                예시 추천 보기
              </AppButton>
              <Link
                href="/request?demo=true"
                className="inline-flex min-h-tap-primary items-center justify-center rounded-xl border border-border bg-white px-5 py-3 text-sm font-bold text-ink-700 transition hover:border-brand-light hover:bg-surface-muted hover:text-brand"
              >
                견적 요청부터 시작
              </Link>
            </div>
          </section>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-surface-muted px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <header className="mb-8 rounded-2xl border border-border bg-white p-6 shadow-sm sm:p-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <AppBadge variant="blue">
                <Sparkles className="h-4 w-4" />
                AI 추천 공장
              </AppBadge>
              <h1 className="mt-4 text-3xl font-bold tracking-normal text-ink-950 sm:text-4xl">
                AI 매칭 추천 Top {Math.min(filteredFactories.length, 5)}
              </h1>
              <p className="mt-3 max-w-3xl text-lg leading-8 text-ink-700">
                총 {factories.length}개 공장 매칭 · 평균 매칭 점수 {averageMatchScore.toFixed(1)} ·
                추천 Top {Math.min(filteredFactories.length, 5)}
              </p>
            </div>

            {request && (
              <dl className="grid min-w-full grid-cols-1 gap-3 rounded-2xl bg-surface-muted p-4 sm:grid-cols-3 lg:min-w-[520px]">
                <div>
                  <dt className="text-xs font-semibold text-ink-400">프로젝트</dt>
                  <dd className="mt-1 truncate text-sm font-bold text-ink-950">
                    {request.projectName}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold text-ink-400">품목 / 공정</dt>
                  <dd className="mt-1 truncate text-sm font-bold text-ink-950">
                    {request.productItem} · {request.processType}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold text-ink-400">희망 납기</dt>
                  <dd className="mt-1 truncate text-sm font-bold text-ink-950">
                    {request.desiredDeadline}
                  </dd>
                </div>
              </dl>
            )}
          </div>
        </header>

        <section className="mb-6 rounded-2xl border border-border bg-white p-4 shadow-sm">
          <div className="flex flex-wrap gap-4">
            <FilterSelect
              label="공정"
              value={processFilter}
              options={PROCESS_OPTIONS}
              onChange={setProcessFilter}
            />
            <FilterSelect
              label="지역"
              value={regionFilter}
              options={REGION_OPTIONS}
              onChange={setRegionFilter}
            />
            <FilterSelect
              label="신뢰 점수"
              value={trustScoreFilter}
              options={TRUST_SCORE_OPTIONS}
              onChange={setTrustScoreFilter}
            />

            <div className="flex items-end">
              <label className="flex h-11 cursor-pointer items-center gap-2 rounded-xl border border-border bg-surface-muted px-4 transition hover:border-brand-light hover:bg-brand-light/40">
                <input
                  type="checkbox"
                  checked={deliveryFilter}
                  onChange={(event) => setDeliveryFilter(event.target.checked)}
                  className="h-4 w-4 rounded border-border text-brand focus:ring-brand-light"
                />
                <span className="text-sm text-ink-700">납기 가능</span>
              </label>
            </div>
          </div>
        </section>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
          <main className="grid grid-cols-1 gap-5 lg:grid-cols-2 2xl:grid-cols-3">
            {filteredFactories.map((factory) => {
              const isSelected = selectedFactory?.id === factory.id
              const matchScore = getMatchScore(factory)
              const deliveryTone = getDeliveryTone(factory.deliveryRate)
              const isExpanded = expandedFactoryId === factory.id
              const reasons = factory.aiReasonBullets ?? [factory.aiReason]

              return (
                <article
                  key={factory.id}
                  onClick={() => setSelectedFactory(factory)}
                  className={cn(
                    'cursor-pointer rounded-2xl border bg-white p-5 shadow-toss-sm transition hover:border-brand-light hover:shadow-toss-md sm:p-6',
                    isSelected ? 'border-brand shadow-md ring-4 ring-brand-light' : 'border-border',
                  )}
                >
                  <div className="mb-4 flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                    <div>
                      <div className="mb-2 flex flex-wrap items-center gap-3">
                        <h2 className="text-lg font-bold text-ink-950">{factory.name}</h2>
                        <AppBadge
                          variant={getTrustScoreVariant(factory.trustScore)}
                          className={cn(
                            'border',
                            getTrustScoreBorderClass(factory.trustScore),
                            getTrustScoreTextClass(factory.trustScore),
                          )}
                        >
                          <Trophy className="h-4 w-4" />
                          신뢰 {factory.trustScore}
                        </AppBadge>
                      </div>
                      <p className="flex items-center gap-1.5 text-sm text-ink-400">
                        <MapPin className="h-4 w-4" />
                        {factory.location}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {factory.processes.map((process) => (
                        <AppBadge key={process} variant="slate">
                          {process}
                        </AppBadge>
                      ))}
                    </div>
                  </div>

                  <div className="mb-4 rounded-2xl border border-brand-light bg-brand-light/40 p-4">
                    <div className="mb-2 flex items-end justify-between">
                      <span className="text-sm font-bold text-brand">AI 매칭 점수</span>
                      <span className="text-3xl font-black tabular-nums text-ink-950">
                        {matchScore}
                      </span>
                    </div>
                    <div className="h-3 overflow-hidden rounded-pill bg-white ring-1 ring-brand-light">
                      <div
                        className="h-full rounded-pill bg-brand transition-all duration-700"
                        style={{ width: `${matchScore}%` }}
                      />
                    </div>
                  </div>

                  <dl className="mb-4 grid grid-cols-2 gap-3">
                    <div className="flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-success-bg">
                        <Clock className={cn('h-4 w-4', deliveryTone.text)} />
                      </div>
                      <div>
                        <dt className="text-xs text-ink-400">납기 준수율</dt>
                        <dd className={cn('text-sm font-black', deliveryTone.text)}>
                          {factory.deliveryRate}%
                        </dd>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-brand-light">
                        <RefreshCw className="h-4 w-4 text-brand" />
                      </div>
                      <div>
                        <dt className="text-xs text-ink-400">재거래율</dt>
                        <dd className="text-sm font-semibold text-ink-950">
                          {factory.reorderRate}% · {factory.reorderCustomerCount ?? '-'}곳
                        </dd>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-surface-muted">
                        <MapPin className="h-4 w-4 text-ink-700" />
                      </div>
                      <div>
                        <dt className="text-xs text-ink-400">거리</dt>
                        <dd className="text-sm font-semibold text-ink-950">
                          {factory.distanceKm ?? '-'}km
                        </dd>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-surface-muted">
                        <UsersRound className="h-4 w-4 text-ink-700" />
                      </div>
                      <div>
                        <dt className="text-xs text-ink-400">규모</dt>
                        <dd className="text-sm font-semibold text-ink-950">
                          {factory.employeeCount ?? '-'}명
                        </dd>
                      </div>
                    </div>
                    <div className="col-span-2 flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-50">
                        <Wallet className="h-4 w-4 text-warning" />
                      </div>
                      <div>
                        <dt className="text-xs text-ink-400">예상 견적</dt>
                        <dd className="text-sm font-semibold text-ink-950">
                          {formatPrice(factory.estimateMin)} ~ {formatPrice(factory.estimateMax)}
                        </dd>
                      </div>
                    </div>
                  </dl>

                  <div className="mb-4 flex items-start gap-2 rounded-xl bg-brand-light p-3">
                    <Sparkles className="mt-0.5 h-4 w-4 flex-shrink-0 text-brand" />
                    <p className="text-sm leading-6 text-brand">{factory.aiReason}</p>
                  </div>

                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation()
                      setExpandedFactoryId(isExpanded ? null : factory.id)
                    }}
                    className="mb-4 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-brand-light bg-white px-4 py-3 text-sm font-bold text-brand transition hover:bg-brand-light"
                  >
                    AI 추천 이유 {isExpanded ? '접기' : '자세히 보기'}
                    {isExpanded ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </button>

                  {isExpanded && (
                    <ul className="mb-4 space-y-2 rounded-2xl border border-border bg-surface-muted p-4">
                      {reasons.slice(0, 5).map((reason) => (
                        <li key={reason} className="flex gap-2 text-sm leading-6 text-ink-800">
                          <Check className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
                          <span>{reason}</span>
                        </li>
                      ))}
                    </ul>
                  )}

                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation()
                        goToDetail(factory.id)
                      }}
                      className="flex-1 rounded-xl border border-border px-4 py-2.5 text-sm font-semibold text-ink-700 transition hover:border-brand-light hover:bg-surface-muted hover:text-brand"
                    >
                      상세 보기
                    </button>
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation()
                        requestQuote(factory)
                      }}
                      className="flex-1 rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand/90 focus:outline-none focus:ring-4 focus:ring-brand-light"
                    >
                      견적 요청
                    </button>
                  </div>
                </article>
              )
            })}

            {filteredFactories.length === 0 && (
              <section className="rounded-2xl border border-border bg-white p-12 text-center shadow-sm lg:col-span-2 2xl:col-span-3">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-surface-muted">
                  <Settings className="h-8 w-8 text-ink-400" />
                </div>
                <h2 className="mb-2 text-lg font-bold text-ink-950">검색 결과가 없습니다</h2>
                <p className="text-ink-400">필터 조건을 변경해 보세요.</p>
              </section>
            )}
          </main>

          <aside className="lg:sticky lg:top-8 lg:self-start">
            <section className="overflow-hidden rounded-2xl border border-border bg-white shadow-sm">
              <div className="bg-ink-950 px-5 py-4">
                <h2 className="flex items-center gap-2 font-semibold text-white">
                  <TrendingUp className="h-5 w-5" />
                  선택한 공장 비교
                </h2>
              </div>

              {selectedFactory ? (
                <div className="p-5">
                  <div className="mb-4 border-b border-border pb-4">
                    <h3 className="mb-1 font-semibold text-ink-950">{selectedFactory.name}</h3>
                    <p className="text-sm text-ink-400">{selectedFactory.location}</p>
                  </div>

                  <div className="space-y-4">
                    <ProgressMetric
                      icon={<Shield className="h-4 w-4 text-success" />}
                      label="품질 점수"
                      value={selectedFactory.qualityScore}
                      barClassName="bg-success"
                    />
                    <ProgressMetric
                      icon={<Clock className="h-4 w-4 text-brand" />}
                      label="납기 점수"
                      value={selectedFactory.deliveryScore}
                      barClassName="bg-brand"
                    />
                    <ProgressMetric
                      icon={<Zap className="h-4 w-4 text-warning" />}
                      label="가격 경쟁력"
                      value={selectedFactory.priceCompetitiveness}
                      barClassName="bg-warning"
                    />
                  </div>

                  <div className="mt-6 rounded-xl bg-surface-muted p-4">
                    <div className="mb-2 flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-brand" />
                      <span className="text-sm font-semibold text-ink-950">종합 추천 이유</span>
                    </div>
                    <p className="text-sm leading-6 text-ink-700">{selectedFactory.aiReason}</p>
                  </div>

                  <button
                    type="button"
                    onClick={() => requestQuote()}
                    className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-brand px-4 py-3 text-sm font-bold text-white transition hover:bg-brand/90 focus:outline-none focus:ring-4 focus:ring-brand-light"
                  >
                    <Check className="h-4 w-4" />
                    견적 제출하고 계약으로 이동
                  </button>
                </div>
              ) : (
                <div className="p-8 text-center">
                  <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-surface-muted">
                    <Settings className="h-6 w-6 text-ink-400" />
                  </div>
                  <p className="text-sm leading-6 text-ink-400">
                    공장을 선택하면
                    <br />
                    상세 비교 정보를 확인할 수 있습니다.
                  </p>
                </div>
              )}
            </section>
          </aside>
        </div>
      </div>
    </div>
  )
}
