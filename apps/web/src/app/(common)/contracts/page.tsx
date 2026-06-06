'use client'

import { useEffect, useMemo, useState } from 'react'
import { Clock, FileSignature, Search, SlidersHorizontal } from 'lucide-react'
import type { ContractStatus } from '@rootmatching/shared/schemas'

import { Badge, type BadgeProps } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { listMyContracts, type ContractListItem } from '@/lib/contracts-api'

type StatusFilter = ContractStatus | 'all'

const statusLabels: Record<ContractStatus, string> = {
  draft: '임시저장',
  pending: '서명 대기',
  in_progress: '서명 진행',
  completed: '서명 완료',
  cancelled: '계약 취소됨',
}

const statusVariants: Record<ContractStatus, BadgeProps['variant']> = {
  draft: 'slate',
  pending: 'info',
  in_progress: 'warning',
  completed: 'success',
  cancelled: 'destructive',
}

function isStatusFilter(value: string): value is StatusFilter {
  return (
    value === 'all' ||
    value === 'draft' ||
    value === 'pending' ||
    value === 'in_progress' ||
    value === 'completed' ||
    value === 'cancelled'
  )
}

function formatKoreanDate(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return iso

  return new Intl.DateTimeFormat('ko-KR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date)
}

function findParticipant(item: ContractListItem, role: string) {
  return item.participants.find((participant) => participant.role === role)
}

export default function ContractListPage() {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'
  const [items, setItems] = useState<ContractListItem[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [keyword, setKeyword] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')

  useEffect(() => {
    let cancelled = false

    async function loadContracts() {
      setLoading(true)
      const result = await listMyContracts({ apiUrl })
      if (cancelled) return

      if (result.ok) {
        setItems(result.data)
        setErrorMessage(null)
      } else {
        setItems([])
        setErrorMessage(result.message)
      }

      setLoading(false)
    }

    void loadContracts()

    return () => {
      cancelled = true
    }
  }, [apiUrl])

  const filteredContracts = useMemo(() => {
    if (!items) return []

    const normalizedKeyword = keyword.trim().toLowerCase()

    return items.filter((item) => {
      const matchesKeyword =
        normalizedKeyword.length === 0 || item.title.toLowerCase().includes(normalizedKeyword)
      const matchesStatus = statusFilter === 'all' || item.status === statusFilter

      return matchesKeyword && matchesStatus
    })
  }, [items, keyword, statusFilter])

  if (loading) {
    return (
      <div className="min-h-screen bg-background px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-10">
        <div className="mx-auto flex min-h-[40vh] max-w-7xl items-center justify-center">
          <Card className="border-border bg-card p-12 text-center shadow-ct-soft">
            <CardContent className="space-y-4 p-0">
              <FileSignature className="mx-auto h-12 w-12 animate-pulse text-muted-foreground" />
              <p className="text-kr-pretty text-[16px] font-semibold text-foreground">
                계약 목록을 불러오는 중입니다…
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-10">
      <div className="mx-auto max-w-7xl">
        <header className="mb-8 overflow-hidden rounded-2xl border border-border bg-card shadow-ct-soft">
          <div className="grid gap-6 p-6 sm:p-8 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <Badge
                variant="info"
                className="text-kr-keep mb-4 px-4 py-2 text-[15px] font-semibold"
              >
                <FileSignature className="h-4 w-4" />
                계약 관리
              </Badge>
              <h1 className="text-kr-keep text-[clamp(1.5rem,1.3rem+1vw,2rem)] font-bold tracking-normal text-foreground">
                계약 현황
              </h1>
              <CardDescription className="text-kr-pretty mt-3 max-w-3xl text-[16px] leading-8 text-muted-foreground sm:text-[18px]">
                진행 중이거나 완료된 계약을 상태별로 확인하고 필요한 정보를 빠르게 찾아보세요.
              </CardDescription>
            </div>
          </div>
        </header>

        {errorMessage ? (
          <Card className="mb-6 border-danger/30 bg-danger-bg shadow-ct-soft">
            <CardContent className="p-6">
              <p className="text-kr-pretty text-[16px] font-semibold leading-7 text-danger">
                {errorMessage}
              </p>
            </CardContent>
          </Card>
        ) : null}

        <Card className="mb-6 border-border bg-card shadow-ct-soft">
          <CardContent className="p-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-[1fr_220px]">
              <div className="space-y-2">
                <label
                  htmlFor="contract-search"
                  className="text-kr-keep block text-[14px] font-semibold text-ink-700"
                >
                  계약명 검색
                </label>
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="contract-search"
                    value={keyword}
                    onChange={(event) => setKeyword(event.target.value)}
                    type="search"
                    placeholder="계약명으로 검색"
                    className="h-12 rounded-xl bg-card pl-12 text-[16px] md:text-[16px]"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label
                  htmlFor="contract-status-filter"
                  className="text-kr-keep block text-[14px] font-semibold text-ink-700"
                >
                  상태 필터
                </label>
                <div className="relative">
                  <SlidersHorizontal className="pointer-events-none absolute left-4 top-1/2 z-10 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                  <Select
                    value={statusFilter}
                    onValueChange={(value) => {
                      if (isStatusFilter(value)) {
                        setStatusFilter(value)
                      }
                    }}
                  >
                    <SelectTrigger
                      id="contract-status-filter"
                      className="h-12 rounded-xl bg-card pl-12 text-[16px]"
                    >
                      <SelectValue placeholder="전체 상태" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all" className="text-[15px]">
                        전체 상태
                      </SelectItem>
                      <SelectItem value="draft" className="text-[15px]">
                        임시저장
                      </SelectItem>
                      <SelectItem value="pending" className="text-[15px]">
                        서명 대기
                      </SelectItem>
                      <SelectItem value="in_progress" className="text-[15px]">
                        서명 진행
                      </SelectItem>
                      <SelectItem value="completed" className="text-[15px]">
                        서명 완료
                      </SelectItem>
                      <SelectItem value="cancelled" className="text-[15px]">
                        계약 취소됨
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <main className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3">
          {filteredContracts.map((item) => {
            const factoryParticipant = findParticipant(item, 'factory')
            const clientParticipant = findParticipant(item, 'client')

            return (
              <Card
                key={item.id}
                className="border-border bg-card shadow-ct-soft transition hover:border-brand-light hover:shadow-ct-card"
              >
                <CardHeader className="p-4 pb-0 sm:p-5 sm:pb-0">
                  <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                    <Badge
                      variant={statusVariants[item.status]}
                      className="text-kr-keep text-[15px]"
                    >
                      {statusLabels[item.status]}
                    </Badge>
                    <span className="text-kr-keep inline-flex items-center gap-1.5 text-[15px] font-medium text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      {formatKoreanDate(item.createdAt)}
                    </span>
                  </div>
                  <CardTitle className="text-kr-pretty text-[17px] font-bold leading-7 text-foreground">
                    {item.title}
                  </CardTitle>
                </CardHeader>

                <CardContent className="space-y-3 p-4 text-[15px] leading-7 sm:p-5">
                  <dl className="grid grid-cols-1 gap-3">
                    {factoryParticipant ? (
                      <DataCell label="공장 담당자" value={factoryParticipant.name} />
                    ) : null}
                    {clientParticipant ? (
                      <DataCell label="발주처 담당자" value={clientParticipant.name} />
                    ) : null}
                  </dl>

                  {item.status === 'cancelled' && item.cancelledReason ? (
                    <div className="rounded-xl bg-danger-bg p-4">
                      <p className="text-kr-keep text-[15px] font-semibold text-danger">
                        취소 사유
                      </p>
                      <p className="text-kr-pretty mt-1 text-[15px] text-danger">
                        {item.cancelledReason}
                      </p>
                    </div>
                  ) : null}
                </CardContent>
              </Card>
            )
          })}

          {filteredContracts.length === 0 && (
            <Card className="border-border bg-card p-12 text-center shadow-ct-soft sm:col-span-2 lg:col-span-3">
              <FileSignature className="mx-auto h-12 w-12 text-muted-foreground" />
              <p className="text-kr-pretty mt-4 text-[18px] font-semibold text-muted-foreground">
                {items && items.length === 0
                  ? '아직 진행 중인 계약이 없습니다'
                  : '조건에 맞는 계약을 찾지 못했어요'}
              </p>
              <p className="text-kr-pretty mx-auto mt-2 max-w-xl text-[15px] leading-7 text-muted-foreground">
                {items && items.length === 0
                  ? '계약이 생성되면 이곳에서 서명 진행 상태와 담당자 정보를 확인할 수 있어요.'
                  : '검색어와 상태 필터를 다시 확인해주세요.'}
              </p>
            </Card>
          )}
        </main>
      </div>
    </div>
  )
}

function DataCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-surface-muted p-4">
      <dt className="text-kr-keep text-[15px] font-semibold text-muted-foreground">{label}</dt>
      <dd className="text-kr-pretty mt-1 text-[16px] font-bold text-foreground">{value}</dd>
    </div>
  )
}
