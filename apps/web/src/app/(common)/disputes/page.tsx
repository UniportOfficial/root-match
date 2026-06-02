'use client'

import { useMemo, useState, type ReactNode } from 'react'
import Link from 'next/link'
import {
  AlertTriangle,
  ArrowRight,
  CalendarClock,
  CheckCircle,
  Clock,
  FileText,
  Handshake,
  MessageSquareText,
  Plus,
  ShieldCheck,
} from 'lucide-react'
import type { DisputeStatus } from '@rootmatching/shared'
import { AppBadge } from '@/components/ui/AppBadge'
import { disputeCases, disputeStatusStyles } from '@/data/disputeData'
import { cn } from '@/lib/cn'

type StatusFilter = DisputeStatus | 'all'

const statusFilters: Array<{ value: StatusFilter; label: string }> = [
  { value: 'all', label: '전체' },
  { value: 'reviewing', label: '자료 검토 중' },
  { value: 'proposal', label: '조정안 제시' },
  { value: 'waiting', label: '상대방 답변 대기' },
  { value: 'resolved', label: '합의 완료' },
]

export default function DisputeListPage() {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const activeCases = useMemo(() => disputeCases.filter((item) => item.status !== 'resolved'), [])
  const resolvedCases = useMemo(() => disputeCases.filter((item) => item.status === 'resolved'), [])
  const filteredCases = useMemo(
    () => disputeCases.filter((item) => statusFilter === 'all' || item.status === statusFilter),
    [statusFilter],
  )

  return (
    <div className="min-h-screen bg-surface-muted px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <header className="mb-8 overflow-hidden rounded-2xl border border-brand-light bg-white shadow-sm">
          <div className="grid gap-6 p-6 sm:p-8 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <AppBadge variant="blue" className="mb-4 px-4 py-2 text-sm font-semibold">
                <ShieldCheck className="h-4 w-4" />
                분쟁 중재 센터
              </AppBadge>
              <h1 className="text-3xl font-bold tracking-normal text-ink-950 sm:text-4xl">
                진행 중인 분쟁 중재
              </h1>
              <p className="mt-3 max-w-3xl text-lg leading-8 text-ink-700">
                접수된 분쟁의 검토 상태, 다음 조치, 조정 진행률을 한 곳에서 확인합니다.
              </p>
            </div>

            <Link
              href="/disputes"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand px-5 py-3 text-base font-bold text-white shadow-sm transition hover:bg-brand-hover"
            >
              <Plus className="h-5 w-5" />
              중재 요청하기
            </Link>
          </div>
        </header>

        <section className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-4">
          <SummaryCard
            icon={<AlertTriangle className="h-6 w-6 text-brand" />}
            label="진행 중"
            value={activeCases.length}
          />
          <SummaryCard
            icon={<Handshake className="h-6 w-6 text-amber-600" />}
            label="조정안 단계"
            value={disputeCases.filter((item) => item.status === 'proposal').length}
          />
          <SummaryCard
            icon={<Clock className="h-6 w-6 text-violet-600" />}
            label="답변 대기"
            value={disputeCases.filter((item) => item.status === 'waiting').length}
          />
          <SummaryCard
            icon={<CheckCircle className="h-6 w-6 text-emerald-600" />}
            label="완료"
            value={resolvedCases.length}
          />
        </section>

        <section className="mb-6 rounded-2xl border border-border bg-white p-4 shadow-sm">
          <div className="flex flex-wrap gap-2">
            {statusFilters.map((filter) => (
              <button
                key={filter.value}
                type="button"
                onClick={() => setStatusFilter(filter.value)}
                className={cn(
                  'rounded-full border px-4 py-2 text-sm font-bold transition',
                  statusFilter === filter.value
                    ? 'border-brand bg-brand text-white shadow-sm'
                    : 'border-border bg-surface-muted text-ink-700 hover:border-brand-light hover:bg-brand-light hover:text-brand',
                )}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </section>

        <section className="space-y-4">
          {filteredCases.map((item) => (
            <article
              key={item.id}
              className="rounded-2xl border border-border bg-white p-5 shadow-sm transition hover:border-brand-light hover:shadow-md sm:p-6"
            >
              <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-bold text-ink-400">{item.id}</span>
                    <span
                      className={cn(
                        'rounded-full px-3 py-1 text-xs font-bold ring-1',
                        disputeStatusStyles[item.status],
                      )}
                    >
                      {item.statusLabel}
                    </span>
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-ink-700">
                      {item.type}
                    </span>
                  </div>

                  <h2 className="mt-3 text-xl font-bold text-ink-950">{item.projectName}</h2>
                  <p className="mt-2 text-base text-ink-700">
                    {item.counterparty} · {item.amount}
                  </p>

                  <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-3">
                    <InfoTile
                      icon={<CalendarClock className="mt-0.5 h-5 w-5 shrink-0 text-ink-400" />}
                      label="접수일"
                      value={item.requestedAt}
                    />
                    <InfoTile
                      icon={<MessageSquareText className="mt-0.5 h-5 w-5 shrink-0 text-ink-400" />}
                      label="담당"
                      value={item.mediator}
                    />
                    <InfoTile
                      icon={<FileText className="mt-0.5 h-5 w-5 shrink-0 text-ink-400" />}
                      label="다음 조치"
                      value={item.nextAction}
                    />
                  </div>

                  <div className="mt-5">
                    <div className="mb-2 flex items-center justify-between text-sm">
                      <span className="font-semibold text-ink-700">진행률</span>
                      <span className="font-bold text-ink-950">{item.progress}%</span>
                    </div>
                    <div className="h-2 rounded-full bg-surface-muted">
                      <div
                        className="h-2 rounded-full bg-brand"
                        style={{ width: `${item.progress}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div className="flex min-w-[180px] flex-col gap-3 lg:items-end">
                  <span className="text-sm font-semibold text-ink-400">최근 업데이트</span>
                  <span className="text-base font-bold text-ink-950">{item.updatedAt}</span>
                  <Link
                    href={`/disputes/${item.id}`}
                    className="mt-2 inline-flex items-center justify-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-bold text-ink-700 transition hover:border-brand-light hover:bg-brand-light/40 hover:text-brand"
                  >
                    상세 보기
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </section>
      </div>
    </div>
  )
}

function SummaryCard({ icon, label, value }: { icon: ReactNode; label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-border bg-white p-5 shadow-sm">
      <div className="flex items-center gap-3">
        {icon}
        <span className="text-sm font-semibold text-ink-400">{label}</span>
      </div>
      <p className="mt-3 text-3xl font-bold text-ink-950">{value}</p>
    </div>
  )
}

function InfoTile({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3 rounded-xl bg-surface-muted p-4">
      {icon}
      <div>
        <p className="text-xs font-semibold text-ink-400">{label}</p>
        <p className="mt-1 text-sm font-bold text-ink-950">{value}</p>
      </div>
    </div>
  )
}
