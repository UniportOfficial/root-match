'use client'

import { Suspense, useEffect } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { ArrowRight, Building2, Heart, Search } from 'lucide-react'
import { AppBadge } from '@/components/ui/AppBadge'
import { AppButton } from '@/components/ui/AppButton'
import { companySizes, industries, regions } from '@/data/companies'
import {
  useCompaniesDispatch,
  useCompaniesFiltered,
  useCompaniesState,
} from '@/state/CompaniesContext'

const inputClassName =
  'h-12 w-full rounded-xl border border-slate-300 bg-white px-4 text-base text-ink-950 outline-none transition placeholder:text-ink-400 focus:border-brand focus:ring-4 focus:ring-brand-light'
const selectClassName =
  'h-12 w-full appearance-none rounded-xl border border-slate-300 bg-white px-4 text-base text-ink-950 outline-none transition focus:border-brand focus:ring-4 focus:ring-brand-light'

export default function CompaniesPage() {
  return (
    <Suspense fallback={<CompaniesPageShell />}>
      <CompaniesPageContent />
    </Suspense>
  )
}

function CompaniesPageShell() {
  return (
    <div className="px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <header className="mb-8">
          <AppBadge variant="blue">
            <Building2 className="h-4 w-4" />
            기업 디렉토리
          </AppBadge>
          <h1 className="mt-5 text-3xl font-bold text-ink-950 sm:text-4xl">기업 디렉토리</h1>
          <p className="mt-3 text-lg leading-8 text-ink-700">
            조건에 맞는 기업을 찾아 협업을 시작하세요.
          </p>
        </header>
      </div>
    </div>
  )
}

function CompaniesPageContent() {
  const searchParams = useSearchParams()
  const { filter, favorites } = useCompaniesState()
  const dispatch = useCompaniesDispatch()
  const filteredCompanies = useCompaniesFiltered()

  useEffect(() => {
    const keywordFromQuery = searchParams.get('keyword')
    if (!keywordFromQuery) return

    dispatch({ type: 'companies/setFilter', payload: { keyword: keywordFromQuery } })
  }, [dispatch, searchParams])

  return (
    <div className="px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <header className="mb-8">
          <AppBadge variant="blue">
            <Building2 className="h-4 w-4" />
            기업 디렉토리
          </AppBadge>
          <h1 className="mt-5 text-3xl font-bold text-ink-950 sm:text-4xl">기업 디렉토리</h1>
          <p className="mt-3 text-lg leading-8 text-ink-700">
            조건에 맞는 기업을 찾아 협업을 시작하세요.
          </p>
        </header>

        <section className="mb-6 rounded-2xl border border-border bg-white p-4 shadow-sm">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_180px_180px_180px_auto]">
            <label className="relative block">
              <span className="sr-only">키워드 검색</span>
              <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-ink-400" />
              <input
                type="search"
                value={filter.keyword}
                onChange={(event) =>
                  dispatch({
                    type: 'companies/setFilter',
                    payload: { keyword: event.target.value },
                  })
                }
                placeholder="기업명, 설명, 태그로 검색"
                className={`${inputClassName} pl-12`}
              />
            </label>

            <label className="block">
              <span className="sr-only">업종</span>
              <select
                value={filter.industry}
                onChange={(event) =>
                  dispatch({
                    type: 'companies/setFilter',
                    payload: { industry: event.target.value },
                  })
                }
                className={selectClassName}
              >
                <option value="">전체 업종</option>
                {industries.map((industry) => (
                  <option key={industry} value={industry}>
                    {industry}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="sr-only">지역</span>
              <select
                value={filter.region}
                onChange={(event) =>
                  dispatch({ type: 'companies/setFilter', payload: { region: event.target.value } })
                }
                className={selectClassName}
              >
                <option value="">전체 지역</option>
                {regions.map((region) => (
                  <option key={region} value={region}>
                    {region}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="sr-only">규모</span>
              <select
                value={filter.size}
                onChange={(event) =>
                  dispatch({ type: 'companies/setFilter', payload: { size: event.target.value } })
                }
                className={selectClassName}
              >
                <option value="">전체 규모</option>
                {companySizes.map((size) => (
                  <option key={size} value={size}>
                    {size}
                  </option>
                ))}
              </select>
            </label>

            <AppButton
              variant="secondary"
              className="h-12 whitespace-nowrap"
              onClick={() => dispatch({ type: 'companies/clearFilter' })}
            >
              초기화
            </AppButton>
          </div>
        </section>

        <main className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {filteredCompanies.map((company) => {
            const isFavorite = favorites.includes(company.id)

            return (
              <article
                key={company.id}
                className="rounded-2xl border border-border bg-white p-5 shadow-sm transition hover:border-brand-light hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="mb-3 flex flex-wrap gap-2">
                      <AppBadge variant="slate">{company.industry}</AppBadge>
                      <AppBadge variant="slate">{company.region}</AppBadge>
                    </div>
                    <h2 className="text-xl font-bold text-ink-950">{company.name}</h2>
                  </div>

                  <button
                    type="button"
                    aria-label={isFavorite ? '관심 기업 해제' : '관심 기업 추가'}
                    onClick={() =>
                      dispatch({ type: 'companies/toggleFavorite', payload: company.id })
                    }
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border bg-white transition hover:border-brand-light hover:bg-brand-light/40"
                  >
                    <Heart
                      className={`h-5 w-5 ${
                        isFavorite ? 'fill-danger text-danger' : 'text-ink-400'
                      }`}
                    />
                  </button>
                </div>

                <p className="mt-4 line-clamp-3 text-sm leading-6 text-ink-700">
                  {company.description}
                </p>

                <div className="mt-4 flex flex-wrap gap-2">
                  {company.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full bg-brand-light px-3 py-1 text-xs font-bold text-brand"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>

                <div className="mt-5 flex items-center justify-between gap-3 border-t border-border pt-4">
                  <p className="text-sm font-semibold text-ink-400">
                    직원 {company.employeeCount.toLocaleString('ko-KR')}명 · 매출 {company.revenue}
                  </p>
                  <Link
                    href={`/companies/${company.id}`}
                    className="inline-flex items-center gap-1 text-sm font-bold text-brand transition hover:text-brand-hover"
                  >
                    상세
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </article>
            )
          })}

          {filteredCompanies.length === 0 && (
            <div className="rounded-2xl border border-border bg-white p-12 text-center shadow-sm md:col-span-2 xl:col-span-3">
              <Building2 className="mx-auto h-12 w-12 text-ink-400" />
              <p className="mt-4 text-lg font-semibold text-ink-700">
                조건에 맞는 기업이 없습니다.
              </p>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
