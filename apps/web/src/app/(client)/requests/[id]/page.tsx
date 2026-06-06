'use client'

import { useEffect, useMemo, useState, type ReactNode } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  UpdateQuoteRequestSchema,
  type UpdateQuoteRequestInput,
} from '@rootmatching/shared/schemas'
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Clock,
  FileText,
  Loader2,
  Package,
  Save,
  Sparkles,
  Wallet,
} from 'lucide-react'

import { AppBadge } from '@/components/ui/AppBadge'
import { AppButton } from '@/components/ui/AppButton'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Badge, type BadgeProps } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/cn'
import {
  cancelMyQuoteRequest,
  getMyQuoteRequest,
  updateMyQuoteRequest,
  type MatchRecommendation,
  type QuoteRequest,
  type QuoteRequestDetail,
  type QuoteRequestStatus,
} from '@/lib/quote-requests-api'
import { useUserState } from '@/state/UserContext'

type RequestFormValues = UpdateQuoteRequestInput
type ViewState = 'ready' | 'not-found' | 'forbidden'

const fieldNames = [
  'projectName',
  'processType',
  'productItem',
  'estimatedQuantity',
  'desiredDeadline',
  'budgetRange',
  'detailRequirements',
] as const

const statusLabels: Record<QuoteRequestStatus, string> = {
  NEW: '공장 검토 대기',
  REVIEWING: '공장 검토 중',
  MATCHED: '매칭 완료',
  QUOTED: '견적 도착',
  CONTRACTED: '계약 체결',
  CANCELLED: '요청 취소됨',
}

const badgeVariants: Record<QuoteRequestStatus, BadgeProps['variant']> = {
  NEW: 'info',
  REVIEWING: 'warning',
  MATCHED: 'success',
  QUOTED: 'success',
  CONTRACTED: 'success',
  CANCELLED: 'destructive',
}

const appBadgeVariants: Record<QuoteRequestStatus, 'blue' | 'amber' | 'green' | 'red'> = {
  NEW: 'blue',
  REVIEWING: 'amber',
  MATCHED: 'green',
  QUOTED: 'green',
  CONTRACTED: 'green',
  CANCELLED: 'red',
}

const inputClassName = 'h-11 bg-card text-[15px] disabled:bg-muted'
const textareaClassName = 'min-h-32 resize-none bg-card text-[15px] disabled:bg-muted'
const labelClassName = 'text-kr-keep text-[16px] font-semibold text-foreground'
const errorClassName = 'text-kr-pretty mt-1 text-[14px] font-semibold text-destructive'

function isTerminalStatus(status: QuoteRequestStatus) {
  return status === 'CANCELLED' || status === 'CONTRACTED'
}

function terminalEditMessage(status: QuoteRequestStatus): string | null {
  if (status === 'CANCELLED') return '취소된 요청은 수정할 수 없습니다'
  if (status === 'CONTRACTED') return '체결된 요청은 수정할 수 없습니다'
  return null
}

function formatKoreanDate(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return iso
  return new Intl.DateTimeFormat('ko-KR', { dateStyle: 'medium', timeStyle: 'short' }).format(date)
}

function formatPrice(value: number): string {
  return `${new Intl.NumberFormat('ko-KR').format(value)}만원`
}

function requestToFormValues(request: QuoteRequest): Required<RequestFormValues> {
  return {
    projectName: request.projectName,
    processType: request.processType,
    productItem: request.productItem,
    estimatedQuantity: request.estimatedQuantity,
    desiredDeadline: request.desiredDeadline,
    budgetRange: request.budgetRange,
    detailRequirements: request.detailRequirements,
  }
}

