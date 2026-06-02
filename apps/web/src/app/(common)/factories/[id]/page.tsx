'use client'

import type { ReactNode } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import {
  ArrowLeft,
  ArrowRight,
  Award,
  Building2,
  CheckCircle,
  Clock,
  Factory,
  Image as ImageIcon,
  MapPin,
  Package,
  ShieldCheck,
  Star,
  TrendingUp,
} from 'lucide-react'
import {
  mockDefaultFactoryDetail,
  mockFactoryDetails,
} from '@rootmatching/shared/fixtures/factory-data'
import { AppBadge } from '@/components/ui/AppBadge'
import { cn } from '@/lib/cn'

export default function FactoryDetailPage() {
  const params = useParams<{ id: string }>()
  const factory = mockFactoryDetails[params.id] ?? mockDefaultFactoryDetail

  return (
    <div className="px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <Link
          href="/companies"
          className="mb-5 inline-flex items-center gap-2 text-sm font-bold text-ink-700 hover:text-brand"
        >
          <ArrowLeft className="h-4 w-4" />
          기업 디렉토리로
        </Link>

        <header className="overflow-hidden rounded-2xl border border-border bg-white shadow-sm">
          <div className="h-48 w-full overflow-hidden bg-surface-muted">
            <img src={factory.image} alt={factory.name} className="h-full w-full object-cover" />
          </div>
          <div className="flex flex-col gap-4 p-6 sm:p-8 lg:flex-row lg:items-start lg:justify-between">
            <div>
              {factory.verified && (
                <AppBadge variant="green">
                  <ShieldCheck className="h-4 w-4" />
                  인증 공장
                </AppBadge>
              )}
              <h1 className="mt-4 text-3xl font-bold text-ink-950 sm:text-4xl">{factory.name}</h1>
              <p className="mt-2 inline-flex items-center gap-2 text-base text-ink-700">
                <MapPin className="h-4 w-4 text-ink-400" />
                {factory.location}
              </p>
              <div className="mt-3 inline-flex items-center gap-2 text-base font-bold text-ink-950">
                <Star className="h-5 w-5 fill-amber-400 text-amber-400" />
                {factory.trustScore} / 5.0
              </div>
            </div>
            <Link
              href={`/factory/requests/${factory.id}`}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand px-5 py-3 text-sm font-bold text-white transition hover:bg-brand-hover"
            >
              견적 요청하기
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </header>

        <section className="my-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <KpiCard
            icon={<Clock className="h-5 w-5" />}
            label="납기 준수율"
            value={`${factory.kpi.deliveryRate}%`}
          />
          <KpiCard
            icon={<Award className="h-5 w-5" />}
            label="품질 만족도"
            value={`${factory.kpi.qualitySatisfaction} / 5.0`}
          />
          <KpiCard
            icon={<TrendingUp className="h-5 w-5" />}
            label="재거래율"
            value={`${factory.kpi.reorderRate}%`}
          />
          <KpiCard
            icon={<CheckCircle className="h-5 w-5" />}
            label="평균 응답 시간"
            value={factory.kpi.avgResponseTime}
          />
        </section>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
          <main className="space-y-6">
            <DetailCard icon={<Factory className="h-5 w-5" />} title="전문 공정">
              <ChipList items={factory.specialty} />
            </DetailCard>

            <DetailCard icon={<Building2 className="h-5 w-5" />} title="보유 설비">
              <ChipList items={factory.equipment} />
            </DetailCard>

            <DetailCard icon={<Package className="h-5 w-5" />} title="주요 생산 품목">
              <ChipList items={factory.products} />
            </DetailCard>

            <DetailCard icon={<TrendingUp className="h-5 w-5" />} title="월 생산량">
              <div className="rounded-2xl bg-surface-muted p-5">
                <p className="text-3xl font-black text-ink-950">{factory.monthlyCapacity}</p>
                <p className="mt-2 text-sm font-semibold text-ink-400">
                  프로젝트 규모에 따라 생산 라인 증설과 협력 공장 연계가 가능합니다.
                </p>
              </div>
            </DetailCard>

            <DetailCard icon={<Award className="h-5 w-5" />} title="주요 고객사">
              <ChipList items={factory.clients} />
            </DetailCard>
          </main>

          <aside className="space-y-6 lg:sticky lg:top-8 lg:self-start">
            <section className="rounded-2xl border border-border bg-white p-6 shadow-sm">
              <h2 className="text-xl font-bold text-ink-950">빠른 정보</h2>
              <div className="mt-5 space-y-4">
                <QuickInfo
                  icon={<MapPin className="h-4 w-4" />}
                  label="위치"
                  value={factory.location}
                />
                <QuickInfo
                  icon={<Factory className="h-4 w-4" />}
                  label="전문 공정"
                  value={factory.specialty.join(', ')}
                />
                <QuickInfo
                  icon={<Package className="h-4 w-4" />}
                  label="생산 품목"
                  value={factory.products.join(', ')}
                />
                <QuickInfo
                  icon={<Clock className="h-4 w-4" />}
                  label="응답 시간"
                  value={factory.kpi.avgResponseTime}
                />
              </div>
            </section>

            <section className="rounded-2xl bg-ink-950 p-6 text-white shadow-sm">
              <ShieldCheck className="h-10 w-10 text-brand-light" />
              <h2 className="mt-4 text-xl font-bold">이 공장에 견적을 요청해보세요</h2>
              <p className="mt-2 text-sm leading-6 text-white/70">
                도면과 수량을 공유하면 생산 가능 여부와 예상 단가를 빠르게 확인할 수 있습니다.
              </p>
              <Link
                href={`/factory/requests/${factory.id}`}
                className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-brand px-5 py-3 text-sm font-bold text-white transition hover:bg-brand-hover"
              >
                견적 요청하기
                <ArrowRight className="h-4 w-4" />
              </Link>
            </section>
          </aside>
        </div>

        <section className="mt-8 rounded-2xl border border-border bg-white p-5 shadow-sm sm:p-7">
          <div className="mb-5 flex items-center gap-2">
            <ImageIcon className="h-5 w-5 text-brand" />
            <h2 className="text-2xl font-bold text-ink-950">포트폴리오</h2>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {factory.portfolio.map((item) => (
              <article
                key={item.id}
                className="overflow-hidden rounded-2xl border border-border bg-white shadow-sm"
              >
                <img src={item.image} alt={item.title} className="h-40 w-full object-cover" />
                <div className="p-4">
                  <h3 className="font-bold text-ink-950">{item.title}</h3>
                  <p className="mt-2 text-sm font-semibold text-brand">{item.process}</p>
                  <p className="mt-1 text-sm text-ink-400">{item.period}</p>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="mt-8 rounded-2xl border border-border bg-white p-5 shadow-sm sm:p-7">
          <div className="mb-5 flex items-center gap-2">
            <Star className="h-5 w-5 fill-amber-400 text-amber-400" />
            <h2 className="text-2xl font-bold text-ink-950">고객 리뷰</h2>
          </div>

          {factory.reviews.length > 0 ? (
            <div className="space-y-4">
              {factory.reviews.map((review) => (
                <article key={review.id} className="rounded-2xl bg-surface-muted p-5">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <StarRating value={review.rating} />
                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <h3 className="font-bold text-ink-950">{review.author}</h3>
                        <span className="text-sm font-semibold text-ink-400">{review.company}</span>
                      </div>
                    </div>
                    <span className="text-sm font-semibold text-ink-400">{review.date}</span>
                  </div>
                  <p className="mt-4 leading-7 text-ink-700">{review.content}</p>
                  <p className="mt-3 text-sm font-bold text-brand">{review.product}</p>
                </article>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl bg-surface-muted p-8 text-center text-sm font-semibold text-ink-400">
              아직 리뷰가 없습니다.
            </div>
          )}
        </section>
      </div>
    </div>
  )
}

function DetailCard({
  icon,
  title,
  children,
}: {
  icon: ReactNode
  title: string
  children: ReactNode
}) {
  return (
    <section className="rounded-2xl border border-border bg-white p-5 shadow-sm sm:p-7">
      <div className="mb-4 flex items-center gap-2">
        <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-brand-light text-brand">
          {icon}
        </span>
        <h2 className="text-2xl font-bold text-ink-950">{title}</h2>
      </div>
      {children}
    </section>
  )
}

function QuickInfo({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="flex gap-3 rounded-xl bg-surface-muted p-4">
      <span className="mt-0.5 text-brand">{icon}</span>
      <div>
        <p className="text-xs font-bold uppercase tracking-wide text-ink-400">{label}</p>
        <p className="mt-1 text-sm font-semibold leading-6 text-ink-950">{value}</p>
      </div>
    </div>
  )
}

function ChipList({ items }: { items: string[] }) {
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item) => (
        <Chip key={item}>{item}</Chip>
      ))}
    </div>
  )
}

function Chip({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full bg-brand-light px-3 py-1.5 text-sm font-semibold text-brand">
      {children}
    </span>
  )
}

function KpiCard({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border bg-white p-5 shadow-sm">
      <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-brand-light text-brand">
        {icon}
      </div>
      <p className="text-sm font-semibold text-ink-400">{label}</p>
      <p className="mt-1 text-2xl font-bold text-ink-950">{value}</p>
    </div>
  )
}

function StarRating({ value }: { value: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={cn('h-4 w-4', i < value ? 'fill-amber-400 text-amber-400' : 'text-ink-400')}
        />
      ))}
    </div>
  )
}
