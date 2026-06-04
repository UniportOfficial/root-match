'use client'

import { useMemo, useRef, useState, type DragEvent } from 'react'
import { useRouter } from 'next/navigation'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  Brain,
  CalendarDays,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Clock,
  DollarSign,
  FileText,
  RefreshCw,
  Search,
  Sparkles,
  Star,
  Upload,
  X,
  type LucideIcon,
} from 'lucide-react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import type { FactoryRecommendation, QuoteRequestDraft } from '@rootmatching/shared'
import { mockFactoryRecommendations } from '@rootmatching/shared/fixtures/factory-data'
import { AppBadge } from '@/components/ui/AppBadge'
import { AppButton } from '@/components/ui/AppButton'
import { ProcessStepper } from '@/components/ui/ProcessStepper'
import { cn } from '@/lib/cn'
import { useDemoMode } from '@/lib/demo-mode'

const quoteRequestSchema = z.object({
  projectName: z.string().trim().min(1, '프로젝트명을 입력하세요.'),
  processType: z.string().trim().min(1, '공정 유형을 선택하세요.'),
  productItem: z.string().trim().min(1, '제작 품목을 입력하세요.'),
  estimatedQuantity: z.string().trim().min(1, '예상 수량을 입력하세요.'),
  desiredDeadline: z.string().trim().min(1, '희망 납기를 선택하세요.'),
  budgetRange: z.string(),
  detailRequirements: z.string(),
}) satisfies z.ZodType<QuoteRequestDraft>

const initialRequest: QuoteRequestDraft = {
  projectName: '알루미늄 하우징 시제품 제작',
  processType: 'mold',
  productItem: '전장 모듈용 알루미늄 케이스',
  estimatedQuantity: '1차 500개, 양산 월 3,000개',
  desiredDeadline: '2026-05-20',
  budgetRange: '3,000만원 ~ 4,500만원',
  detailRequirements:
    '6061 알루미늄 소재 기준으로 CNC 정밀가공과 표면 아노다이징 처리가 필요합니다. 외관 스크래치 기준이 엄격하며, 초도품 검수 후 양산 전환 예정입니다.',
}

const demoRequest: QuoteRequestDraft = {
  projectName: '알루미늄 하우징 시제품',
  processType: 'surface',
  productItem: '알루미늄 하우징 시제품',
  estimatedQuantity: '초도 5,000개',
  desiredDeadline: '2026-04-30',
  budgetRange: '400만원 ~ 500만원',
  detailRequirements: 'RoHS 준수, 표면 거칠기 Ra 0.8 이하, 안정적 납기 보증 우선',
}

const initialFiles: UploadedFile[] = [
  { name: 'housing_2d_drawing.pdf', size: 2400000, type: 'application/pdf' },
  { name: 'housing_3d_model.step', size: 8200000, type: 'model/step' },
]

const processTypes = [
  { value: 'casting', label: '주조' },
  { value: 'mold', label: '금형' },
  { value: 'forming', label: '소성가공' },
  { value: 'welding', label: '용접' },
  { value: 'surface', label: '표면처리' },
  { value: 'heat', label: '열처리' },
]

const quantityCadenceOptions = [
  { value: '월', label: '월' },
  { value: '분기', label: '분기' },
  { value: '연', label: '연' },
  { value: '일회성', label: '일회성' },
]

const customQuantityUnitValue = 'custom'
const quantityUnitOptions = ['개', '세트', 'EA', '대', 'kg']
const deadlineWeekHeaders = ['1', '2', '3', '4', '5', '6', '7']

const aiCriteria: Array<{ icon: LucideIcon; label: string; description: string }> = [
  {
    icon: Sparkles,
    label: '공정 적합도',
    description: '요청 공정과 공장 전문성 매칭',
  },
  {
    icon: Clock,
    label: '납기 가능성',
    description: '희망 납기 내 제작 가능 여부',
  },
  {
    icon: Star,
    label: '품질 리뷰',
    description: '기존 고객 평가 및 품질 점수',
  },
  {
    icon: RefreshCw,
    label: '재거래율',
    description: '기존 고객과의 재거래 비율',
  },
  {
    icon: DollarSign,
    label: '견적 경쟁력',
    description: '예산 범위 내 합리적 견적',
  },
]

