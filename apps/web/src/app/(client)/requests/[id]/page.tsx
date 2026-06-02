'use client'

import type { ReactNode } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Clock,
  FileText,
  MapPin,
  Package,
  Sparkles,
  Wallet,
} from 'lucide-react'
import type { FactoryRecommendation, ReceivedQuoteRequestStatus } from '@rootmatching/shared'
import { AppBadge } from '@/components/ui/AppBadge'
import { mockReceivedQuoteRequests } from '@/data/requestData'
import { cn } from '@/lib/cn'

const matchedFactoryRecommendations: FactoryRecommendation[] = [
  {
    id: 'factory-001',
    name: '문래정밀가공',
    location: '서울 영등포구 문래동',
    processes: ['CNC 정밀가공', '표면처리'],
    trustScore: 94,
    deliveryRate: 96,
    reorderRate: 82,
    estimateMin: 3200,
    estimateMax: 4100,
    aiReason: '알루미늄 정밀가공과 아노다이징 협력망이 강해 외관 품질 기준을 맞추기 좋습니다.',
    qualityScore: 93,
    deliveryScore: 96,
    priceCompetitiveness: 88,
  },
  {
    id: 'factory-002',
    name: '서울메탈웍스',
    location: '경기 시흥시 정왕동',
    processes: ['소성가공', '용접', '표면처리'],
    trustScore: 89,
    deliveryRate: 91,
    reorderRate: 76,
    estimateMin: 3400,
    estimateMax: 4300,
    aiReason: '중소량 양산 전환 경험이 많고 검사 성적서 대응 속도가 안정적입니다.',
    qualityScore: 88,
    deliveryScore: 91,
    priceCompetitiveness: 86,
  },
  {
    id: 'factory-003',
    name: '미래정밀',
    location: '인천 남동구 고잔동',
    processes: ['CNC 정밀가공', '금형'],
    trustScore: 87,
    deliveryRate: 90,
    reorderRate: 73,
    estimateMin: 3000,
    estimateMax: 4450,
    aiReason: '초도품 대응 단가가 경쟁력 있고 3D 모델 기반 가공 검토가 빠릅니다.',
    qualityScore: 86,
    deliveryScore: 90,
    priceCompetitiveness: 91,
  },
]

function getStatusLabel(status: ReceivedQuoteRequestStatus): string {
  if (status === 'new') return '공장 검토 대기'
  if (status === 'reviewing') return '공장 검토 중'
  return '견적 도착'
}

function getStatusVariant(status: ReceivedQuoteRequestStatus): 'blue' | 'green' | 'amber' {
  if (status === 'new') return 'blue'
  if (status === 'reviewing') return 'amber'
  return 'green'
}

function formatPrice(value: number): string {
  return `${value}만원`
}

