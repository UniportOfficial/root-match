'use client'

import Link from 'next/link'
import { useState, type ChangeEvent } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  ArrowRight,
  Building2,
  Camera,
  CheckCircle,
  Factory,
  Plus,
  Trash2,
  Upload,
  X,
} from 'lucide-react'
import { AppBadge } from '@/components/ui/AppBadge'
import { AppButton } from '@/components/ui/AppButton'
import { cn } from '@/lib/cn'

const basicInfoSchema = z.object({
  factoryName: z.string().min(1, '공장명을 입력해주세요.'),
  ownerName: z.string().min(1, '담당자 이름을 입력해주세요.'),
  location: z.string().min(1, '위치를 입력해주세요.'),
  contactPhone: z.string().min(1, '연락처를 입력해주세요.'),
  contactEmail: z.string().email('올바른 이메일 형식이 아닙니다.').or(z.literal('')),
  website: z.string().url('올바른 URL을 입력해주세요.').or(z.literal('')),
  description: z.string().max(1000, '소개는 1000자 이내로 입력해주세요.').or(z.literal('')),
})

type BasicInfo = z.infer<typeof basicInfoSchema>

interface ProductionItem {
  id: string
  productName: string
  monthlyCapacity: string
  notes: string
}

interface PortfolioImage {
  id: string
  name: string
  url: string
  size: number
}

const BASE_PROCESSES = [
  '금형',
  '소성가공',
  '주조',
  '용접',
  '표면처리',
  '열처리',
  'CNC 정밀가공',
  '판금/제관',
  '도장',
] as const

const inputClassName =
  'h-12 w-full rounded-xl border border-slate-300 px-4 outline-none transition focus:border-brand focus:ring-4 focus:ring-brand-light'
const textareaClassName =
  'w-full resize-none rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-brand focus:ring-4 focus:ring-brand-light'
const labelClassName = 'mb-2 block text-sm font-semibold text-ink-700'

const initialBasicInfo: BasicInfo = {
  factoryName: '',
  ownerName: '',
  location: '',
  contactPhone: '',
  contactEmail: '',
  website: '',
  description: '',
}

function getNextProductionId(productionItems: ProductionItem[]): string {
  const nextNumber =
    Math.max(0, ...productionItems.map((item) => parseInt(item.id.replace('p-', ''), 10))) + 1

  return `p-${nextNumber}`
}

function RequiredMark() {
  return <span className="text-danger ml-1">*</span>
}