const matchingLoadingSteps = [
  { title: '요청 임베딩 생성 중...', description: '도면·공정·납기 조건을 벡터로 변환합니다.' },
  {
    title: '유사 공장 vector search 중...',
    description: '수도권 공장 프로필과 거래 이력을 검색합니다.',
  },
  { title: 'GPT-4o 추천 분석 중...', description: '품질·납기·거리·재거래 데이터를 종합합니다.' },
  { title: '추천 결과 정리 중...', description: '시연용 Top-N 카드와 추천 사유를 구성합니다.' },
]

interface UploadedFile {
  name: string
  size: number
  type: string
  file?: File
}

interface QuantityDetails {
  firstRun: string
  production: string
  cadence: string
  unit: string
  customUnit: string
}

function padDatePart(value: number): string {
  return String(value).padStart(2, '0')
}

function parseDateString(value: string): Date | null {
  const [year, month, day] = value.split('-').map(Number)

  if (!year || !month || !day) {
    return null
  }

  return new Date(year, month - 1, day)
}

function formatDateLabel(value: string): string {
  const date = parseDateString(value)

  if (!date) {
    return ''
  }

  return `${date.getFullYear()}.${padDatePart(date.getMonth() + 1)}.${padDatePart(date.getDate())}`
}

function parseQuantityDetails(value: string): QuantityDetails {
  const numbers = value.match(/\d[\d,]*/g) ?? []
  const cadence =
    quantityCadenceOptions.find((option) => value.includes(option.value))?.value ?? '월'
  const unitMatches = [...value.matchAll(/\d[\d,]*\s*([^\s,]+)/g)]
  const parsedUnit = unitMatches[unitMatches.length - 1]?.[1] ?? ''
  const unit = quantityUnitOptions.find(
    (nextUnit) => nextUnit === parsedUnit || value.includes(nextUnit),
  )
  const customUnit = unit ? '' : parsedUnit

  return {
    firstRun: numbers[0] ?? '',
    production: numbers[1] ?? '',
    cadence,
    unit: unit ?? (customUnit ? customQuantityUnitValue : '개'),
    customUnit,
  }
}

function formatQuantityValue(value: string, unit: string): string {
  const trimmedValue = value.trim()

  if (!trimmedValue) {
    return ''
  }

  return `${trimmedValue}${unit}`
}

function buildEstimatedQuantity(input: {
  firstRunQuantity: string
  productionQuantity: string
  quantityCadence: string
  selectedQuantityUnit: string
}): string {
  const firstRun = formatQuantityValue(input.firstRunQuantity, input.selectedQuantityUnit)
  const production = formatQuantityValue(input.productionQuantity, input.selectedQuantityUnit)

  if (firstRun && production && input.quantityCadence !== '일회성') {
    return `초도 ${firstRun}, 양산 ${input.quantityCadence} ${production}`
  }

  if (firstRun && production) {
    return `초도 ${firstRun}, 추가 ${production}`
  }

  if (firstRun) {
    return `초도 ${firstRun}`
  }

  if (production && input.quantityCadence !== '일회성') {
    return `양산 ${input.quantityCadence} ${production}`
  }

  return production
}

function parseBudgetRange(value: string): { min: string; max: string } {
  const values = value.match(/\d[\d,]*/g) ?? []

  return {
    min: values[0] ?? '',
    max: values[1] ?? '',
  }
}

function formatBudgetValue(value: string): string {
  const trimmedValue = value.trim()

  if (!trimmedValue) {
    return ''
  }

  return /원$/.test(trimmedValue) ? trimmedValue : `${trimmedValue}만원`
}