export default function ClientRequestDetailPage() {
  const params = useParams<{ id: string }>()
  const request = mockReceivedQuoteRequests.find((item) => item.id === params.id)

  if (!request) {
    return (
      <div className="min-h-screen bg-surface-muted px-4 py-8 sm:px-6 lg:px-8">
        <main className="mx-auto max-w-6xl">
          <section className="rounded-2xl border border-border bg-white p-12 text-center shadow-sm">
            <FileText className="mx-auto h-12 w-12 text-ink-400" />
            <h1 className="mt-4 text-2xl font-bold text-ink-950">견적 요청을 찾을 수 없습니다.</h1>
            <Link
              href="/requests"
              className="mt-6 inline-flex items-center justify-center gap-2 rounded-xl bg-brand px-5 py-3 text-sm font-bold text-white transition hover:bg-brand-hover"
            >
              목록으로 돌아가기
              <ArrowRight className="h-4 w-4" />
            </Link>
          </section>
        </main>
      </div>
    )
  }

  const matchedFactories =
    request.status === 'quoted' ? matchedFactoryRecommendations.slice(0, 3) : []

  return (
    <div className="min-h-screen bg-surface-muted px-4 py-8 sm:px-6 lg:px-8">
      <main className="mx-auto max-w-6xl">
        <Link
          href="/requests"
          className="mb-5 inline-flex items-center gap-2 text-sm font-bold text-ink-700 transition hover:text-brand"
        >
          <ArrowLeft className="h-4 w-4" />
          견적 요청 내역
        </Link>

        <section className="space-y-6">
          <header className="rounded-2xl border border-border bg-white p-6 shadow-sm sm:p-8">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <div className="mb-4 flex flex-wrap items-center gap-2">
                  <AppBadge variant={getStatusVariant(request.status)}>
                    {getStatusLabel(request.status)}
                  </AppBadge>
                  <span className="text-sm font-semibold text-ink-400">{request.id}</span>
                </div>
                <h1 className="text-3xl font-bold tracking-normal text-ink-950 sm:text-4xl">
                  {request.projectName}
                </h1>
                <p className="mt-3 max-w-3xl text-base leading-7 text-ink-700">
                  {request.description}
                </p>
              </div>

              <Link
                href="/request"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-border px-5 py-3 text-sm font-bold text-ink-700 transition hover:border-brand-light hover:bg-brand-light/40 hover:text-brand"
              >
                요청 수정
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </header>

          <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            <MetricCard
              icon={<Package className="h-5 w-5" />}
              tone="blue"
              label="품목 / 공정"
              title={request.productItem}
              subtitle={request.processType}
            />
            <MetricCard
              icon={<CheckCircle2 className="h-5 w-5" />}
              tone="green"
              label="예상 수량"
              title={request.quantity}
            />
            <MetricCard
              icon={<Wallet className="h-5 w-5" />}
              tone="amber"
              label="예산 범위"
              title={request.budgetRange}
            />
            <MetricCard
              icon={<CalendarDays className="h-5 w-5" />}
              tone="violet"
              label="희망 납기"
              title={request.desiredDeadline}
            />
          </section>

          <section className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_360px]">
            <div className="rounded-2xl border border-border bg-white p-6 shadow-sm">
              <h2 className="text-xl font-bold text-ink-950">요청 상세 정보</h2>
              <dl className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <dt className="text-sm font-semibold text-ink-400">요청 기업</dt>
                  <dd className="mt-1 font-bold text-ink-950">{request.clientName}</dd>
                </div>
                <div>
                  <dt className="text-sm font-semibold text-ink-400">요청일</dt>
                  <dd className="mt-1 font-bold text-ink-950">{request.requestedAt}</dd>
                </div>
                <div className="sm:col-span-2">
                  <dt className="text-sm font-semibold text-ink-400">첨부 자료</dt>
                  <dd className="mt-3 space-y-2">
                    {request.attachments.map((attachment) => (
                      <a
                        key={attachment.id}
                        href={attachment.url}
                        className="flex items-center justify-between rounded-xl border border-border px-4 py-3 text-sm font-semibold text-ink-700 transition hover:border-brand-light hover:bg-brand-light/40 hover:text-brand"
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
            </div>

            <aside className="rounded-2xl border border-border bg-white p-6 shadow-sm">
              <h2 className="text-xl font-bold text-ink-950">진행 상태</h2>
              <ol className="mt-5 space-y-4">
                <ProgressItem
                  icon={<CheckCircle2 className="mt-0.5 h-5 w-5 text-emerald-600" />}
                  title="요청 등록 완료"
                  description="등록 조건과 첨부 자료가 저장되었습니다."
                />
                <ProgressItem
                  icon={
                    <Clock
                      className={cn(
                        'mt-0.5 h-5 w-5',
                        request.status === 'new' ? 'text-ink-400' : 'text-warning',
                      )}
                    />
                  }
                  title="공장 검토"
                  description="조건에 맞는 공장이 요청서를 확인합니다."
                />
                <ProgressItem
                  icon={
                    <Sparkles
                      className={cn(
                        'mt-0.5 h-5 w-5',
                        request.status === 'quoted' ? 'text-brand' : 'text-ink-400',
                      )}
                    />
                  }
                  title="견적 결과 확인"
                  description="도착한 견적과 공장 정보를 이 화면에서 확인합니다."
                />
              </ol>
            </aside>
          </section>

          <section className="rounded-2xl border border-border bg-white p-6 shadow-sm">
            <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="text-xl font-bold text-ink-950">매칭 결과 정보</h2>
                <p className="mt-1 text-sm text-ink-400">
                  이 견적 요청에 연결된 공장 견적과 핵심 지표입니다.
                </p>
              </div>
              <AppBadge variant={request.status === 'quoted' ? 'green' : 'slate'}>
                {request.status === 'quoted'
                  ? `${matchedFactories.length}개 견적 도착`
                  : '견적 대기'}
              </AppBadge>
            </div>

            {matchedFactories.length > 0 ? (
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                {matchedFactories.map((factory) => (
                  <article
                    key={factory.id}
                    className="rounded-2xl border border-border p-5 transition hover:border-brand-light hover:shadow-sm"
                  >
                    <div className="mb-4 flex items-start justify-between gap-3">
                      <div>
                        <h3 className="text-lg font-bold text-ink-950">{factory.name}</h3>
                        <p className="mt-1 flex items-center gap-1.5 text-sm text-ink-400">
                          <MapPin className="h-4 w-4" />
                          {factory.location}
                        </p>
                      </div>
                      <span className="rounded-full bg-brand-light px-3 py-1 text-xs font-bold text-brand">
                        신뢰 {factory.trustScore}점
                      </span>
                    </div>

                    <dl className="grid grid-cols-2 gap-3 text-sm">
                      <div className="rounded-xl bg-surface-muted p-3">
                        <dt className="font-semibold text-ink-400">예상 견적</dt>
                        <dd className="mt-1 font-bold text-ink-950">
                          {formatPrice(factory.estimateMin)} ~ {formatPrice(factory.estimateMax)}
                        </dd>
                      </div>
                      <div className="rounded-xl bg-surface-muted p-3">
                        <dt className="font-semibold text-ink-400">납기 준수</dt>
                        <dd className="mt-1 font-bold text-ink-950">{factory.deliveryRate}%</dd>
                      </div>
                    </dl>

                    <p className="mt-4 rounded-xl bg-brand-light p-3 text-sm leading-6 text-blue-800">
                      {factory.aiReason}
                    </p>

                    <Link
                      href={`/factories/${factory.id}`}
                      className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-border px-4 py-2.5 text-sm font-bold text-ink-700 transition hover:border-brand-light hover:bg-brand-light/40 hover:text-brand"
                    >
                      공장 상세 보기
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </article>
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-border bg-surface-muted p-8 text-center">
                <Sparkles className="mx-auto h-10 w-10 text-ink-400" />
                <p className="mt-3 font-bold text-ink-700">아직 도착한 견적이 없습니다.</p>
                <p className="mt-1 text-sm text-ink-400">
                  공장 검토가 끝나면 이 영역에 매칭 결과가 표시됩니다.
                </p>
              </div>
            )}
          </section>
        </section>
      </main>
    </div>
  )
}

function MetricCard({
  icon,
  tone,
  label,
  title,
  subtitle,
}: {
  icon: ReactNode
  tone: 'blue' | 'green' | 'amber' | 'violet'
  label: string
  title: string
  subtitle?: string
}) {
  const toneClassName = {
    blue: 'bg-brand-light text-brand',
    green: 'bg-emerald-50 text-emerald-600',
    amber: 'bg-amber-50 text-warning',
    violet: 'bg-violet-50 text-violet-600',
  }[tone]

  return (
    <div className="rounded-2xl border border-border bg-white p-5 shadow-sm">
      <div
        className={cn('mb-3 flex h-10 w-10 items-center justify-center rounded-xl', toneClassName)}
      >
        {icon}
      </div>
      <p className="text-sm font-semibold text-ink-400">{label}</p>
      <p className="mt-2 font-bold text-ink-950">{title}</p>
      {subtitle && <p className="mt-1 text-sm text-ink-400">{subtitle}</p>}
    </div>
  )
}

function ProgressItem({
  icon,
  title,
  description,
}: {
  icon: ReactNode
  title: string
  description: string
}) {
  return (
    <li className="flex gap-3">
      {icon}
      <div>
        <p className="font-bold text-ink-950">{title}</p>
        <p className="text-sm text-ink-400">{description}</p>
      </div>
    </li>
  )
}
