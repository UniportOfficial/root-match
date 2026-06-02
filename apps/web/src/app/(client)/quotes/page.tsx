'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import {
  ArrowRight,
  Building2,
  CalendarDays,
  Factory,
  FileText,
  Package,
  Search,
  SlidersHorizontal,
  Wallet,
} from 'lucide-react'
import type { ReceivedQuoteRequestStatus } from '@rootmatching/shared'
import { AppBadge } from '@/components/ui/AppBadge'
import { mockReceivedQuoteRequests } from '@/data/requestData'

type StatusFilter = ReceivedQuoteRequestStatus | 'all'

const STATUS_OPTIONS: Array<{ value: StatusFilter; label: string }> = [
  { value: 'all', label: '전체 상태' },
  { value: 'new', label: '모집 중' },
  { value: 'reviewing', label: '검토 중' },
  { value: 'quoted', label: '견적 도착' },
]

function getStatusLabel(status: ReceivedQuoteRequestStatus): string {
  if (status === 'new') return '모집 중'
  if (status === 'reviewing') return '검토 중'
  return '견적 도착'
}

function getStatusVariant(status: ReceivedQuoteRequestStatus): 'blue' | 'green' | 'amber' {
  if (status === 'new') return 'blue'
  if (status === 'reviewing') return 'amber'
  return 'green'
}

export default function QuoteRequestBoardPage() {
  const [keyword, setKeyword] = useState('')
  const [processFilter, setProcessFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')

  const processOptions = useMemo<string[]>(() => {
    const processes = mockReceivedQuoteRequests.map((request) => request.processType)
    return ['all', ...Array.from(new Set(processes))]
  }, [])

  const filteredRequests = useMemo(() => {
    const normalizedKeyword = keyword.trim().toLowerCase()

    return mockReceivedQuoteRequests.filter((request) => {
      const searchableText = [
        request.projectName,
        request.clientName,
        request.productItem,
        request.processType,
        request.description,
      ]
        .join(' ')
        .toLowerCase()

      const matchesKeyword = !normalizedKeyword || searchableText.includes(normalizedKeyword)
      const matchesProcess = processFilter === 'all' || request.processType === processFilter
      const matchesStatus = statusFilter === 'all' || request.status === statusFilter

      return matchesKeyword && matchesProcess && matchesStatus
    })
  }, [keyword, processFilter, statusFilter])

  return (
    <div className="min-h-screen bg-surface-muted px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <header className="mb-8 rounded-2xl border border-border bg-white p-6 shadow-sm sm:p-8">
          <AppBadge variant="blue">
            <Factory className="h-4 w-4" />
            공개 견적 모집
          </AppBadge>
          <h1 className="mt-4 text-3xl font-bold tracking-normal text-ink-950 sm:text-4xl">
            견적 요청 게시판
          </h1>
          <p className="mt-3 max-w-3xl text-lg leading-8 text-ink-700">
            여러 회사가 등록한 견적 모집글을 한눈에 확인하고, 조건에 맞는 요청에 견적을 제안할 수
            있습니다.
          </p>
        </header>

        <section className="mb-6 rounded-2xl border border-border bg-white p-4 shadow-sm">
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-[1fr_240px_180px]">
            <label className="relative block">
              <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-ink-400" />
              <input
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                type="search"
                placeholder="프로젝트명, 회사명, 품목, 공정으로 검색"
                className="h-12 w-full rounded-xl border border-slate-300 pl-12 pr-4 text-base outline-none transition focus:border-brand focus:ring-4 focus:ring-brand-light"
              />
            </label>

            <label className="relative block">
              <SlidersHorizontal className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-ink-400" />
              <select
                value={processFilter}
                onChange={(e) => setProcessFilter(e.target.value)}
                className="h-12 w-full appearance-none rounded-xl border border-slate-300 bg-white pl-12 pr-4 text-base outline-none transition focus:border-brand focus:ring-4 focus:ring-brand-light"
              >
                <option value="all">전체 공정</option>
                {processOptions
                  .filter((item) => item !== 'all')
                  .map((process) => (
                    <option key={process} value={process}>
                      {process}
                    </option>
                  ))}
              </select>
            </label>

            <label className="relative block">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
                className="h-12 w-full appearance-none rounded-xl border border-slate-300 bg-white px-4 text-base outline-none transition focus:border-brand focus:ring-4 focus:ring-brand-light"
              >
                {STATUS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </section>

        <main className="grid grid-cols-1 gap-5 xl:grid-cols-2">
          {filteredRequests.map((request) => (
            <article
              key={request.id}
              className="rounded-2xl border border-border bg-white p-5 shadow-sm transition hover:border-brand-light hover:shadow-md sm:p-6"
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="mb-3 flex flex-wrap items-center gap-2">
                    <AppBadge variant={getStatusVariant(request.status)}>
                      {getStatusLabel(request.status)}
                    </AppBadge>
                    <span className="text-sm font-semibold text-ink-400">
                      {request.requestedAt}
                    </span>
                  </div>
                  <h2 className="text-2xl font-bold text-ink-950">{request.projectName}</h2>
                  <p className="mt-2 flex items-center gap-2 text-base font-semibold text-ink-700">
                    <Building2 className="h-4 w-4 text-ink-400" />
                    {request.clientName}
                  </p>
                </div>

                <Link
                  href={`/factory/requests/${request.id}`}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-border px-4 py-2.5 text-sm font-bold text-ink-700 transition hover:border-brand-light hover:bg-brand-light/40 hover:text-brand"
                >
                  상세 보기
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>

              <p className="mt-4 line-clamp-2 text-sm leading-6 text-ink-700">
                {request.description}
              </p>

              <dl className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="rounded-xl bg-surface-muted p-4">
                  <dt className="flex items-center gap-2 text-sm font-semibold text-ink-400">
                    <Package className="h-4 w-4" />
                    품목 / 공정
                  </dt>
                  <dd className="mt-1 font-bold text-ink-950">{request.productItem}</dd>
                  <dd className="mt-1 text-sm text-ink-400">{request.processType}</dd>
                </div>

                <div className="rounded-xl bg-surface-muted p-4">
                  <dt className="flex items-center gap-2 text-sm font-semibold text-ink-400">
                    <Wallet className="h-4 w-4" />
                    예산 / 수량
                  </dt>
                  <dd className="mt-1 font-bold text-ink-950">{request.budgetRange}</dd>
                  <dd className="mt-1 text-sm text-ink-400">{request.quantity}</dd>
                </div>

                <div className="rounded-xl bg-surface-muted p-4">
                  <dt className="flex items-center gap-2 text-sm font-semibold text-ink-400">
                    <CalendarDays className="h-4 w-4" />
                    희망 납기
                  </dt>
                  <dd className="mt-1 font-bold text-ink-950">{request.desiredDeadline}</dd>
                </div>

                <div className="rounded-xl bg-surface-muted p-4">
                  <dt className="flex items-center gap-2 text-sm font-semibold text-ink-400">
                    <FileText className="h-4 w-4" />
                    첨부 자료
                  </dt>
                  <dd className="mt-1 font-bold text-ink-950">{request.attachments.length}개</dd>
                </div>
              </dl>
            </article>
          ))}

          {filteredRequests.length === 0 && (
            <div className="rounded-2xl border border-border bg-white p-12 text-center shadow-sm xl:col-span-2">
              <Factory className="mx-auto h-12 w-12 text-ink-400" />
              <p className="mt-4 text-lg font-semibold text-ink-700">
                조건에 맞는 견적 모집글이 없습니다.
              </p>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
