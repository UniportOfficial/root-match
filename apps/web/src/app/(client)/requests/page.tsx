'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { ArrowRight, Clock, FileText, Search, SlidersHorizontal, Sparkles } from 'lucide-react'
import type { ReceivedQuoteRequestStatus } from '@rootmatching/shared'
import { AppBadge } from '@/components/ui/AppBadge'
import { mockReceivedQuoteRequests } from '@/data/requestData'

type StatusFilter = ReceivedQuoteRequestStatus | 'all'

function isStatusFilter(value: string): value is StatusFilter {
  return value === 'all' || value === 'new' || value === 'reviewing' || value === 'quoted'
}

function getStatusLabel(status: ReceivedQuoteRequestStatus): string {
  if (status === 'new') return '공장 검토 전'
  if (status === 'reviewing') return '공장 검토 중'
  return '견적 도착'
}

function getStatusVariant(status: ReceivedQuoteRequestStatus): 'blue' | 'green' | 'amber' {
  if (status === 'new') return 'blue'
  if (status === 'reviewing') return 'amber'
  return 'green'
}

export default function ClientRequestListPage() {
  const [keyword, setKeyword] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')

  const filteredRequests = useMemo(() => {
    const normalizedKeyword = keyword.toLowerCase()

    return mockReceivedQuoteRequests.filter((request) => {
      const searchableText =
        `${request.projectName} ${request.productItem} ${request.processType}`.toLowerCase()
      const matchesKeyword = searchableText.includes(normalizedKeyword)
      const matchesStatus = statusFilter === 'all' || request.status === statusFilter

      return matchesKeyword && matchesStatus
    })
  }, [keyword, statusFilter])

  return (
    <div className="min-h-screen bg-surface-muted px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <header className="mb-8 overflow-hidden rounded-2xl border border-brand-light bg-white shadow-sm">
          <div className="grid gap-6 p-6 sm:p-8 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-brand-light px-4 py-2 text-sm font-semibold text-brand">
                <Sparkles className="h-4 w-4" />
                견적 요청 관리
              </div>
              <h1 className="text-3xl font-bold tracking-normal text-ink-950 sm:text-4xl">
                내 견적 요청 내역
              </h1>
              <p className="mt-3 max-w-3xl text-lg leading-8 text-ink-700">
                내가 등록한 견적 요청의 검토 상태, 요청 조건, 첨부 자료를 한 곳에서 확인합니다.
              </p>
            </div>
          </div>
        </header>

        <section className="mb-6 rounded-2xl border border-border bg-white p-4 shadow-sm">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_220px]">
            <label className="relative block">
              <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-ink-400" />
              <input
                value={keyword}
                onChange={(event) => setKeyword(event.target.value)}
                type="search"
                placeholder="프로젝트명, 품목, 공정으로 검색"
                className="h-12 w-full rounded-xl border border-slate-300 pl-12 pr-4 text-base outline-none transition focus:border-brand focus:ring-4 focus:ring-brand-light"
              />
            </label>
            <label className="relative block">
              <SlidersHorizontal className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-ink-400" />
              <select
                value={statusFilter}
                onChange={(event) => {
                  if (isStatusFilter(event.target.value)) {
                    setStatusFilter(event.target.value)
                  }
                }}
                className="h-12 w-full appearance-none rounded-xl border border-slate-300 bg-white pl-12 pr-4 text-base outline-none transition focus:border-brand focus:ring-4 focus:ring-brand-light"
              >
                <option value="all">전체 상태</option>
                <option value="new">공장 검토 전</option>
                <option value="reviewing">공장 검토 중</option>
                <option value="quoted">견적 도착</option>
              </select>
            </label>
          </div>
        </section>

        <main className="grid grid-cols-1 gap-5">
          {filteredRequests.map((request) => (
            <article
              key={request.id}
              className="rounded-2xl border border-border bg-white p-5 shadow-sm transition hover:border-brand-light hover:shadow-md sm:p-6"
            >
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <div className="mb-3 flex flex-wrap items-center gap-2">
                    <AppBadge variant={getStatusVariant(request.status)}>
                      {getStatusLabel(request.status)}
                    </AppBadge>
                    <span className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-400">
                      <Clock className="h-4 w-4" />
                      {request.requestedAt}
                    </span>
                  </div>
                  <h2 className="text-2xl font-bold text-ink-950">{request.projectName}</h2>
                  <p className="mt-2 text-base text-ink-700">{request.productItem}</p>
                </div>

                <Link
                  href={`/requests/${request.id}`}
                  className="inline-flex items-center justify-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-bold text-ink-700 transition hover:border-brand-light hover:bg-brand-light/40 hover:text-brand"
                >
                  {request.status === 'quoted' ? '매칭 결과 보기' : '요청 수정'}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>

              <dl className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <DataCell label="공정" value={request.processType} />
                <DataCell label="수량" value={request.quantity} />
                <DataCell label="예산" value={request.budgetRange} />
                <DataCell label="희망 납기" value={request.desiredDeadline} />
              </dl>

              <div className="mt-4 flex items-center gap-2 text-sm text-ink-400">
                <FileText className="h-4 w-4" />
                첨부 자료 {request.attachments.length}개
              </div>
            </article>
          ))}

          {filteredRequests.length === 0 && (
            <div className="rounded-2xl border border-border bg-white p-12 text-center">
              <Sparkles className="mx-auto h-12 w-12 text-ink-400" />
              <p className="mt-4 text-lg font-semibold text-ink-700">
                조건에 맞는 견적 요청이 없습니다.
              </p>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}

function DataCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-surface-muted p-4">
      <dt className="text-sm font-semibold text-ink-400">{label}</dt>
      <dd className="mt-1 font-bold text-ink-950">{value}</dd>
    </div>
  )
}