export default function ClientRequestDetailPage() {
  const params = useParams<{ id: string }>()
  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'
  const userState = useUserState()
  const [request, setRequest] = useState<QuoteRequestDetail | null>(null)
  const [viewState, setViewState] = useState<ViewState>('ready')
  const [loading, setLoading] = useState(userState.isAuthenticated)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false)
  const [cancelDialogError, setCancelDialogError] = useState<string | null>(null)
  const [cancelLoading, setCancelLoading] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    formState: { dirtyFields, errors, isSubmitting },
  } = useForm<RequestFormValues>({
    resolver: zodResolver(UpdateQuoteRequestSchema),
    defaultValues: request ? requestToFormValues(request) : undefined,
  })

  useEffect(() => {
    if (!userState.isAuthenticated) {
      setRequest(null)
      setLoading(false)
      setErrorMessage(null)
      return undefined
    }

    const controller = new AbortController()

    async function loadQuoteRequest() {
      setLoading(true)
      const result = await getMyQuoteRequest({ apiUrl, id: params.id, signal: controller.signal })
      if (controller.signal.aborted) return

      if (result.ok) {
        setRequest(result.data)
        reset(requestToFormValues(result.data))
        setViewState('ready')
        setErrorMessage(null)
      } else {
        setRequest(null)
        setViewState(
          result.status === 404 ? 'not-found' : result.status === 403 ? 'forbidden' : 'ready',
        )
        setErrorMessage(result.message)
      }

      setLoading(false)
    }

    void loadQuoteRequest()

    return () => {
      controller.abort()
    }
  }, [apiUrl, params.id, reset, userState.isAuthenticated])

  const matchedFactories = useMemo(
    () => [...(request?.recommendations ?? [])].sort((left, right) => right.score - left.score),
    [request?.recommendations],
  )
  const terminalMessage = request ? terminalEditMessage(request.status) : null

  function enterEditMode() {
    if (!request || isTerminalStatus(request.status)) return
    reset(requestToFormValues(request))
    setSuccessMessage(null)
    setErrorMessage(null)
    setIsEditing(true)
  }

  function cancelEditMode() {
    if (request) reset(requestToFormValues(request))
    setIsEditing(false)
    setErrorMessage(null)
  }

  async function saveRequest(values: RequestFormValues) {
    if (!request) return
    const payload: Partial<RequestFormValues> = {}
    fieldNames.forEach((field) => {
      if (dirtyFields[field]) payload[field] = values[field]
    })

    if (Object.keys(payload).length === 0) {
      setErrorMessage('변경된 내용이 없습니다')
      return
    }

    setErrorMessage(null)
    setSuccessMessage(null)
    const result = await updateMyQuoteRequest({ apiUrl, id: request.id, input: payload })
    if (!result.ok) {
      setErrorMessage(result.message)
      return
    }

    const nextRequest = { ...request, ...result.data, recommendations: request.recommendations }
    setRequest(nextRequest)
    reset(requestToFormValues(nextRequest))
    setIsEditing(false)
    setSuccessMessage('변경사항이 저장되었습니다.')
  }

  async function handleCancelRequest() {
    if (!request) return
    const controller = new AbortController()
    setCancelLoading(true)
    setCancelDialogError(null)
    try {
      const result = await cancelMyQuoteRequest({
        apiUrl,
        id: request.id,
        signal: controller.signal,
      })
      if (!result.ok) {
        setCancelDialogError(result.message)
        return
      }
      setRequest({ ...request, ...result.data, recommendations: request.recommendations })
      setIsEditing(false)
      setCancelDialogOpen(false)
      setSuccessMessage('견적 요청이 취소되었습니다.')
    } finally {
      setCancelLoading(false)
    }
  }

  if (!userState.isAuthenticated) {
    return (
      <StateCard
        icon={<FileText />}
        title="로그인 후 견적 요청을 확인할 수 있습니다"
        description="발주처 계정으로 로그인하면 요청 상세와 매칭 결과가 표시됩니다."
        href="/role-select"
        action="로그인하러 가기"
      />
    )
  }

  if (loading) return <LoadingDetail />

  if (viewState === 'not-found') {
    return (
      <StateCard
        icon={<FileText />}
        title="견적 요청을 찾을 수 없습니다"
        href="/requests"
        action="목록으로 돌아가기"
      />
    )
  }

  if (viewState === 'forbidden') {
    return (
      <StateCard
        icon={<FileText />}
        title="접근 권한이 없습니다"
        href="/requests"
        action="목록으로 돌아가기"
      />
    )
  }

  if (!request) {
    return (
      <StateCard
        icon={<FileText />}
        title={errorMessage ?? '견적 요청을 불러올 수 없습니다'}
        href="/requests"
        action="목록으로 돌아가기"
      />
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-10">
        <Link
          href="/requests"
          className="text-kr-keep mb-5 inline-flex items-center gap-2 text-[15px] font-bold text-ink-700 transition hover:text-brand"
        >
          <ArrowLeft className="h-4 w-4" />
          견적 요청 내역
        </Link>

        <section className="space-y-6 sm:space-y-8">
          <Card className="border-border bg-card shadow-ct-soft">
            <CardContent className="p-4 sm:p-6 lg:p-8">
              <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <div className="mb-4 flex flex-wrap items-center gap-2">
                    <Badge
                      variant={badgeVariants[request.status]}
                      className="text-kr-keep text-[15px]"
                    >
                      {statusLabels[request.status]}
                    </Badge>
                    <AppBadge variant={appBadgeVariants[request.status]}>
                      {statusLabels[request.status]}
                    </AppBadge>
                    <span className="text-kr-keep text-[15px] font-semibold text-muted-foreground">
                      {request.id}
                    </span>
                  </div>
                  <h1 className="text-kr-pretty text-[24px] font-bold tracking-normal text-foreground sm:text-[28px]">
                    {request.projectName}
                  </h1>
                  <p className="text-kr-pretty mt-3 max-w-3xl text-[16px] leading-7 text-foreground/80">
                    {request.detailRequirements}
                  </p>
                </div>

                <div className="flex flex-col gap-2 sm:min-w-48">
                  <Button
                    type="button"
                    variant="outline"
                    size="lg"
                    disabled={isEditing || isTerminalStatus(request.status)}
                    onClick={enterEditMode}
                  >
                    요청 수정
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                  {terminalMessage ? (
                    <p className="text-kr-pretty text-[14px] font-semibold leading-6 text-muted-foreground">
                      {terminalMessage}
                    </p>
                  ) : null}
                  {!isTerminalStatus(request.status) ? (
                    <CancelRequestDialog
                      open={cancelDialogOpen}
                      onOpenChange={setCancelDialogOpen}
                      loading={cancelLoading}
                      errorMessage={cancelDialogError}
                      onConfirm={() => void handleCancelRequest()}
                    />
                  ) : null}
                </div>
              </div>
            </CardContent>
          </Card>

          {successMessage ? (
            <p className="text-kr-pretty rounded-xl border border-success/30 bg-success-bg p-4 text-[15px] font-semibold leading-7 text-success">
              {successMessage}
            </p>
          ) : null}

          {errorMessage && isEditing ? (
            <p
              role="alert"
              className="text-kr-pretty rounded-xl border border-danger/30 bg-danger-bg p-4 text-[15px] font-semibold leading-7 text-danger"
            >
              {errorMessage}
            </p>
          ) : null}

          {isEditing ? (
            <EditRequestForm
              register={register}
              errors={errors}
              isSubmitting={isSubmitting}
              onSubmit={handleSubmit(saveRequest)}
              onCancel={cancelEditMode}
            />
          ) : null}

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
              title={request.estimatedQuantity}
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

          <section className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_340px] lg:gap-8">
            <Card className="border-border bg-card shadow-ct-soft">
              <CardHeader>
                <CardTitle className="text-kr-pretty text-[18px] font-bold sm:text-[20px]">
                  요청 상세 정보
                </CardTitle>
              </CardHeader>
              <CardContent>
                <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <InfoCell label="요청일" value={formatKoreanDate(request.createdAt)} />
                  <InfoCell label="최근 수정" value={formatKoreanDate(request.updatedAt)} />
                  <div className="sm:col-span-2">
                    <dt className="text-kr-keep text-[15px] font-semibold text-muted-foreground">
                      상세 요구사항
                    </dt>
                    <dd className="text-kr-pretty mt-2 rounded-xl bg-surface-muted p-4 text-[15px] font-semibold leading-7 text-ink-950">
                      {request.detailRequirements}
                    </dd>
                  </div>
                </dl>
              </CardContent>
            </Card>

            <Card className="border-border bg-card shadow-ct-soft">
              <CardHeader>
                <CardTitle className="text-kr-pretty text-[18px] font-bold sm:text-[20px]">
                  진행 상태
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ol className="space-y-3">
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
                          request.status === 'NEW' ? 'text-ink-400' : 'text-warning',
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
                          matchedFactories.length > 0 ? 'text-brand' : 'text-ink-400',
                        )}
                      />
                    }
                    title="견적 결과 확인"
                    description="도착한 견적과 공장 정보를 이 화면에서 확인합니다."
                  />
                </ol>
              </CardContent>
            </Card>
          </section>

          <Card className="border-border bg-card shadow-ct-soft">
            <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <CardTitle className="text-kr-pretty text-[18px] font-bold sm:text-[20px]">
                  매칭 결과 정보
                </CardTitle>
                <CardDescription className="text-kr-pretty text-[15px]">
                  이 견적 요청에 연결된 공장 견적과 핵심 지표입니다.
                </CardDescription>
              </div>
              <AppBadge variant={matchedFactories.length > 0 ? 'green' : 'slate'}>
                {matchedFactories.length > 0
                  ? `${matchedFactories.length}개 견적 도착`
                  : '견적 대기'}
              </AppBadge>
            </CardHeader>
            <CardContent>
              {matchedFactories.length > 0 ? (
                <RecommendationGrid recommendations={matchedFactories} />
              ) : (
                <EmptyRecommendation />
              )}
            </CardContent>
          </Card>
        </section>
      </main>
    </div>
  )
}