function buildBudgetRange(input: { budgetMin: string; budgetMax: string }): string {
  const min = formatBudgetValue(input.budgetMin)
  const max = formatBudgetValue(input.budgetMax)

  if (min && max) {
    return `${min} ~ ${max}`
  }

  if (min) {
    return `${min} 이상`
  }

  if (max) {
    return `${max} 이하`
  }

  return ''
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

const inputClassName =
  'h-14 w-full rounded-xl border border-slate-300 bg-surface px-4 text-lg text-ink-950 outline-none transition placeholder:text-ink-400 focus:border-brand focus:ring-4 focus:ring-brand-light'
const labelClassName = 'mb-2 block text-sm font-semibold text-ink-700'
const errorClassName = 'mt-2 text-sm font-semibold text-danger'

export default function ClientRequestPage() {
  const router = useRouter()
  const isDemoMode = useDemoMode()
  const parsedQuantity = useMemo(() => parseQuantityDetails(initialRequest.estimatedQuantity), [])
  const parsedBudget = useMemo(() => parseBudgetRange(initialRequest.budgetRange), [])
  const [firstRunQuantity, setFirstRunQuantity] = useState(parsedQuantity.firstRun)
  const [productionQuantity, setProductionQuantity] = useState(parsedQuantity.production)
  const [quantityCadence, setQuantityCadence] = useState(parsedQuantity.cadence)
  const [quantityUnit, setQuantityUnit] = useState(parsedQuantity.unit)
  const [customQuantityUnit, setCustomQuantityUnit] = useState(parsedQuantity.customUnit)
  const [budgetMin, setBudgetMin] = useState(parsedBudget.min)
  const [budgetMax, setBudgetMax] = useState(parsedBudget.max)
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>(initialFiles)
  const [isDragging, setIsDragging] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [loadingStep, setLoadingStep] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<QuoteRequestDraft>({
    resolver: zodResolver(quoteRequestSchema),
    defaultValues: initialRequest,
  })

  const desiredDeadline = watch('desiredDeadline')
  const selectedQuantityUnit =
    quantityUnit === customQuantityUnitValue ? customQuantityUnit.trim() : quantityUnit

  function fillDemoRequest() {
    const quantity = parseQuantityDetails(demoRequest.estimatedQuantity)
    const budget = parseBudgetRange(demoRequest.budgetRange)

    setValue('projectName', demoRequest.projectName, { shouldDirty: true, shouldValidate: true })
    setValue('processType', demoRequest.processType, { shouldDirty: true, shouldValidate: true })
    setValue('productItem', demoRequest.productItem, { shouldDirty: true, shouldValidate: true })
    setValue('desiredDeadline', demoRequest.desiredDeadline, {
      shouldDirty: true,
      shouldValidate: true,
    })
    setValue('detailRequirements', demoRequest.detailRequirements, {
      shouldDirty: true,
      shouldValidate: true,
    })
    setFirstRunQuantity(quantity.firstRun)
    setProductionQuantity(quantity.production)
    setQuantityCadence(quantity.cadence)
    setQuantityUnit(quantity.unit)
    setCustomQuantityUnit(quantity.customUnit)
    setBudgetMin(budget.min)
    setBudgetMax(budget.max)
  }

  function wait(ms: number) {
    return new Promise((resolve) => window.setTimeout(resolve, ms))
  }

  function addFiles(fileList: FileList) {
    const nextFiles = Array.from(fileList).map((file) => ({
      name: file.name,
      size: file.size,
      type: file.type,
      file,
    }))

    setUploadedFiles((currentFiles) => [...currentFiles, ...nextFiles])
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault()
    setIsDragging(false)

    if (event.dataTransfer.files.length > 0) {
      addFiles(event.dataTransfer.files)
    }
  }

  function removeFile(indexToRemove: number) {
    setUploadedFiles((currentFiles) => currentFiles.filter((_, index) => index !== indexToRemove))
  }

  async function submitRequest(values: QuoteRequestDraft) {
    setSubmitError(null)
    setLoadingStep(1)
    const estimatedQuantity = buildEstimatedQuantity({
      firstRunQuantity,
      productionQuantity,
      quantityCadence,
      selectedQuantityUnit,
    })
    const budgetRange = buildBudgetRange({ budgetMin, budgetMax })
    const request = quoteRequestSchema.parse({
      ...values,
      estimatedQuantity,
      budgetRange,
    })

    const matchingRequest = fetch(
      `${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'}/matching/recommend`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      },
    )

    try {
      await wait(900)
      setLoadingStep(2)
      await wait(900)
      setLoadingStep(3)

      const response = await matchingRequest

      if (!response.ok) {
        throw new Error('AI 매칭 중 오류가 발생했습니다.')
      }

      const results = (await response.json()) as FactoryRecommendation[]
      await wait(1200)
      setLoadingStep(4)
      await wait(500)
      sessionStorage.setItem(
        'rm:matchingResults',
        JSON.stringify({ results, request, submittedAt: Date.now() }),
      )
      router.push('/matching')
    } catch {
      await wait(700)
      setLoadingStep(4)
      await wait(500)
      sessionStorage.setItem(
        'rm:matchingResults',
        JSON.stringify({ results: mockFactoryRecommendations, request, submittedAt: Date.now() }),
      )
      router.push('/matching?demo=true')
    }
  }

  return (
    <>
      <div className="min-h-screen bg-surface-muted px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <header className="mb-8 rounded-2xl border border-border bg-surface p-6 shadow-sm sm:p-8">
            <AppBadge variant="blue">
              <Sparkles className="h-4 w-4" />
              AI 공장 매칭
            </AppBadge>
            <h1 className="mt-4 text-3xl font-bold tracking-normal text-ink-950 sm:text-4xl">
              수주 의뢰 등록
            </h1>
            <p className="mt-3 max-w-3xl text-lg leading-8 text-ink-700">
              제작 요구사항을 입력하면 AI가 적합한 공장을 추천합니다.
            </p>
            <div className="mt-5 flex flex-wrap items-center gap-3 rounded-2xl border border-brand-light bg-brand-light/50 p-4">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-brand">
                  해커톤 시연 빠른 입력{isDemoMode ? ' · Demo Mode' : ''}
                </p>
                <p className="mt-1 text-sm leading-6 text-ink-700">
                  CNC 절삭 + 표면처리, 5,000개, 4-6주 납기 조건을 한 번에 채웁니다.
                </p>
              </div>
              <AppButton type="button" variant="secondary" size="md" onClick={fillDemoRequest}>
                <Sparkles className="h-4 w-4" />
                예시 데이터로 채우기
              </AppButton>
            </div>
          </header>

          <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
            <main>
              <form
                onSubmit={handleSubmit(submitRequest)}
                className="rounded-2xl border border-border bg-surface p-6 shadow-sm sm:p-8"
              >
                <div className="space-y-6">
                  <div>
                    <label htmlFor="projectName" className={labelClassName}>
                      프로젝트명 <span className="text-danger">*</span>
                    </label>
                    <input
                      id="projectName"
                      type="text"
                      placeholder="예: 2024년 신제품 부품 제작"
                      className={inputClassName}
                      {...register('projectName')}
                    />
                    {errors.projectName && (
                      <p className={errorClassName}>{errors.projectName.message}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="processType" className={labelClassName}>
                      공정 유형 <span className="text-danger">*</span>
                    </label>
                    <select
                      id="processType"
                      className={cn(inputClassName, 'appearance-none')}
                      {...register('processType')}
                    >
                      <option value="" disabled>
                        공정 유형을 선택하세요
                      </option>
                      {processTypes.map((type) => (
                        <option key={type.value} value={type.value}>
                          {type.label}
                        </option>
                      ))}
                    </select>
                    {errors.processType && (
                      <p className={errorClassName}>{errors.processType.message}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="productItem" className={labelClassName}>
                      제작 품목 <span className="text-danger">*</span>
                    </label>
                    <input
                      id="productItem"
                      type="text"
                      placeholder="예: 알루미늄 케이스, 스틸 브라켓"
                      className={inputClassName}
                      {...register('productItem')}
                    />
                    {errors.productItem && (
                      <p className={errorClassName}>{errors.productItem.message}</p>
                    )}
                  </div>

                  <div>
                    <label className={labelClassName}>
                      예상 수량 <span className="text-danger">*</span>
                    </label>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
                      <input
                        id="firstRunQuantity"
                        value={firstRunQuantity}
                        onChange={(event) => setFirstRunQuantity(event.target.value)}
                        type="text"
                        inputMode="numeric"
                        required
                        placeholder="초도 수량"
                        className={inputClassName}
                      />
                      <input
                        id="productionQuantity"
                        value={productionQuantity}
                        onChange={(event) => setProductionQuantity(event.target.value)}
                        type="text"
                        inputMode="numeric"
                        placeholder="양산 수량"
                        className={inputClassName}
                      />
                      <select
                        id="quantityCadence"
                        value={quantityCadence}
                        onChange={(event) => setQuantityCadence(event.target.value)}
                        className={cn(inputClassName, 'appearance-none')}
                        aria-label="양산 주기"
                      >
                        {quantityCadenceOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                      <div className="grid gap-2">
                        <select
                          id="quantityUnit"
                          value={quantityUnit}
                          onChange={(event) => setQuantityUnit(event.target.value)}
                          className={cn(inputClassName, 'appearance-none')}
                          aria-label="단위"
                        >
                          {quantityUnitOptions.map((unit) => (
                            <option key={unit} value={unit}>
                              {unit}
                            </option>
                          ))}
                          <option value={customQuantityUnitValue}>직접 입력</option>
                        </select>
                        {quantityUnit === customQuantityUnitValue && (
                          <input
                            value={customQuantityUnit}
                            onChange={(event) => setCustomQuantityUnit(event.target.value)}
                            type="text"
                            placeholder="단위 입력"
                            className={inputClassName}
                            aria-label="사용자 지정 단위"
                          />
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                    <DeadlinePicker
                      value={desiredDeadline}
                      error={errors.desiredDeadline?.message}
                      onChange={(value) =>
                        setValue('desiredDeadline', value, {
                          shouldValidate: true,
                          shouldDirty: true,
                        })
                      }
                    />
                  </div>

                  <div>
                    <label className={labelClassName}>예산 범위</label>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_auto_1fr] sm:items-center">
                      <div className="relative">
                        <input
                          id="budgetMin"
                          value={budgetMin}
                          onChange={(event) => setBudgetMin(event.target.value)}
                          type="text"
                          inputMode="numeric"
                          placeholder="하한"
                          className={cn(inputClassName, 'pr-12')}
                        />
                        <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sm text-ink-400">
                          만원
                        </span>
                      </div>
                      <span className="hidden text-center text-ink-400 sm:block">~</span>
                      <div className="relative">
                        <input
                          id="budgetMax"
                          value={budgetMax}
                          onChange={(event) => setBudgetMax(event.target.value)}
                          type="text"
                          inputMode="numeric"
                          placeholder="상한"
                          className={cn(inputClassName, 'pr-12')}
                        />
                        <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sm text-ink-400">
                          만원
                        </span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className={labelClassName}>도면/파일 업로드</label>
                    <div
                      onDragOver={(event) => {
                        event.preventDefault()
                        setIsDragging(true)
                      }}
                      onDragLeave={() => setIsDragging(false)}
                      onDrop={handleDrop}
                      onClick={() => fileInputRef.current?.click()}
                      className={cn(
                        'relative cursor-pointer rounded-xl border-2 border-dashed p-6 text-center transition',
                        isDragging
                          ? 'border-brand bg-brand-light'
                          : 'border-border bg-surface-muted hover:border-brand-light',
                      )}
                    >
                      <input
                        ref={fileInputRef}
                        type="file"
                        multiple
                        accept=".pdf,.dwg,.dxf,.step,.stp,.igs,.iges,.jpg,.jpeg,.png"
                        onChange={(event) => {
                          if (event.target.files) {
                            addFiles(event.target.files)
                            event.target.value = ''
                          }
                        }}
                        className="sr-only"
                      />
                      <Upload className="mx-auto mb-3 h-10 w-10 text-ink-400" />
                      <p className="text-sm text-ink-700">
                        파일을 드래그하거나{' '}
                        <span className="font-semibold text-brand">클릭하여 업로드</span>
                      </p>
                      <p className="mt-1 text-xs text-ink-400">
                        PDF, DWG, DXF, STEP, IGES, JPG, PNG (최대 50MB)
                      </p>
                    </div>

                    {uploadedFiles.length > 0 && (
                      <ul className="mt-4 space-y-2">
                        {uploadedFiles.map((file, index) => (
                          <li
                            key={`${file.name}-${file.size}-${index}`}
                            className="flex items-center justify-between rounded-xl border border-border bg-surface-muted p-3"
                          >
                            <div className="flex items-center gap-3">
                              <FileText className="h-5 w-5 text-brand" />
                              <div>
                                <p className="text-sm font-semibold text-ink-700">{file.name}</p>
                                <p className="text-xs text-ink-400">{formatFileSize(file.size)}</p>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => removeFile(index)}
                              className="rounded-full p-1 text-ink-400 transition hover:bg-border hover:text-ink-700"
                              aria-label={`${file.name} 삭제`}
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  <div>
                    <label htmlFor="detailRequirements" className={labelClassName}>
                      상세 요구사항
                    </label>
                    <textarea
                      id="detailRequirements"
                      rows={5}
                      placeholder="추가적인 요구사항이나 특이사항을 입력하세요..."
                      className="w-full resize-none rounded-xl border border-slate-300 bg-surface px-4 py-3 text-lg text-ink-950 outline-none transition placeholder:text-ink-400 focus:border-brand focus:ring-4 focus:ring-brand-light"
                      {...register('detailRequirements')}
                    />
                  </div>

                  {submitError && (
                    <div className="rounded-xl border border-danger/30 bg-danger/10 p-4 text-sm font-semibold text-danger">
                      {submitError}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand px-6 py-4 text-base font-bold text-white transition hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <Sparkles className={cn('h-5 w-5', isSubmitting && 'animate-spin')} />
                    {isSubmitting ? 'AI가 공장을 분석하는 중...' : 'AI 매칭 시작하기'}
                  </button>
                </div>
              </form>
            </main>

            <AICriteriaPanel />
          </div>
        </div>
      </div>
      {isSubmitting && <MatchingLoadingOverlay currentStep={loadingStep} />}
    </>
  )
}

function MatchingLoadingOverlay({ currentStep }: { currentStep: number }) {
  const currentIcon = currentStep === 2 ? Search : currentStep === 3 ? Brain : Sparkles
  const Icon = currentIcon

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-950/70 px-4 backdrop-blur-sm">
      <section className="w-full max-w-4xl overflow-hidden rounded-3xl border border-brand-light bg-surface p-6 shadow-toss-lg sm:p-8">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <AppBadge variant="blue">
              <Sparkles className="h-4 w-4" />
              AI 매칭 엔진 실행
            </AppBadge>
            <h2 className="mt-3 text-2xl font-black text-ink-950 sm:text-3xl">
              요청 조건을 분석해 최적 공장을 찾고 있습니다
            </h2>
            <p className="mt-2 text-base leading-7 text-ink-700">
              벡터 검색과 GPT-4o reasoning 흐름을 시각화한 시연 모드입니다.
            </p>
          </div>
          <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-brand-light shadow-toss-md">
            <Icon className={cn('h-10 w-10 text-brand', currentStep > 0 && 'animate-pulse')} />
          </div>
        </div>
        <ProcessStepper steps={matchingLoadingSteps} currentStep={Math.max(currentStep, 1)} />
      </section>
    </div>
  )
}

function DeadlinePicker({
  value,
  error,
  onChange,
}: {
  value: string
  error?: string
  onChange: (value: string) => void
}) {
  const initialDeadlineDate = parseDateString(value) ?? new Date()
  const [isOpen, setIsOpen] = useState(false)
  const [viewedYear, setViewedYear] = useState(initialDeadlineDate.getFullYear())
  const [viewedMonth, setViewedMonth] = useState(initialDeadlineDate.getMonth())

  const monthLabel = `${viewedYear}.${padDatePart(viewedMonth + 1)}`
  const formattedDeadline = formatDateLabel(value)
  const calendarDays = useMemo(() => {
    const firstDay = new Date(viewedYear, viewedMonth, 1).getDay()
    const daysInMonth = new Date(viewedYear, viewedMonth + 1, 0).getDate()
    const leadingDays = Array.from({ length: firstDay }, () => null)
    const monthDays = Array.from({ length: daysInMonth }, (_, index) => index + 1)

    return [...leadingDays, ...monthDays]
  }, [viewedMonth, viewedYear])

  function changeDeadlineMonth(offset: number) {
    const nextMonth = new Date(viewedYear, viewedMonth + offset, 1)
    setViewedYear(nextMonth.getFullYear())
    setViewedMonth(nextMonth.getMonth())
  }

  function handleDeadlineFocus() {
    const selectedDate = parseDateString(value)

    if (selectedDate) {
      setViewedYear(selectedDate.getFullYear())
      setViewedMonth(selectedDate.getMonth())
    }

    setIsOpen(true)
  }

  function isSelectedDeadlineDay(day: number | null): boolean {
    const selectedDate = parseDateString(value)

    if (!day || !selectedDate) {
      return false
    }

    return (
      selectedDate.getFullYear() === viewedYear &&
      selectedDate.getMonth() === viewedMonth &&
      selectedDate.getDate() === day
    )
  }

  function selectDeadlineDay(day: number | null) {
    if (!day) {
      return
    }

    onChange(`${viewedYear}-${padDatePart(viewedMonth + 1)}-${padDatePart(day)}`)
    setIsOpen(false)
  }

  return (
    <div>
      <label htmlFor="desiredDeadline" className={labelClassName}>
        희망 납기 <span className="text-danger">*</span>
      </label>
      <div className="relative">
        <button
          id="desiredDeadline"
          type="button"
          onClick={handleDeadlineFocus}
          className={cn(
            'flex h-14 w-full items-center justify-between rounded-xl border border-slate-300 bg-surface px-4 text-left text-lg outline-none transition focus:border-brand focus:ring-4 focus:ring-brand-light',
            formattedDeadline ? 'text-ink-950' : 'text-ink-400',
          )}
        >
          <span>{formattedDeadline || 'YYYY.MM.DD'}</span>
          <CalendarDays className="h-5 w-5 text-ink-400" />
        </button>

        {isOpen && (
          <div className="absolute z-20 mt-2 w-full min-w-72 rounded-xl border border-border bg-surface p-3 shadow-xl">
            <div className="mb-3 flex items-center justify-between">
              <button
                type="button"
                onClick={() => changeDeadlineMonth(-1)}
                className="rounded-md p-2 text-ink-400 transition hover:bg-surface-muted hover:text-ink-950"
                aria-label="previous month"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="text-sm font-bold tabular-nums text-ink-950">{monthLabel}</span>
              <button
                type="button"
                onClick={() => changeDeadlineMonth(1)}
                className="rounded-md p-2 text-ink-400 transition hover:bg-surface-muted hover:text-ink-950"
                aria-label="next month"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>

            <div className="grid grid-cols-7 gap-1 text-center text-xs font-bold tabular-nums text-ink-400">
              {deadlineWeekHeaders.map((header) => (
                <span key={header} className="py-1">
                  {header}
                </span>
              ))}
            </div>

            <div className="mt-1 grid grid-cols-7 gap-1">
              {calendarDays.map((day, index) => (
                <button
                  key={`${monthLabel}-${index}`}
                  type="button"
                  disabled={!day}
                  onClick={() => selectDeadlineDay(day)}
                  className={cn(
                    'aspect-square rounded-md text-sm font-semibold tabular-nums transition disabled:pointer-events-none disabled:opacity-0',
                    isSelectedDeadlineDay(day)
                      ? 'bg-brand text-white'
                      : 'text-ink-700 hover:bg-brand-light hover:text-brand',
                  )}
                >
                  {day}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
      {error && <p className={errorClassName}>{error}</p>}
    </div>
  )
}

function AICriteriaPanel() {
  return (
    <aside className="lg:sticky lg:top-8 lg:self-start">
      <div className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <h2 className="text-lg font-bold text-ink-950">AI 추천 기준</h2>
        </div>

        <ul className="space-y-4">
          {aiCriteria.map((criteria) => {
            const Icon = criteria.icon

            return (
              <li
                key={criteria.label}
                className="flex items-start gap-3 rounded-xl p-3 transition hover:bg-surface-muted"
              >
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-brand-light">
                  <Icon className="h-4 w-4 text-brand" />
                </div>
                <div>
                  <h3 className="font-semibold text-ink-950">{criteria.label}</h3>
                  <p className="mt-0.5 text-sm text-ink-400">{criteria.description}</p>
                </div>
              </li>
            )
          })}
        </ul>

        <div className="mt-6 rounded-xl border border-brand-light bg-brand-light/60 p-4">
          <div className="flex items-start gap-2">
            <CheckCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-brand" />
            <p className="text-sm leading-6 text-brand">
              AI가 위 기준을 종합하여 최적의 공장을 추천합니다. 상세한 요구사항을 입력할수록
              정확도가 높아집니다.
            </p>
          </div>
        </div>
      </div>
    </aside>
  )
}
