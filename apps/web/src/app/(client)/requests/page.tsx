'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  ArrowRight,
  Clock,
  FileText,
  LogIn,
  Search,
  SlidersHorizontal,
  Sparkles,
} from 'lucide-react'

import { AppBadge } from '@/components/ui/AppBadge'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { listMyQuoteRequests, type QuoteRequest } from '@/lib/quote-requests-api'
import {
  QUOTE_REQUEST_APP_BADGE_VARIANTS as appBadgeVariants,
  QUOTE_REQUEST_BADGE_VARIANTS as badgeVariants,
  QUOTE_REQUEST_STATUS_LABELS as statusLabels,
  QUOTE_REQUEST_STATUS_VALUES,
  formatKoreanDate,
  type QuoteRequestStatus,
} from '@/lib/quote-request-status'
import { useUserState } from '@/state/UserContext'

type StatusFilter = QuoteRequestStatus | 'all'

function isStatusFilter(value: string): value is StatusFilter {
  return value === 'all' || (QUOTE_REQUEST_STATUS_VALUES as readonly string[]).includes(value)
}

export default function ClientRequestListPage() {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'
  const router = useRouter()
  const userState = useUserState()
  const [items, setItems] = useState<QuoteRequest[] | null>(null)
  const [loading, setLoading] = useState(userState.isAuthenticated)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [keyword, setKeyword] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')

  useEffect(() => {
    if (!userState.isAuthenticated) {
      setItems([])
      setLoading(false)
      setErrorMessage(null)
      return undefined
    }

    const controller = new AbortController()

    async function loadQuoteRequests() {
      setLoading(true)
      const result = await listMyQuoteRequests({ apiUrl, signal: controller.signal })
      if (controller.signal.aborted) return

      if (result.ok) {
        setItems(result.data)
        setErrorMessage(null)
      } else {
        setItems([])
        setErrorMessage(result.message)
      }

      setLoading(false)
    }

    void loadQuoteRequests()

    return () => {
      controller.abort()
    }
  }, [apiUrl, userState.isAuthenticated])

  const filteredRequests = useMemo(() => {
    if (!items) return []

    const normalizedKeyword = keyword.trim().toLowerCase()

    return items.filter((request) => {
      const searchableText = `${request.projectName} ${request.productItem}`.toLowerCase()
      const matchesKeyword =
        normalizedKeyword.length === 0 || searchableText.includes(normalizedKeyword)
      const matchesStatus = statusFilter === 'all' || request.status === statusFilter

      return matchesKeyword && matchesStatus
    })
  }, [items, keyword, statusFilter])

  const showLoginCard = !userState.isAuthenticated
  const showEmptyCard = userState.isAuthenticated && !loading && filteredRequests.length === 0

  return (
    <div className="min-h-screen bg-background px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-10">
      <div className="mx-auto max-w-7xl">
        <header className="mb-8 overflow-hidden rounded-2xl border border-border bg-card shadow-ct-soft">
          <div className="grid gap-6 p-6 sm:p-8 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <AppBadge
                variant="blue"
                className="text-kr-keep mb-4 px-4 py-2 text-[15px] font-semibold"
              >
                <Sparkles className="h-4 w-4" />
                견적 요청 관리
              </AppBadge>
              <h1 className="text-kr-keep text-[clamp(1.5rem,1.3rem+1vw,2rem)] font-bold tracking-normal text-foreground">
                내 견적 요청 내역
              </h1>
              <p className="text-kr-pretty mt-3 max-w-3xl text-[16px] leading-8 text-muted-foreground sm:text-[18px]">
                내가 등록한 견적 요청의 검토 상태, 요청 조건, 첨부 자료를 한 곳에서 확인합니다.
              </p>
            </div>
          </div>
        </header>

        {showLoginCard ? (
          <Card className="mb-6 border-border bg-card text-center shadow-ct-soft">
            <CardContent className="p-8 sm:p-12">
              <LogIn className="mx-auto h-12 w-12 text-muted-foreground" />
              <h2 className="text-kr-pretty mt-4 text-[22px] font-bold text-foreground">
                로그인 후 견적 요청을 확인할 수 있습니다
              </h2>
              <p className="text-kr-pretty mt-2 text-[16px] leading-7 text-muted-foreground">
                발주처 계정으로 로그인하면 내가 등록한 요청과 매칭 결과가 표시됩니다.
              </p>
              <Button asChild size="lg" className="mt-6 min-h-tap-min">
                <Link href="/role-select">
                  로그인하러 가기
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        ) : null}

        {errorMessage ? (
          <Card className="mb-6 border-danger/30 bg-danger-bg shadow-ct-soft">
            <CardContent className="p-6">
              <p className="text-kr-pretty text-[16px] font-semibold leading-7 text-danger">
                {errorMessage}
              </p>
            </CardContent>
          </Card>
        ) : null}

        {!showLoginCard ? (
          <Card className="mb-6 border-border bg-card shadow-ct-soft">
            <CardContent className="p-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-[1fr_220px]">
                <div className="space-y-2">
                  <label
                    htmlFor="request-search"
                    className="text-kr-keep block text-[14px] font-semibold text-ink-700"
                  >
                    견적 요청 검색
                  </label>
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="request-search"
                      value={keyword}
                      onChange={(event) => setKeyword(event.target.value)}
                      type="search"
                      placeholder="프로젝트명, 품목으로 검색"
                      className="h-12 rounded-xl bg-card pl-12 text-[16px] md:text-[16px]"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label
                    htmlFor="request-status-filter"
                    className="text-kr-keep block text-[14px] font-semibold text-ink-700"
                  >
                    상태 필터
                  </label>
                  <div className="relative">
                    <SlidersHorizontal className="pointer-events-none absolute left-4 top-1/2 z-10 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                    <Select
                      value={statusFilter}
                      onValueChange={(value) => {
                        if (isStatusFilter(value)) setStatusFilter(value)
                      }}
                    >
                      <SelectTrigger
                        id="request-status-filter"
                        className="h-12 rounded-xl bg-card pl-12 text-[16px]"
                      >
                        <SelectValue placeholder="전체 상태" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all" className="text-[15px]">
                          전체 상태
                        </SelectItem>
                        <SelectItem value="NEW" className="text-[15px]">
                          공장 검토 전
                        </SelectItem>
                        <SelectItem value="REVIEWING" className="text-[15px]">
                          공장 검토 중
                        </SelectItem>
                        <SelectItem value="MATCHED" className="text-[15px]">
                          매칭 완료
                        </SelectItem>
                        <SelectItem value="QUOTED" className="text-[15px]">
                          견적 도착
                        </SelectItem>
                        <SelectItem value="CONTRACTED" className="text-[15px]">
                          계약 체결
                        </SelectItem>
                        <SelectItem value="CANCELLED" className="text-[15px]">
                          요청 취소됨
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : null}

        <main className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {loading ? <RequestListSkeleton /> : null}

          {!loading &&
            filteredRequests.map((request) => (
              <Card
                key={request.id}
                role="button"
                tabIndex={0}
                onClick={() => router.push(`/requests/${request.id}`)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ')
                    router.push(`/requests/${request.id}`)
                }}
                className="cursor-pointer border-border bg-card shadow-ct-soft transition hover:border-brand-light hover:shadow-ct-card"
              >
                <CardHeader className="p-4 pb-0 sm:p-5 sm:pb-0">
                  <div className="flex flex-col gap-4">
                    <div>
                      <div className="mb-3 flex flex-wrap items-center gap-2">
                        <Badge
                          variant={badgeVariants[request.status]}
                          className="text-kr-keep text-[15px]"
                        >
                          {statusLabels[request.status]}
                        </Badge>
                        <AppBadge
                          variant={appBadgeVariants[request.status]}
                          className="text-kr-keep text-[13px]"
                        >
                          {statusLabels[request.status]}
                        </AppBadge>
                        <span className="text-kr-keep inline-flex items-center gap-1.5 text-[15px] font-medium text-muted-foreground">
                          <Clock className="h-4 w-4" />
                          {formatKoreanDate(request.createdAt)}
                        </span>
                      </div>
                      <CardTitle className="text-kr-pretty text-[16px] font-bold leading-6 text-foreground sm:text-[17px]">
                        {request.projectName}
                      </CardTitle>
                      <p className="text-kr-pretty mt-2 text-[15px] text-muted-foreground">
                        {request.productItem}
                      </p>
                    </div>

                    <Button
                      asChild
                      variant="outline"
                      size="default"
                      className="text-kr-keep w-full sm:w-auto"
                    >
                      <Link
                        href={`/requests/${request.id}`}
                        onClick={(event) => event.stopPropagation()}
                      >
                        {request.status === 'QUOTED' || request.status === 'MATCHED'
                          ? '매칭 결과 보기'
                          : '요청 수정'}
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                </CardHeader>

                <CardContent className="p-4 sm:p-5">
                  <dl className="grid grid-cols-1 gap-3">
                    <DataCell label="공정" value={request.processType} />
                    <DataCell label="수량" value={request.estimatedQuantity} />
                    <DataCell label="예산" value={request.budgetRange} />
                    <DataCell label="희망 납기" value={request.desiredDeadline} />
                  </dl>

                  <div className="text-kr-keep mt-4 flex items-center gap-2 text-[15px] text-muted-foreground">
                    <FileText className="h-4 w-4" />
                    상세 조건 등록됨
                  </div>
                </CardContent>
              </Card>
            ))}

          {showEmptyCard ? (
            <Card className="border-border bg-card p-8 text-center shadow-ct-soft sm:col-span-2 lg:col-span-3 sm:p-12">
              <Sparkles className="mx-auto h-12 w-12 text-muted-foreground" />
              <p className="text-kr-pretty mt-4 text-[18px] font-semibold text-muted-foreground">
                조건에 맞는 견적 요청이 없습니다.
              </p>
              <Button asChild size="lg" className="mt-6 min-h-tap-min">
                <Link href="/request">
                  새 견적 요청 등록
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </Card>
          ) : null}
        </main>
      </div>
    </div>
  )
}

function RequestListSkeleton() {
  return Array.from({ length: 6 }).map((_, index) => (
    <Card key={index} className="border-border bg-card shadow-ct-soft">
      <CardHeader className="p-4 pb-0 sm:p-5 sm:pb-0">
        <div className="space-y-4">
          <div className="flex gap-2">
            <Skeleton className="h-5 w-20 rounded-full" />
            <Skeleton className="h-5 w-28 rounded-full" />
          </div>
          <Skeleton className="h-5 w-4/5" />
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="h-11 w-full rounded-xl" />
        </div>
      </CardHeader>
      <CardContent className="space-y-3 p-4 sm:p-5">
        <Skeleton className="h-16 w-full rounded-xl" />
        <Skeleton className="h-16 w-full rounded-xl" />
      </CardContent>
    </Card>
  ))
}

function DataCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-surface-muted p-4">
      <dt className="text-kr-keep text-[15px] font-semibold text-muted-foreground">{label}</dt>
      <dd className="text-kr-pretty mt-1 font-bold text-foreground">{value}</dd>
    </div>
  )
}