function EditRequestForm({
  register,
  errors,
  isSubmitting,
  onSubmit,
  onCancel,
}: {
  register: ReturnType<typeof useForm<RequestFormValues>>['register']
  errors: ReturnType<typeof useForm<RequestFormValues>>['formState']['errors']
  isSubmitting: boolean
  onSubmit: () => void
  onCancel: () => void
}) {
  return (
    <Card className="border-border bg-card shadow-ct-soft">
      <CardHeader>
        <div className="flex flex-wrap items-center gap-2">
          <CardTitle className="text-kr-pretty text-[18px] font-bold sm:text-[20px]">
            편집 중
          </CardTitle>
          <AppBadge variant="amber">요청 수정</AppBadge>
        </div>
        <CardDescription className="text-kr-pretty text-[15px] leading-7">
          변경된 항목만 저장됩니다.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form id="quote-request-edit-form" onSubmit={onSubmit} className="space-y-5">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="프로젝트명" id="projectName" error={errors.projectName?.message}>
              <Input id="projectName" className={inputClassName} {...register('projectName')} />
            </Field>
            <Field label="공정" id="processType" error={errors.processType?.message}>
              <Input id="processType" className={inputClassName} {...register('processType')} />
            </Field>
            <Field label="품목" id="productItem" error={errors.productItem?.message}>
              <Input id="productItem" className={inputClassName} {...register('productItem')} />
            </Field>
            <Field
              label="예상 수량"
              id="estimatedQuantity"
              error={errors.estimatedQuantity?.message}
            >
              <Input
                id="estimatedQuantity"
                className={inputClassName}
                {...register('estimatedQuantity')}
              />
            </Field>
            <Field label="희망 납기" id="desiredDeadline" error={errors.desiredDeadline?.message}>
              <Input
                id="desiredDeadline"
                className={inputClassName}
                {...register('desiredDeadline')}
              />
            </Field>
            <Field label="예산 범위" id="budgetRange" error={errors.budgetRange?.message}>
              <Input id="budgetRange" className={inputClassName} {...register('budgetRange')} />
            </Field>
          </div>
          <Field
            label="상세 요구사항"
            id="detailRequirements"
            error={errors.detailRequirements?.message}
          >
            <Textarea
              id="detailRequirements"
              className={textareaClassName}
              {...register('detailRequirements')}
            />
          </Field>
        </form>
      </CardContent>
      <div className="sticky bottom-0 z-10 border-t border-border bg-card/95 p-4 backdrop-blur sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="outline"
            size="lg"
            disabled={isSubmitting}
            onClick={onCancel}
          >
            취소
          </Button>
          <Button type="submit" form="quote-request-edit-form" size="lg" disabled={isSubmitting}>
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            {isSubmitting ? '저장 중...' : '변경사항 저장'}
          </Button>
        </div>
      </div>
    </Card>
  )
}

