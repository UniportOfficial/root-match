'use client'

import { Suspense, useMemo, type ChangeEvent } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  AlertTriangle,
  Clock,
  FileText,
  FileWarning,
  Wallet,
  X,
  type LucideIcon,
} from 'lucide-react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { AppBadge } from '@/components/ui/AppBadge'
import { AppButton } from '@/components/ui/AppButton'
import { cn } from '@/lib/cn'

const disputeMediationSchema = z.object({
  disputeType: z.enum(['quality', 'delivery', 'payment', 'contract'], {
    errorMap: () => ({ message: '분쟁 유형을 선택해주세요.' }),
  }),
  transactionId: z.string().min(1, '거래 ID를 입력해주세요.'),
  projectName: z.string().optional(),
  counterparty: z.string().min(1, '거래 상대방을 입력해주세요.'),
  amount: z.string().min(1, '거래 금액을 입력해주세요.'),
  evidenceItems: z.array(z.string()).min(1, '최소 1개 이상의 증빙 항목을 체크해주세요.'),
  evidenceFileNames: z.array(z.string()),
  requestedResolution: z.string().min(10, '요청 해결안을 10자 이상 입력해주세요.'),
})

type DisputeMediation = z.infer<typeof disputeMediationSchema>
type DisputeType = DisputeMediation['disputeType']

const disputeTypeOptions: Array<{
  value: DisputeType
  label: string
  icon: LucideIcon
  iconClassName: string
}> = [
  { value: 'quality', label: '품질 불량', icon: AlertTriangle, iconClassName: 'text-danger' },
  { value: 'delivery', label: '납기 지연', icon: Clock, iconClassName: 'text-warning' },
  { value: 'payment', label: '결제 문제', icon: Wallet, iconClassName: 'text-warning' },
  { value: 'contract', label: '계약 불이행', icon: FileWarning, iconClassName: 'text-violet-600' },
]

const evidenceOptions = [
  '검수 결과서',
  '납품 사진/동영상',
  '메시지/이메일 기록',
  '계약서/견적서',
  '기타 증빙',
]

const inputClassName =
  'h-14 w-full rounded-xl border border-slate-300 bg-surface px-4 text-lg text-ink-950 outline-none transition placeholder:text-ink-400 focus:border-brand focus:ring-4 focus:ring-brand-light'
const labelClassName = 'mb-2 block text-sm font-semibold text-ink-700'
const errorClassName = 'mt-1 text-sm text-danger'
const sectionClassName = 'rounded-2xl border border-border bg-surface p-6 shadow-sm sm:p-8'

export default function DisputeMediationPage() {
  return (
    <Suspense fallback={<DisputeMediationShell />}>
      <DisputeMediationForm />
    </Suspense>
  )
}

function DisputeMediationForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const transactionId = useMemo(() => searchParams.get('txn') ?? '', [searchParams])
  const projectName = useMemo(() => searchParams.get('projectName') ?? '', [searchParams])
  const counterparty = useMemo(() => searchParams.get('counterparty') ?? '', [searchParams])
  const amount = useMemo(() => searchParams.get('amount') ?? '', [searchParams])

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<DisputeMediation>({
    resolver: zodResolver(disputeMediationSchema),
    defaultValues: {
      transactionId,
      projectName,
      counterparty,
      amount,
      evidenceItems: [],
      evidenceFileNames: [],
      requestedResolution: '',
    },
  })

  const selectedDisputeType = watch('disputeType')
  const evidenceItems = watch('evidenceItems')
  const evidenceFileNames = watch('evidenceFileNames')

  function selectDisputeType(value: DisputeType) {
    setValue('disputeType', value, { shouldDirty: true, shouldValidate: true })
  }

  function toggleEvidenceItem(item: string, checked: boolean) {
    const nextItems = checked
      ? [...evidenceItems, item]
      : evidenceItems.filter((currentItem) => currentItem !== item)

    setValue('evidenceItems', nextItems, { shouldDirty: true, shouldValidate: true })
  }

  function addEvidenceFiles(event: ChangeEvent<HTMLInputElement>) {
    const files = event.target.files

    if (!files) {
      return
    }

    setValue(
      'evidenceFileNames',
      [...evidenceFileNames, ...Array.from(files, (file) => file.name)],
      {
        shouldDirty: true,
        shouldValidate: true,
      },
    )
    event.target.value = ''
  }

  function removeEvidenceFile(fileIndex: number) {
    setValue(
      'evidenceFileNames',
      evidenceFileNames.filter((_, index) => index !== fileIndex),
      { shouldDirty: true, shouldValidate: true },
    )
  }

  function submitDisputeMediation() {
    router.push('/disputes')
  }

  return (
    <div className="min-h-screen bg-surface-muted px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl">
        <header className="mb-8 rounded-2xl border border-border bg-surface p-6 shadow-sm sm:p-8">
          <AppBadge variant="amber" className="mb-4 px-4 py-2 text-sm font-semibold">
            <AlertTriangle className="h-4 w-4" />
            분쟁 중재 신청
          </AppBadge>
          <h1 className="text-3xl font-bold tracking-normal text-ink-950 sm:text-4xl">
            분쟁 중재 신청
          </h1>
          <p className="mt-3 text-lg leading-8 text-ink-700">
            거래에 문제가 발생했나요? 중재팀이 신속하게 검토해드립니다.
          </p>
        </header>

        <form onSubmit={handleSubmit(submitDisputeMediation)} className="space-y-6">
          <section className={sectionClassName}>
            <SectionHeader title="분쟁 유형" description="발생한 문제 유형을 선택하세요." />
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {disputeTypeOptions.map((option) => {
                const Icon = option.icon
                const isSelected = selectedDisputeType === option.value

                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => selectDisputeType(option.value)}
                    className={cn(
                      'flex cursor-pointer items-start gap-3 rounded-2xl border-2 p-5 text-left transition',
                      isSelected
                        ? 'border-brand bg-brand-light/30'
                        : 'border-border hover:border-brand-light',
                    )}
                  >
                    <Icon className={cn('mt-0.5 h-6 w-6 shrink-0', option.iconClassName)} />
                    <span className="text-lg font-bold text-ink-950">{option.label}</span>
                  </button>
                )
              })}
            </div>
            {errors.disputeType && <p className={errorClassName}>{errors.disputeType.message}</p>}
          </section>

          <section className={sectionClassName}>
            <SectionHeader title="거래 정보" />
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div>
                <label htmlFor="transactionId" className={labelClassName}>
                  거래 ID
                </label>
                <input
                  id="transactionId"
                  type="text"
                  className={inputClassName}
                  {...register('transactionId')}
                />
                {errors.transactionId && (
                  <p className={errorClassName}>{errors.transactionId.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="counterparty" className={labelClassName}>
                  거래 상대방
                </label>
                <input
                  id="counterparty"
                  type="text"
                  className={inputClassName}
                  {...register('counterparty')}
                />
                {errors.counterparty && (
                  <p className={errorClassName}>{errors.counterparty.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="projectName" className={labelClassName}>
                  프로젝트명
                </label>
                <input
                  id="projectName"
                  type="text"
                  placeholder="예: 알루미늄 하우징 시제품"
                  className={inputClassName}
                  {...register('projectName')}
                />
              </div>

              <div>
                <label htmlFor="amount" className={labelClassName}>
                  거래 금액
                </label>
                <input
                  id="amount"
                  type="text"
                  placeholder="예: 4,200,000원"
                  className={inputClassName}
                  {...register('amount')}
                />
                {errors.amount && <p className={errorClassName}>{errors.amount.message}</p>}
              </div>

              <div>
                <label htmlFor="contractDate" className={labelClassName}>
                  계약 일자
                </label>
                <input
                  id="contractDate"
                  type="text"
                  placeholder="예: 2026.04.28"
                  className={inputClassName}
                />
              </div>
            </div>
          </section>

          <section className={sectionClassName}>
            <SectionHeader
              title="증빙 자료"
              description="관련 자료를 체크하고 파일을 첨부하세요."
            />
            <div className="space-y-3">
              {evidenceOptions.map((item) => (
                <label key={item} className="flex cursor-pointer items-center gap-3">
                  <input
                    type="checkbox"
                    checked={evidenceItems.includes(item)}
                    onChange={(event) => toggleEvidenceItem(item, event.target.checked)}
                    className="h-5 w-5 rounded border-slate-300 accent-brand"
                  />
                  <span className="text-base font-semibold text-ink-700">{item}</span>
                </label>
              ))}
            </div>
            {errors.evidenceItems && (
              <p className={errorClassName}>{errors.evidenceItems.message}</p>
            )}

            <div className="mt-6">
              <label htmlFor="evidenceFileNames" className={labelClassName}>
                파일 첨부
              </label>
              <input
                id="evidenceFileNames"
                type="file"
                multiple
                onChange={addEvidenceFiles}
                className="block w-full cursor-pointer rounded-xl border border-dashed border-border bg-surface-muted px-4 py-4 text-sm font-semibold text-ink-700 file:mr-4 file:rounded-lg file:border-0 file:bg-brand file:px-4 file:py-2 file:text-sm file:font-bold file:text-white hover:border-brand-light"
              />
              <p className="mt-2 text-sm text-ink-400">여기에 파일을 첨부하세요.</p>

              {evidenceFileNames.length > 0 && (
                <ul className="mt-4 space-y-2">
                  {evidenceFileNames.map((fileName, index) => (
                    <li
                      key={`${fileName}-${index}`}
                      className="flex items-center justify-between gap-3 rounded-xl border border-border bg-surface-muted p-3"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <FileText className="h-5 w-5 shrink-0 text-brand" />
                        <span className="truncate text-sm font-semibold text-ink-700">
                          {fileName}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeEvidenceFile(index)}
                        className="rounded-full p-1 text-ink-400 transition hover:bg-border hover:text-ink-700"
                        aria-label={`${fileName} 삭제`}
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>

          <section className={sectionClassName}>
            <SectionHeader title="요청 해결안" />
            <textarea
              id="requestedResolution"
              rows={5}
              placeholder="원하는 해결 방향을 구체적으로 작성해주세요 (10자 이상)..."
              className="w-full resize-none rounded-xl border border-slate-300 bg-surface px-4 py-3 text-lg text-ink-950 outline-none transition placeholder:text-ink-400 focus:border-brand focus:ring-4 focus:ring-brand-light"
              {...register('requestedResolution')}
            />
            {errors.requestedResolution && (
              <p className={errorClassName}>{errors.requestedResolution.message}</p>
            )}
          </section>

          <section className={sectionClassName}>
            <AppButton type="submit" variant="primary" size="lg" fullWidth disabled={isSubmitting}>
              분쟁 중재 신청
            </AppButton>
          </section>
        </form>
      </div>
    </div>
  )
}

function DisputeMediationShell() {
  return (
    <div className="min-h-screen bg-surface-muted px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl">
        <header className="mb-8 rounded-2xl border border-border bg-surface p-6 shadow-sm sm:p-8">
          <AppBadge variant="amber" className="mb-4 px-4 py-2 text-sm font-semibold">
            <AlertTriangle className="h-4 w-4" />
            분쟁 중재 신청
          </AppBadge>
          <h1 className="text-3xl font-bold tracking-normal text-ink-950 sm:text-4xl">
            분쟁 중재 신청
          </h1>
          <p className="mt-3 text-lg leading-8 text-ink-700">
            거래에 문제가 발생했나요? 중재팀이 신속하게 검토해드립니다.
          </p>
        </header>

        <div className="rounded-2xl border border-border bg-surface p-6 shadow-sm sm:p-8">
          <p className="text-base font-semibold text-ink-700">
            분쟁 중재 신청 양식을 불러오는 중입니다.
          </p>
        </div>
      </div>
    </div>
  )
}

function SectionHeader({ title, description }: { title: string; description?: string }) {
  return (
    <div className="mb-5">
      <h2 className="text-2xl font-bold text-ink-950">{title}</h2>
      {description && <p className="mt-2 text-base leading-7 text-ink-700">{description}</p>}
    </div>
  )
}