export default function FactoryOnboardingPage() {
  const {
    register: registerBasic,
    handleSubmit: handleSubmitBasic,
    formState: { errors: basicErrors },
  } = useForm<BasicInfo>({
    defaultValues: initialBasicInfo,
    resolver: zodResolver(basicInfoSchema),
  })
  const [selectedProcesses, setSelectedProcesses] = useState<string[]>([])
  const [customProcesses, setCustomProcesses] = useState<string[]>([])
  const [customProcessInput, setCustomProcessInput] = useState('')
  const [productionItems, setProductionItems] = useState<ProductionItem[]>([
    { id: 'p-1', productName: '', monthlyCapacity: '', notes: '' },
  ])
  const [portfolioImages, setPortfolioImages] = useState<PortfolioImage[]>([])
  const [equipment, setEquipment] = useState('')
  const [certifications, setCertifications] = useState('')
  const [savedAt, setSavedAt] = useState<string | null>(null)

  function toggleProcess(process: string) {
    setSelectedProcesses((current) =>
      current.includes(process)
        ? current.filter((item) => item !== process)
        : [...current, process],
    )
  }

  function addCustomProcess() {
    const nextProcess = customProcessInput.trim()

    if (!nextProcess || customProcesses.includes(nextProcess)) {
      setCustomProcessInput('')
      return
    }

    setCustomProcesses((current) => [...current, nextProcess])
    setSelectedProcesses((current) =>
      current.includes(nextProcess) ? current : [...current, nextProcess],
    )
    setCustomProcessInput('')
  }

  function removeCustomProcess(process: string) {
    setCustomProcesses((current) => current.filter((item) => item !== process))
    setSelectedProcesses((current) => current.filter((item) => item !== process))
  }

  function updateProductionItem(
    id: string,
    field: keyof Omit<ProductionItem, 'id'>,
    value: string,
  ) {
    setProductionItems((current) =>
      current.map((item) => (item.id === id ? { ...item, [field]: value } : item)),
    )
  }

  function addProductionItem() {
    setProductionItems((current) => [
      ...current,
      {
        id: getNextProductionId(current),
        productName: '',
        monthlyCapacity: '',
        notes: '',
      },
    ])
  }

  function removeProductionItem(id: string) {
    setProductionItems((current) => current.filter((item) => item.id !== id))
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? [])
    const nextImages = files
      .filter((file) => file.type.startsWith('image/'))
      .map((file, index) => ({
        id: `img-${Date.now()}-${index}`,
        name: file.name,
        url: URL.createObjectURL(file),
        size: file.size,
      }))

    if (nextImages.length) {
      setPortfolioImages((current) => [...current, ...nextImages])
    }

    event.target.value = ''
  }

  function removePortfolioImage(id: string) {
    setPortfolioImages((current) => {
      const removedImage = current.find((image) => image.id === id)

      if (removedImage) {
        URL.revokeObjectURL(removedImage.url)
      }

      return current.filter((image) => image.id !== id)
    })
  }

  function submitOnboarding(values: BasicInfo) {
    void values
    setSavedAt(new Date().toISOString())
  }

  return (
    <div className="px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <header className="mb-8 rounded-2xl border border-border bg-white p-6 shadow-sm sm:p-8">
          <AppBadge variant="blue">
            <Factory className="h-4 w-4" />
            공장 프로필 등록
          </AppBadge>
          <h1 className="mt-4 text-3xl font-bold text-ink-950 sm:text-4xl">공장 프로필 등록</h1>
          <p className="mt-3 text-base leading-7 text-ink-700">
            공장 정보를 입력하면 발주처에게 우리 공장의 강점을 정확히 전달할 수 있습니다.
          </p>
        </header>

        {savedAt && (
          <div className="mb-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-emerald-700">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex gap-3">
                <CheckCircle className="mt-0.5 h-5 w-5 shrink-0" />
                <p className="font-semibold">
                  프로필이 저장되었습니다. 이제 견적 요청을 받을 준비가 되었습니다.
                </p>
              </div>
              <Link
                href="/factory/requests"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-emerald-700"
              >
                내 받은 요청 보러가기
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmitBasic(submitOnboarding)}>
          <section className="mb-6 rounded-2xl border border-border bg-white p-6 shadow-sm sm:p-8">
            <div className="mb-6 flex items-start gap-3">
              <div className="rounded-xl bg-brand-light p-3 text-brand">
                <Building2 className="h-5 w-5" />
              </div>
              <div>
                <h2 className="mb-1 text-2xl font-bold text-ink-950">기본 정보</h2>
                <p className="text-base text-ink-700">
                  발주처가 공장을 신뢰하고 연락할 수 있는 기본 정보를 입력하세요.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <label>
                <span className={labelClassName}>
                  공장명
                  <RequiredMark />
                </span>
                <input {...registerBasic('factoryName')} className={inputClassName} />
                {basicErrors.factoryName ? (
                  <p className="mt-1 text-sm text-danger">{basicErrors.factoryName.message}</p>
                ) : null}
              </label>

              <label>
                <span className={labelClassName}>
                  담당자
                  <RequiredMark />
                </span>
                <input {...registerBasic('ownerName')} className={inputClassName} />
                {basicErrors.ownerName ? (
                  <p className="mt-1 text-sm text-danger">{basicErrors.ownerName.message}</p>
                ) : null}
              </label>

              <label>
                <span className={labelClassName}>
                  위치
                  <RequiredMark />
                </span>
                <input {...registerBasic('location')} className={inputClassName} />
                {basicErrors.location ? (
                  <p className="mt-1 text-sm text-danger">{basicErrors.location.message}</p>
                ) : null}
              </label>

              <label>
                <span className={labelClassName}>
                  연락처
                  <RequiredMark />
                </span>
                <input {...registerBasic('contactPhone')} className={inputClassName} />
                {basicErrors.contactPhone ? (
                  <p className="mt-1 text-sm text-danger">{basicErrors.contactPhone.message}</p>
                ) : null}
              </label>

              <label>
                <span className={labelClassName}>이메일</span>
                <input type="email" {...registerBasic('contactEmail')} className={inputClassName} />
                {basicErrors.contactEmail ? (
                  <p className="mt-1 text-sm text-danger">{basicErrors.contactEmail.message}</p>
                ) : null}
              </label>

              <label>
                <span className={labelClassName}>웹사이트</span>
                <input type="url" {...registerBasic('website')} className={inputClassName} />
                {basicErrors.website ? (
                  <p className="mt-1 text-sm text-danger">{basicErrors.website.message}</p>
                ) : null}
              </label>

              <label className="sm:col-span-2">
                <span className={labelClassName}>공장 소개</span>
                <textarea
                  rows={4}
                  {...registerBasic('description')}
                  className={textareaClassName}
                />
              </label>
            </div>
          </section>

          <section className="mb-6 rounded-2xl border border-border bg-white p-6 shadow-sm sm:p-8">
            <h2 className="mb-1 text-2xl font-bold text-ink-950">주요 공정</h2>
            <p className="mb-6 text-base text-ink-700">
              취급 가능한 뿌리공정을 선택하세요. 기타 공정은 직접 추가할 수 있습니다.
            </p>

            <div className="mb-6 flex flex-wrap gap-2">
              {BASE_PROCESSES.map((process) => {
                const isSelected = selectedProcesses.includes(process)

                return (
                  <button
                    key={process}
                    type="button"
                    onClick={() => toggleProcess(process)}
                    className={cn(
                      'inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition',
                      isSelected
                        ? 'border-brand bg-brand-light text-brand'
                        : 'border-border bg-white text-ink-700 hover:border-brand-light',
                    )}
                  >
                    {process}
                  </button>
                )
              })}
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <input
                value={customProcessInput}
                onChange={(event) => setCustomProcessInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.preventDefault()
                    addCustomProcess()
                  }
                }}
                placeholder="기타 공정 추가"
                className={inputClassName}
              />
              <AppButton type="button" variant="secondary" size="lg" onClick={addCustomProcess}>
                <Plus className="h-4 w-4" />
                추가
              </AppButton>
            </div>

            {customProcesses.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {customProcesses.map((process) => (
                  <span
                    key={process}
                    className="inline-flex items-center gap-2 rounded-full border border-brand-light bg-brand-light px-4 py-2 text-sm font-semibold text-brand"
                  >
                    {process}
                    <button
                      type="button"
                      onClick={() => removeCustomProcess(process)}
                      className="rounded-full p-0.5 transition hover:bg-white"
                      aria-label={`${process} 삭제`}
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </section>

          <section className="mb-6 rounded-2xl border border-border bg-white p-6 shadow-sm sm:p-8">
            <h2 className="mb-1 text-2xl font-bold text-ink-950">설비 및 인증</h2>
            <p className="mb-6 text-base text-ink-700">
              보유 설비와 인증 정보를 쉼표로 구분해 입력하세요.
            </p>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <label>
                <span className={labelClassName}>설비</span>
                <input
                  value={equipment}
                  onChange={(event) => setEquipment(event.target.value)}
                  placeholder="CNC 5축, 레이저 커팅기, 도장 부스"
                  className={inputClassName}
                />
              </label>

              <label>
                <span className={labelClassName}>인증/자격</span>
                <input
                  value={certifications}
                  onChange={(event) => setCertifications(event.target.value)}
                  placeholder="ISO 9001, 뿌리기업 확인서"
                  className={inputClassName}
                />
              </label>
            </div>
          </section>

          <section className="mb-6 rounded-2xl border border-border bg-white p-6 shadow-sm sm:p-8">
            <h2 className="mb-1 text-2xl font-bold text-ink-950">제품별 생산 가능량</h2>
            <p className="mb-6 text-base text-ink-700">
              주요 품목별 월 생산 가능량을 입력해 발주처가 양산 규모를 판단하게 도와주세요.
            </p>

            <div className="space-y-3">
              {productionItems.map((item) => (
                <div
                  key={item.id}
                  className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_1fr_1fr_auto]"
                >
                  <label>
                    <span className={labelClassName}>제품명</span>
                    <input
                      value={item.productName}
                      onChange={(event) =>
                        updateProductionItem(item.id, 'productName', event.target.value)
                      }
                      className={inputClassName}
                    />
                  </label>
                  <label>
                    <span className={labelClassName}>월 생산 가능량</span>
                    <input
                      value={item.monthlyCapacity}
                      onChange={(event) =>
                        updateProductionItem(item.id, 'monthlyCapacity', event.target.value)
                      }
                      className={inputClassName}
                    />
                  </label>
                  <label>
                    <span className={labelClassName}>비고</span>
                    <input
                      value={item.notes}
                      onChange={(event) =>
                        updateProductionItem(item.id, 'notes', event.target.value)
                      }
                      className={inputClassName}
                    />
                  </label>
                  <button
                    type="button"
                    onClick={() => removeProductionItem(item.id)}
                    className="mt-7 inline-flex h-12 items-center justify-center rounded-xl border border-border px-4 text-ink-700 transition hover:border-red-200 hover:bg-red-50 hover:text-danger"
                    aria-label={`${item.id} 행 삭제`}
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                </div>
              ))}
            </div>

            <AppButton
              type="button"
              variant="secondary"
              className="mt-5"
              onClick={addProductionItem}
            >
              <Plus className="h-4 w-4" />행 추가
            </AppButton>
          </section>

          <section className="mb-6 rounded-2xl border border-border bg-white p-6 shadow-sm sm:p-8">
            <div className="mb-6 flex items-start gap-3">
              <div className="rounded-xl bg-brand-light p-3 text-brand">
                <Camera className="h-5 w-5" />
              </div>
              <div>
                <h2 className="mb-1 text-2xl font-bold text-ink-950">포트폴리오 이미지</h2>
                <p className="text-base text-ink-700">
                  설비, 생산품, 작업 현장 이미지를 추가해 공장 역량을 시각적으로 보여주세요.
                </p>
              </div>
            </div>

            <input
              type="file"
              multiple
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
              id="portfolio-files"
            />
            <label
              htmlFor="portfolio-files"
              className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border bg-surface-muted px-6 py-10 text-center transition hover:border-brand-light hover:bg-brand-light/30"
            >
              <Upload className="mb-3 h-8 w-8 text-brand" />
              <span className="text-base font-bold text-ink-950">이미지 추가</span>
              <span className="mt-1 text-sm text-ink-700">
                여기에 이미지를 드래그하거나 클릭해서 선택
              </span>
            </label>

            {portfolioImages.length > 0 && (
              <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
                {portfolioImages.map((image) => (
                  <figure
                    key={image.id}
                    className="group relative overflow-hidden rounded-2xl border border-border bg-surface-muted"
                  >
                    <img src={image.url} alt={image.name} className="h-36 w-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removePortfolioImage(image.id)}
                      className="absolute right-2 top-2 inline-flex h-8 w-8 items-center justify-center rounded-full bg-ink-950/70 text-white opacity-100 transition hover:bg-danger md:opacity-0 md:group-hover:opacity-100"
                      aria-label={`${image.name} 삭제`}
                    >
                      <X className="h-4 w-4" />
                    </button>
                    <figcaption className="truncate px-3 py-2 text-xs font-semibold text-ink-700">
                      {image.name}
                    </figcaption>
                  </figure>
                ))}
              </div>
            )}
          </section>

          <div className="rounded-2xl border border-border bg-white p-5 shadow-sm">
            <AppButton type="submit" size="lg" fullWidth>
              공장 프로필 저장
            </AppButton>
          </div>
        </form>
      </div>
    </div>
  )
}