function Field({
  label,
  id,
  error,
  children,
}: {
  label: string
  id: string
  error?: string
  children: ReactNode
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id} className={labelClassName}>
        {label}
      </Label>
      {children}
      {error ? <p className={errorClassName}>{error}</p> : null}
    </div>
  )
}

function CancelRequestDialog({
  open,
  onOpenChange,
  loading,
  errorMessage,
  onConfirm,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  loading: boolean
  errorMessage: string | null
  onConfirm: () => void
}) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogTrigger asChild>
        <AppButton variant="danger" size="md" fullWidth onClick={() => onOpenChange(true)}>
          이 요청 취소
        </AppButton>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>이 견적 요청을 취소하시겠어요?</AlertDialogTitle>
          <AlertDialogDescription className="text-[15px] leading-7">
            취소된 요청은 매칭 결과를 더 이상 받을 수 없습니다.
          </AlertDialogDescription>
        </AlertDialogHeader>
        {errorMessage ? (
          <div
            role="alert"
            className="mt-2 rounded-lg bg-danger-bg p-3 text-[15px] font-semibold text-danger"
          >
            {errorMessage}
          </div>
        ) : null}
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>닫기</AlertDialogCancel>
          <AlertDialogAction
            onClick={(event) => {
              event.preventDefault()
              onConfirm()
            }}
            disabled={loading}
            className="bg-danger text-white hover:bg-danger/90"
          >
            요청 취소하기
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

