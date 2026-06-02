'use client'

import { useMemo, useState, type ReactNode } from 'react'
import Link from 'next/link'
import {
  ArrowRight,
  CalendarClock,
  CheckCircle,
  Clock,
  PackageCheck,
  PencilLine,
  ShieldCheck,
  Truck,
} from 'lucide-react'
import type { TransactionRole } from '@rootmatching/shared'
import { transactionCases, transactionStatusStyles } from '@/data/transactionData'
import { cn } from '@/lib/cn'

type RoleFilter = TransactionRole | 'all'

function getRoleLabel(role: TransactionRole): string {
  return role === 'client' ? '내가 요청한 거래' : '내가 맡은 제작'
}

function getDetailPath(id: string, role: TransactionRole): string {
  return role === 'factory' ? `/transactions/${id}?mode=factory` : `/transactions/${id}`
}

export default function TransactionListPage() {
  const [activeRole, setActiveRole] = useState<RoleFilter>('all')

  const filteredTransactions = useMemo(() => {
    if (activeRole === 'all') return transactionCases
    return transactionCases.filter((item) => item.myRole === activeRole)
  }, [activeRole])

  const activeTransactions = filteredTransactions.filter((item) => item.statusKey !== 'completed')
  const inspectionTransactions = filteredTransactions.filter(
    (item) => item.statusKey === 'inspection',
  )
  const delayedTransactions = filteredTransactions.filter((item) => item.statusKey === 'delayed')

  const roleTabs: Array<{ value: RoleFilter; label: string; count: number }> = [
    { value: 'all', label: '전체 거래', count: transactionCases.length },
    {
      value: 'client',
      label: '내가 요청한 거래',
      count: transactionCases.filter((item) => item.myRole === 'client').length,
    },
    {
      value: 'factory',
      label: '내가 맡은 제작',
      count: transactionCases.filter((item) => item.myRole === 'factory').length,
    },
  ]

  return (
    <div className="min-h-screen bg-surface-muted px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <header className="mb-8 overflow-hidden rounded-2xl border border-brand-light bg-white shadow-sm">
          <div className="p-6 sm:p-8">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-brand-light px-4 py-2 text-sm font-semibold text-brand">
              <ShieldCheck className="h-4 w-4" />
              거래 진행 관리
            </div>
            <h1 className="text-3xl font-bold tracking-normal text-ink-950 sm:text-4xl">
              진행 중인 거래
            </h1>
            <p className="mt-3 max-w-3xl text-lg leading-8 text-ink-700">
              계약 이후 제작, 납품, 검수 단계에 있는 거래를 한 곳에서 확인합니다.
            </p>
          </div>
        </header>

        <section className="mb-6 rounded-2xl border border-border bg-white p-2 shadow-sm">
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            {roleTabs.map((tab) => (
              <button
                key={tab.value}
                type="button"
                className={cn(
                  'rounded-xl px-4 py-3 text-sm font-bold transition',
                  activeRole === tab.value
                    ? 'bg-brand text-white shadow-sm'
                    : 'text-ink-700 hover:bg-surface-muted hover:text-ink-950',
                )}
                onClick={() => setActiveRole(tab.value)}
              >
                {tab.label} {tab.count}
              </button>
            ))}
          </div>
        </section>

        <section className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-3">
          <SummaryCard
            icon={<Truck className="h-6 w-6 text-brand" />}
            label="진행 중"
            value={activeTransactions.length}
          />
          <SummaryCard
            icon={<PackageCheck className="h-6 w-6 text-warning" />}
            label="검수 대기"
            value={inspectionTransactions.length}
          />
          <SummaryCard
            icon={<Clock className="h-6 w-6 text-danger" />}
            label="지연 주의"
            value={delayedTransactions.length}
          />
        </section>

        <section className="space-y-4">
          {filteredTransactions.map((item) => (
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
                        transactionStatusStyles[item.statusKey],
                      )}
                    >
                      {item.status}
                    </span>
                    <span
                      className={cn(
                        'rounded-full px-3 py-1 text-xs font-bold ring-1',
                        item.myRole === 'client'
                          ? 'bg-emerald-50 text-emerald-700 ring-emerald-100'
                          : 'bg-indigo-50 text-indigo-700 ring-indigo-100',
                      )}
                    >
                      {getRoleLabel(item.myRole)}
                    </span>
                  </div>

                  <h2 className="mt-3 text-xl font-bold text-ink-950">{item.projectName}</h2>
                  <p className="mt-2 text-base text-ink-700">
                    {item.factory} · {item.amount}
                  </p>

                  <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-3">
                    <InfoCell
                      icon={<CalendarClock className="mt-0.5 h-5 w-5 shrink-0 text-ink-400" />}
                      label="납기"
                      value={item.dueDate}
                    />
                    <InfoCell
                      icon={<CheckCircle className="mt-0.5 h-5 w-5 shrink-0 text-ink-400" />}
                      label="다음 조치"
                      value={item.nextAction}
                    />
                    <InfoCell
                      icon={<Clock className="mt-0.5 h-5 w-5 shrink-0 text-ink-400" />}
                      label="최근 업데이트"
                      value={item.updatedAt}
                    />
                  </div>

                  <div className="mt-5">
                    <div className="mb-2 flex items-center justify-between text-sm">
                      <span className="font-semibold text-ink-700">진행률</span>
                      <span className="font-bold text-ink-950">{item.progressRate}%</span>
                    </div>
                    <div className="h-2 rounded-full bg-surface-muted">
                      <div
                        className="h-2 rounded-full bg-brand"
                        style={{ width: `${item.progressRate}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-2 sm:flex-row lg:flex-col">
                  <Link
                    href={getDetailPath(item.id, item.myRole)}
                    className="inline-flex items-center justify-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-bold text-ink-700 transition hover:border-brand-light hover:bg-brand-light/40 hover:text-brand"
                  >
                    {item.myRole === 'client' ? '진행 확인' : '상세 보기'}
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                  {item.myRole === 'factory' && (
                    <Link
                      href={`/transactions/${item.id}?mode=factory`}
                      className="inline-flex items-center justify-center gap-2 rounded-lg bg-brand px-4 py-2 text-sm font-bold text-white transition hover:bg-brand-hover"
                    >
                      <PencilLine className="h-4 w-4" />
                      진행 업데이트
                    </Link>
                  )}
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

function InfoCell({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
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
