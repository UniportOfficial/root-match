'use client'

import { useMemo, useState, type ReactNode } from 'react'
import { useForm, type UseFormRegisterReturn } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import type { Company, CompanyPortfolioItem } from '@rootmatching/shared'
import { Loader2, PencilLine, RotateCcw, Save } from 'lucide-react'
import { cn } from '@/lib/cn'
import { useCompaniesDispatch, useCompaniesState } from '@/state/CompaniesContext'
import { useUserDispatch, useUserState } from '@/state/UserContext'

const profileSchema = z.object({
  name: z.string().min(1, '회사명을 입력해주세요.'),
  industry: z.string().min(1, '업종을 선택해주세요.'),
  region: z.string().min(1, '지역을 선택해주세요.'),
  size: z.string().min(1, '기업 규모를 선택해주세요.'),
  headline: z
    .string()
    .max(120, '한 줄 소개는 120자 이내로 입력해주세요.')
    .optional()
    .or(z.literal('')),
  description: z
    .string()
    .max(1000, '회사 소개는 1000자 이내로 입력해주세요.')
    .optional()
    .or(z.literal('')),
  contactEmail: z.string().email('올바른 이메일 형식이 아닙니다.').or(z.literal('')),
  contactPhone: z.string().optional().or(z.literal('')),
  website: z.string().url('올바른 URL을 입력해주세요.').or(z.literal('')),
  tags: z.string().optional().or(z.literal('')),
  strengths: z.string().optional().or(z.literal('')),
  certifications: z.string().optional().or(z.literal('')),
  establishedYear: z
    .string()
    .regex(/^\d{0,4}$/, '연도는 숫자로 입력해주세요.')
    .optional()
    .or(z.literal('')),
  employeeCount: z.string().regex(/^\d+$/, '직원 수는 숫자로 입력해주세요.').or(z.literal('')),
  revenue: z.string().optional().or(z.literal('')),
  profileColor: z.string().regex(/^#[0-9a-fA-F]{6}$/, '컬러 코드를 선택해주세요.'),
  portfolioTitle1: z.string().optional().or(z.literal('')),
  portfolioDescription1: z.string().optional().or(z.literal('')),
  portfolioTitle2: z.string().optional().or(z.literal('')),
  portfolioDescription2: z.string().optional().or(z.literal('')),
})

type ProfileFormValues = z.infer<typeof profileSchema>

interface ProfileColor {
  label: string
  value: string
}

const profileColors: ProfileColor[] = [
  { label: 'Blue', value: '#4f66e5' },
  { label: 'Green', value: '#059669' },
  { label: 'Slate', value: '#475569' },
  { label: 'Rose', value: '#e11d48' },
  { label: 'Amber', value: '#d97706' },
]
const defaultProfileColor = '#4f66e5'

const industries = ['자동차', '전자부품', '기계장비', '금속가공', '소재/화학', '의료기기']
const regions = ['서울', '경기', '인천', '충청', '경상', '전라', '강원', '제주']
const companySizes = ['1-9명', '10-49명', '50-99명', '100-299명', '300명 이상']

const initialProfile: ProfileFormValues = {
  name: '루트테크',
  industry: '전자부품',
  region: '서울',
  size: '10-49명',
  headline: 'AI 기반 제조 품질 분석 솔루션을 제공합니다',
  description:
    '루트테크는 제조 현장의 품질 데이터를 분석해 불량률을 낮추고, 뿌리산업 파트너와 안정적인 양산 협업을 만드는 기술 기업입니다.',
  contactEmail: 'contact@roottech.example',
  contactPhone: '02-1234-5678',
  website: 'https://roottech.example',
  tags: 'AI, 제조, B2B, 품질 분석',
  strengths: '빠른 응답, 품질 관리, 데이터 분석, 양산 전환',
  certifications: 'ISO 9001, 벤처기업인증',
  establishedYear: '2022',
  employeeCount: '18',
  revenue: '50억원',
  profileColor: defaultProfileColor,
  portfolioTitle1: '전장 모듈 품질 분석 PoC',
  portfolioDescription1: '알루미늄 하우징 검수 데이터를 분석해 초도 불량률을 23% 낮췄습니다.',
  portfolioTitle2: 'CNC 협력사 납기 관리 구축',
  portfolioDescription2:
    '협력 공장 생산 일정을 통합해 납기 지연 알림과 재발주 흐름을 자동화했습니다.',
}

const inputClassName =
  'h-14 w-full rounded-xl border border-slate-300 bg-surface px-4 text-lg text-ink-950 outline-none transition placeholder:text-ink-400 focus:border-brand focus:ring-4 focus:ring-brand-light disabled:cursor-not-allowed disabled:bg-surface-muted disabled:opacity-75'
const textareaClassName =
  'w-full resize-none rounded-xl border border-slate-300 bg-surface px-4 py-3 text-lg text-ink-950 outline-none transition placeholder:text-ink-400 focus:border-brand focus:ring-4 focus:ring-brand-light disabled:cursor-not-allowed disabled:bg-surface-muted disabled:opacity-75'
const labelClassName = 'mb-2 block text-sm font-semibold text-ink-700'

function splitList(value: string): string[] {
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
}

function buildPortfolio(values: ProfileFormValues) {
  return [
    {
      title: (values.portfolioTitle1 ?? '').trim(),
      description: (values.portfolioDescription1 ?? '').trim(),
    },
    {
      title: (values.portfolioTitle2 ?? '').trim(),
      description: (values.portfolioDescription2 ?? '').trim(),
    },
  ].filter((item) => item.title || item.description)
}

function buildCompanyPayload(
  baseCompany: Company,
  values: ProfileFormValues,
): { company: Company; portfolio: CompanyPortfolioItem[] } {
  const portfolio: CompanyPortfolioItem[] = [
    {
      title: (values.portfolioTitle1 ?? '').trim(),
      description: (values.portfolioDescription1 ?? '').trim(),
    },
    {
      title: (values.portfolioTitle2 ?? '').trim(),
      description: (values.portfolioDescription2 ?? '').trim(),
    },
  ].filter((item) => item.title || item.description)

  const employeeCount = Number(values.employeeCount ?? '0') || baseCompany.employeeCount
  const establishedYear = Number(values.establishedYear ?? '0') || baseCompany.establishedYear

  return {
    portfolio,
    company: {
      ...baseCompany,
      name: values.name.trim() || baseCompany.name,
      industry: values.industry,
      region: values.region,
      size: values.size,
      description: values.description?.trim() || baseCompany.description,
      headline: values.headline?.trim() || baseCompany.headline,
      profileColor: values.profileColor,
      tags: splitList(values.tags ?? ''),
      strengths: splitList(values.strengths ?? ''),
      certifications: splitList(values.certifications ?? ''),
      contactEmail: values.contactEmail || baseCompany.contactEmail,
      contactPhone: values.contactPhone || baseCompany.contactPhone,
      website: values.website || baseCompany.website,
      establishedYear,
      employeeCount,
      revenue: values.revenue || baseCompany.revenue,
      portfolio,
    },
  }
}

export default function MyPageProfilePage() {
  const userState = useUserState()
  const userDispatch = useUserDispatch()
  const companiesDispatch = useCompaniesDispatch()
  const { companies } = useCompaniesState()
  const [isEditing, setIsEditing] = useState(false)
  const [savedProfile, setSavedProfile] = useState<ProfileFormValues>(initialProfile)
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { isSubmitting },
  } = useForm<ProfileFormValues>({
    defaultValues: initialProfile,
    resolver: zodResolver(profileSchema),
  })
  const formData = watch()

  const initials = useMemo(() => formData.name.slice(0, 2) || '회사', [formData.name])
  const previewTags = useMemo(() => splitList(formData.tags ?? '').slice(0, 4), [formData.tags])
  const previewStrengths = useMemo(
    () => splitList(formData.strengths ?? '').slice(0, 4),
    [formData.strengths],
  )
  const previewCertifications = useMemo(
    () => splitList(formData.certifications ?? ''),
    [formData.certifications],
  )
  const previewPortfolio = useMemo(() => buildPortfolio(formData), [formData])

  function startEditing() {
    setIsEditing(true)
  }

  function cancelEditing() {
    reset(savedProfile)
    setIsEditing(false)
  }

  async function saveProfile(values: ProfileFormValues) {
    await new Promise((resolve) => setTimeout(resolve, 200))
    const baseCompany = userState.currentUser?.company ?? companies[0] ?? null
    if (baseCompany) {
      const { company } = buildCompanyPayload(baseCompany, values)
      userDispatch({ type: 'user/updateCompany', payload: company })
      companiesDispatch({ type: 'companies/updateCompany', payload: company })
    }
    setSavedProfile(values)
    reset(values)
    setIsEditing(false)
  }

  return (
    <div className="min-h-screen bg-surface-muted px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-7xl gap-6">
        <section className="grid gap-4">
          <div
            className="grid items-center gap-5 rounded-2xl border border-border border-l-[6px] bg-white p-6 shadow-sm lg:grid-cols-[auto_minmax(0,1fr)_auto]"
            style={{ borderLeftColor: formData.profileColor }}
          >
            <div
              className="flex h-[72px] w-[72px] items-center justify-center rounded-xl text-[22px] font-extrabold"
              style={{
                backgroundColor: `${formData.profileColor}24`,
                color: formData.profileColor,
              }}
            >
              {initials}
            </div>
            <div className="min-w-0">
              <span
                className="mb-1.5 block text-xs font-bold"
                style={{ color: formData.profileColor }}
              >
                공개 회사 프로필
              </span>
              <h2 className="text-[22px] font-bold text-ink-950">
                {formData.name || '회사명을 입력하세요'}
              </h2>
              <p className="mt-1 leading-7 text-ink-700">
                {formData.headline || '다른 회사가 한눈에 이해할 수 있는 한 줄 소개를 입력하세요.'}
              </p>
              <div className="mt-3.5 flex flex-wrap gap-2">
                <PreviewMeta value={formData.industry || '업종'} />
                <PreviewMeta value={formData.region || '지역'} />
                <PreviewMeta value={`${formData.employeeCount || 0}명`} />
                <PreviewMeta value={`${formData.establishedYear || '-'}년 설립`} />
              </div>
            </div>
            {!isEditing && (
              <button
                type="button"
                onClick={startEditing}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-white px-5 py-3 text-sm font-bold text-ink-700 transition hover:border-brand-light hover:bg-brand-light/40 hover:text-brand"
              >
                <PencilLine className="h-4 w-4" />
                프로필 꾸미기
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <PreviewPanel title="핵심 강점">
              {previewStrengths.length ? (
                <ChipList items={previewStrengths} className="bg-emerald-50 text-emerald-700" />
              ) : (
                <p className="leading-7 text-ink-700">
                  강점을 입력하면 회사 상세 화면에서 더 잘 보입니다.
                </p>
              )}
            </PreviewPanel>

            <PreviewPanel title="태그">
              {previewTags.length ? (
                <ChipList items={previewTags} className="bg-brand-light text-brand" />
              ) : (
                <p className="leading-7 text-ink-700">검색에 걸릴 키워드를 입력하세요.</p>
              )}
            </PreviewPanel>

            <PreviewPanel title="인증/자격">
              {previewCertifications.length ? (
                <ChipList items={previewCertifications} className="bg-blue-50 text-blue-700" />
              ) : (
                <p className="leading-7 text-ink-700">
                  인증을 입력하면 회사 신뢰 배지로 표시됩니다.
                </p>
              )}
            </PreviewPanel>

            <PreviewPanel title="대표 프로젝트" className="lg:col-span-2">
              {previewPortfolio.length ? (
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  {previewPortfolio.map((item) => (
                    <article
                      key={`${item.title}-${item.description}`}
                      className="rounded-xl border border-border bg-surface-muted p-3.5"
                    >
                      <strong className="mb-1.5 block text-ink-950">
                        {item.title || '프로젝트명'}
                      </strong>
                      <p className="leading-7 text-ink-700">
                        {item.description || '프로젝트 설명을 입력하세요.'}
                      </p>
                    </article>
                  ))}
                </div>
              ) : (
                <p className="leading-7 text-ink-700">
                  대표 납품, 협업, 구축 사례를 추가해 신뢰도를 높이세요.
                </p>
              )}
            </PreviewPanel>
          </div>
        </section>

        <section className="overflow-hidden rounded-2xl border border-border bg-white shadow-sm">
          <div className="border-b border-border p-6">
            <h2 className="text-[22px] font-bold text-ink-950">프로필 정보</h2>
            <p className="mt-1 leading-7 text-ink-700">
              저장한 내용은 회사 목록과 회사 상세 프로필에 반영됩니다.
            </p>
          </div>

          <form onSubmit={handleSubmit(saveProfile)} className="p-6">
            <FormSection title="기본 정보">
              <Field className="sm:col-span-2" label="회사명" htmlFor="name">
                <input
                  id="name"
                  type="text"
                  className={inputClassName}
                  disabled={!isEditing}
                  {...register('name')}
                />
              </Field>

              <Field className="sm:col-span-2" label="한 줄 소개" htmlFor="headline">
                <input
                  id="headline"
                  type="text"
                  className={inputClassName}
                  placeholder="예: AI 기반 제조 품질 분석 솔루션을 제공합니다"
                  disabled={!isEditing}
                  {...register('headline')}
                />
              </Field>

              <SelectField
                id="industry"
                label="업종"
                disabled={!isEditing}
                register={register('industry')}
                options={industries}
              />
              <SelectField
                id="region"
                label="지역"
                disabled={!isEditing}
                register={register('region')}
                options={regions}
              />
              <SelectField
                id="size"
                label="기업 규모"
                disabled={!isEditing}
                register={register('size')}
                options={companySizes}
              />

              <Field label="웹사이트" htmlFor="website">
                <input
                  id="website"
                  type="url"
                  className={inputClassName}
                  placeholder="https://"
                  disabled={!isEditing}
                  {...register('website')}
                />
              </Field>

              <Field className="sm:col-span-2" label="회사 소개" htmlFor="description">
                <textarea
                  id="description"
                  rows={4}
                  className={textareaClassName}
                  disabled={!isEditing}
                  {...register('description')}
                />
              </Field>
            </FormSection>

            <FormSection title="공개 신뢰 정보" separated>
              <Field label="설립연도" htmlFor="establishedYear">
                <input
                  id="establishedYear"
                  type="number"
                  className={inputClassName}
                  disabled={!isEditing}
                  {...register('establishedYear')}
                />
              </Field>

              <Field label="직원 수" htmlFor="employeeCount">
                <input
                  id="employeeCount"
                  type="number"
                  className={inputClassName}
                  disabled={!isEditing}
                  {...register('employeeCount')}
                />
              </Field>

              <Field label="매출 규모" htmlFor="revenue">
                <input
                  id="revenue"
                  type="text"
                  className={inputClassName}
                  placeholder="예: 50억원"
                  disabled={!isEditing}
                  {...register('revenue')}
                />
              </Field>

              <Field label="프로필 컬러" htmlFor="profileColor">
                <div className="flex min-h-11 items-center gap-2.5">
                  {profileColors.map((color) => (
                    <button
                      key={color.value}
                      type="button"
                      className={cn(
                        'h-8 w-8 rounded-full border-2 border-transparent transition disabled:cursor-not-allowed disabled:opacity-65',
                        formData.profileColor === color.value &&
                          'border-ink-950 ring-4 ring-border',
                      )}
                      style={{ backgroundColor: color.value }}
                      disabled={!isEditing}
                      aria-label={color.label}
                      onClick={() => setValue('profileColor', color.value, { shouldDirty: true })}
                    />
                  ))}
                </div>
              </Field>

              <Field className="sm:col-span-2" label="핵심 강점" htmlFor="strengths">
                <input
                  id="strengths"
                  type="text"
                  className={inputClassName}
                  placeholder="쉼표로 구분: 빠른 응답, 품질 관리, 대량 생산"
                  disabled={!isEditing}
                  {...register('strengths')}
                />
              </Field>

              <Field className="sm:col-span-2" label="인증/자격" htmlFor="certifications">
                <input
                  id="certifications"
                  type="text"
                  className={inputClassName}
                  placeholder="쉼표로 구분: ISO 9001, 벤처기업인증"
                  disabled={!isEditing}
                  {...register('certifications')}
                />
                <span className="mt-1.5 text-xs text-ink-400">
                  인증은 회사 상세 화면에서 신뢰 배지로 표시됩니다.
                </span>
              </Field>

              <Field className="sm:col-span-2" label="검색 태그" htmlFor="tags">
                <input
                  id="tags"
                  type="text"
                  className={inputClassName}
                  placeholder="쉼표로 구분: AI, 제조, B2B"
                  disabled={!isEditing}
                  {...register('tags')}
                />
              </Field>
            </FormSection>

            <FormSection title="대표 프로젝트" separated singleColumn>
              <div className="grid gap-2.5">
                <input
                  type="text"
                  className={inputClassName}
                  placeholder="프로젝트명"
                  disabled={!isEditing}
                  {...register('portfolioTitle1')}
                />
                <textarea
                  rows={3}
                  className={textareaClassName}
                  placeholder="성과, 납품 품목, 협업 내용을 입력하세요"
                  disabled={!isEditing}
                  {...register('portfolioDescription1')}
                />
              </div>
              <div className="grid gap-2.5">
                <input
                  type="text"
                  className={inputClassName}
                  placeholder="프로젝트명"
                  disabled={!isEditing}
                  {...register('portfolioTitle2')}
                />
                <textarea
                  rows={3}
                  className={textareaClassName}
                  placeholder="성과, 납품 품목, 협업 내용을 입력하세요"
                  disabled={!isEditing}
                  {...register('portfolioDescription2')}
                />
              </div>
            </FormSection>

            <FormSection title="연락처" separated>
              <Field label="연락 이메일" htmlFor="contactEmail">
                <input
                  id="contactEmail"
                  type="email"
                  className={inputClassName}
                  disabled={!isEditing}
                  {...register('contactEmail')}
                />
              </Field>

              <Field label="연락 전화번호" htmlFor="contactPhone">
                <input
                  id="contactPhone"
                  type="tel"
                  className={inputClassName}
                  disabled={!isEditing}
                  {...register('contactPhone')}
                />
              </Field>
            </FormSection>

            {isEditing && (
              <div className="mt-7 flex justify-end gap-3 border-t border-border pt-6">
                <button
                  type="button"
                  onClick={cancelEditing}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-white px-5 py-3 text-sm font-bold text-ink-700 transition hover:border-brand-light hover:bg-brand-light/40 hover:text-brand"
                >
                  <RotateCcw className="h-4 w-4" />
                  취소
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand px-5 py-3 text-sm font-bold text-white transition hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSubmitting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  {isSubmitting ? '저장 중...' : '저장'}
                </button>
              </div>
            )}
          </form>
        </section>
      </div>
    </div>
  )
}

function PreviewMeta({ value }: { value: string }) {
  return (
    <span className="rounded-lg bg-surface-muted px-2.5 py-1 text-[13px] font-semibold text-ink-700">
      {value}
    </span>
  )
}

function PreviewPanel({
  title,
  children,
  className,
}: {
  title: string
  children: ReactNode
  className?: string
}) {
  return (
    <div className={cn('rounded-2xl border border-border bg-white p-[18px] shadow-sm', className)}>
      <h3 className="mb-3 text-base font-bold text-ink-950">{title}</h3>
      {children}
    </div>
  )
}

function ChipList({ items, className }: { items: string[]; className: string }) {
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item) => (
        <span
          key={item}
          className={cn('rounded-full px-3 py-1.5 text-[13px] font-semibold', className)}
        >
          {item}
        </span>
      ))}
    </div>
  )
}

function FormSection({
  title,
  children,
  separated = false,
  singleColumn = false,
}: {
  title: string
  children: ReactNode
  separated?: boolean
  singleColumn?: boolean
}) {
  return (
    <section className={cn(separated && 'mt-7 border-t border-border pt-6')}>
      <h3 className="mb-3 text-base font-bold text-ink-950">{title}</h3>
      <div
        className={cn('grid gap-5', singleColumn ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-2')}
      >
        {children}
      </div>
    </section>
  )
}

function Field({
  label,
  htmlFor,
  children,
  className,
}: {
  label: string
  htmlFor: string
  children: ReactNode
  className?: string
}) {
  return (
    <div className={cn('flex flex-col', className)}>
      <label htmlFor={htmlFor} className={labelClassName}>
        {label}
      </label>
      {children}
    </div>
  )
}

function SelectField({
  id,
  label,
  options,
  disabled,
  register,
}: {
  id: string
  label: string
  options: string[]
  disabled: boolean
  register: UseFormRegisterReturn
}) {
  return (
    <Field label={label} htmlFor={id}>
      <select
        id={id}
        className={cn(inputClassName, 'appearance-none')}
        disabled={disabled}
        {...register}
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </Field>
  )
}