function RecommendationGrid({ recommendations }: { recommendations: MatchRecommendation[] }) {
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      {recommendations.map((factory, index) => (
        <article
          key={factory.id}
          className="rounded-2xl border border-border p-5 transition hover:border-brand-light hover:shadow-sm"
        >
          <div className="mb-4 flex items-start justify-between gap-3">
            <div>
              <h3 className="text-kr-pretty text-[16px] font-bold text-foreground">
                공장 매칭 결과 #{index + 1}
              </h3>
              <p className="text-kr-keep mt-1 text-[15px] text-muted-foreground">
                추천 점수 {factory.score}점
              </p>
            </div>
            <Badge variant="info" size="sm" className="text-kr-keep text-[12px]">
              신뢰 {factory.trustScore}점
            </Badge>
          </div>
          <Separator className="mb-4" />
          <dl className="grid grid-cols-2 gap-3 text-[15px]">
            <div className="rounded-xl bg-surface-muted p-3">
              <dt className="text-kr-keep font-semibold text-muted-foreground">예상 견적</dt>
              <dd className="mt-1 font-bold text-ink-950">
                {formatPrice(factory.estimateMin)} ~ {formatPrice(factory.estimateMax)}
              </dd>
            </div>
            <div className="rounded-xl bg-surface-muted p-3">
              <dt className="text-kr-keep font-semibold text-muted-foreground">납기 점수</dt>
              <dd className="mt-1 font-bold text-ink-950">{factory.deliveryScore}점</dd>
            </div>
          </dl>
          <p className="text-kr-pretty mt-4 rounded-xl bg-brand-light p-3 text-[15px] leading-6 text-blue-800">
            {factory.reason}
          </p>
        </article>
      ))}
    </div>
  )
}

function EmptyRecommendation() {
  return (
    <div className="rounded-2xl border border-dashed border-border bg-surface-muted p-8 text-center">
      <Sparkles className="mx-auto h-10 w-10 text-ink-400" />
      <p className="text-kr-pretty mt-3 text-[16px] font-bold text-ink-700">공장 검토 중</p>
      <p className="text-kr-pretty mt-1 text-[15px] text-ink-400">
        공장 검토가 끝나면 이 영역에 매칭 결과가 표시됩니다.
      </p>
    </div>
  )
}

function StateCard({
  icon,
  title,
  description,
  href,
  action,
}: {
  icon: ReactNode
  title: string
  description?: string
  href: string
  action: string
}) {
  return (
    <div className="min-h-screen bg-background">
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-10">
        <Card className="border-border bg-card text-center shadow-ct-soft">
          <CardContent className="p-12">
            <div className="mx-auto flex h-12 w-12 items-center justify-center text-ink-400">
              {icon}
            </div>
            <h1 className="text-kr-pretty mt-4 text-[24px] font-bold text-foreground sm:text-[28px]">
              {title}
            </h1>
            {description ? (
              <p className="text-kr-pretty mt-2 text-[16px] leading-7 text-muted-foreground">
                {description}
              </p>
            ) : null}
            <Button asChild size="lg" className="mt-6 min-h-tap-min">
              <Link href={href}>
                {action}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}

function LoadingDetail() {
  return (
    <div className="min-h-screen bg-background">
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-10">
        <Card className="border-border bg-card shadow-ct-soft">
          <CardContent className="space-y-4 p-8">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-8 w-3/5" />
            <Skeleton className="h-20 w-full" />
          </CardContent>
        </Card>
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
    <Card className="border-border bg-card shadow-ct-soft">
      <CardContent className="p-5">
        <div
          className={cn(
            'mb-3 flex h-10 w-10 items-center justify-center rounded-xl',
            toneClassName,
          )}
        >
          {icon}
        </div>
        <p className="text-kr-keep text-[15px] font-semibold text-muted-foreground">{label}</p>
        <p className="text-kr-pretty mt-2 font-bold text-foreground">{title}</p>
        {subtitle ? (
          <p className="text-kr-keep mt-1 text-[15px] text-muted-foreground">{subtitle}</p>
        ) : null}
      </CardContent>
    </Card>
  )
}

function InfoCell({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-kr-keep text-[15px] font-semibold text-muted-foreground">{label}</dt>
      <dd className="mt-1 font-bold text-ink-950">{value}</dd>
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
    <li className="bg-muted/40 px-4 py-3 first:rounded-t-lg last:rounded-b-lg">
      <div className="flex gap-3">
        {icon}
        <div>
          <p className="text-kr-pretty font-bold text-foreground">{title}</p>
          <p className="text-kr-pretty text-[15px] text-muted-foreground">{description}</p>
        </div>
      </div>
    </li>
  )
}
