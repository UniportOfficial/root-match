import type { ReactNode } from 'react'
import Link from 'next/link'
import { headers } from 'next/headers'
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
import type { CompanyFactoryProfile, CompanyDetail } from '@rootmatching/shared'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { EscrowMiniStepper } from '@/components/matching/EscrowMiniStepper'
import { MatchingVerificationBadges } from '@/components/matching/MatchingVerificationBadges'
import { getServerSession } from '@/lib/auth-server'
import { fetchCompanyDetailServer } from '@/lib/companies-api'
import { deriveCompanyVerifications } from '@/lib/matching-verifications'
import { getDemoCompanyDetail } from '@/lib/demo-companies'
import { isDemoFallbackEnabled, isDemoModeSearch } from '@/lib/demo-policy'

const EMPTY_LIST_PLACEHOLDER = '정보가 곧 추가됩니다.'
const EMPTY_PORTFOLIO_MESSAGE = '포트폴리오 정보가 곧 추가됩니다.'
const EMPTY_REVIEWS_MESSAGE = '리뷰 정보가 곧 추가됩니다.'
const HERO_FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1565043666747-69f6646db940?w=1600&h=600&fit=crop'

interface PageProps {
  params: Promise<{ id: string }>
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}

export default async function FactoryDetailPage({ params, searchParams }: PageProps) {
  const { id } = await params
  const resolvedSearchParams = await searchParams
  const requestHeaders = await headers()
  const cookieHeader = requestHeaders.get('cookie') ?? ''
  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'
  const demoSearch = new URLSearchParams()
  const demoParam = resolvedSearchParams?.demo
  if (typeof demoParam === 'string') demoSearch.set('demo', demoParam)
  const allowDemoFallback = isDemoFallbackEnabled() || isDemoModeSearch(demoSearch)

  const [detailResult, session] = await Promise.all([
    fetchCompanyDetailServer(apiUrl, id, cookieHeader),
    getServerSession(),
  ])

  const demoDetail = !detailResult.ok && allowDemoFallback ? getDemoCompanyDetail(id) : null

  if (!detailResult.ok && !demoDetail) {
    return <DetailErrorCard reason={detailResult.reason} />
  }

  const company = detailResult.ok ? detailResult.data : demoDetail
  if (!company) {
    return <DetailErrorCard reason="error" />
  }
  const profile = company.factoryProfile
  const accountType = session?.user.accountType ?? null
  const showQuoteCta = accountType === 'client'
  const displayLocation = profile?.location ?? company.address ?? company.region ?? '위치 정보 미상'
  const headline = buildHeadline(company)
  const verified = profile?.verified ?? false
  const verifications = deriveCompanyVerifications(company)

  return (
    <div className="bg-background">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-10">
        <Link
          href="/companies"
          className="mb-5 inline-flex items-center gap-2 text-sm font-bold text-ink-700 hover:text-brand"
        >
          <ArrowLeft className="h-4 w-4" />
          기업 디렉토리로
        </Link>

        <Card className="overflow-hidden border-border bg-card shadow-ct-soft">
          <div className="h-48 w-full overflow-hidden bg-surface-muted">
            <img
              src={HERO_FALLBACK_IMAGE}
              alt={`${company.name} 대표 이미지`}
              className="h-full w-full object-cover"
            />
          </div>
          <CardContent className="flex flex-col gap-4 p-4 sm:p-6 lg:flex-row lg:items-start lg:justify-between lg:p-8">
            <div>
              {(verified || company.confidenceTier) && (
                <div className="flex flex-wrap gap-2">
                  {verified && (
                    <Badge variant="success" className="text-kr-keep">
                      <ShieldCheck className="h-4 w-4" />
                      인증 공장
                    </Badge>
                  )}
                  {company.confidenceTier && (
                    <Badge variant="info" className="text-kr-keep">
                      {formatConfidenceTier(company.confidenceTier)}
                    </Badge>
                  )}
                </div>
              )}
              <h1 className="text-kr-pretty mt-4 text-[24px] font-bold text-foreground sm:text-[28px]">
                {company.name}
              </h1>
              <p className="text-kr-keep mt-2 inline-flex items-center gap-2 text-base text-foreground/80">
                <MapPin className="h-4 w-4 text-ink-400" />
                {displayLocation}
              </p>
              {headline && (
                <p className="text-kr-pretty mt-2 text-sm text-muted-foreground">{headline}</p>
              )}
              {profile && (
                <div className="mt-3 inline-flex items-center gap-2 text-base font-bold text-ink-950">
                  <Star className="h-5 w-5 fill-amber-400 text-amber-400" />
                  {formatTrustScore(profile)}
                </div>
              )}
            </div>
            {showQuoteCta && (
              <Button asChild>
                <Link href={`/request?factoryId=${company.id}`}>
                  견적 요청하기
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            )}
          </CardContent>
        </Card>

        <section className="my-8" aria-label="공장 검증 5종">
          <p className="text-kr-keep mb-3 text-[15px] font-bold text-foreground">공장 검증 5종</p>
          <MatchingVerificationBadges verifications={verifications} />
        </section>

        {profile && (
          <section className="my-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
            <KpiCard
              icon={<Clock className="h-5 w-5" />}
              label="납기 준수율"
              value={`${profile.deliveryRate}%`}
            />
            <KpiCard
              icon={<Award className="h-5 w-5" />}
              label="품질 만족도"
              value={formatQualityValue(profile)}
            />
            <KpiCard
              icon={<TrendingUp className="h-5 w-5" />}
              label="재거래율"
              value={`${profile.reorderRate}%`}
            />
            <KpiCard
              icon={<CheckCircle className="h-5 w-5" />}
              label="평균 응답 시간"
              value={profile.avgResponseTime ?? '정보 준비 중'}
            />
          </section>
        )}

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_340px] lg:gap-8">
          <main className="space-y-6">
            <DetailCard icon={<Factory className="h-5 w-5" />} title="전문 공정">
              <ChipListOrEmpty items={profile?.specialty ?? []} />
            </DetailCard>

            <DetailCard icon={<Building2 className="h-5 w-5" />} title="보유 설비">
              <ChipListOrEmpty items={profile?.equipment ?? []} />
            </DetailCard>

            <DetailCard icon={<Package className="h-5 w-5" />} title="주요 생산 품목">
              <ChipListOrEmpty items={profile?.products ?? []} />
            </DetailCard>

            <DetailCard icon={<TrendingUp className="h-5 w-5" />} title="월 생산량">
              <div className="rounded-2xl bg-surface-muted p-5">
                <p className="text-3xl font-black text-ink-950">
                  {profile?.monthlyCapacity ?? EMPTY_LIST_PLACEHOLDER}
                </p>
                {profile?.monthlyCapacity && (
                  <p className="mt-2 text-sm font-semibold text-ink-400">
                    프로젝트 규모에 따라 생산 라인 증설과 협력 공장 연계가 가능합니다.
                  </p>
                )}
              </div>
            </DetailCard>

            <DetailCard icon={<Award className="h-5 w-5" />} title="주요 고객사">
              <ChipListOrEmpty items={profile?.clients ?? []} />
            </DetailCard>
          </main>

          <aside className="space-y-6 lg:sticky lg:top-8 lg:self-start">
            <Card className="border-border bg-card shadow-ct-soft">
              <CardHeader>
                <CardTitle className="text-kr-pretty text-[18px] font-bold sm:text-[20px]">
                  빠른 정보
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <QuickInfo
                  icon={<MapPin className="h-4 w-4" />}
                  label="위치"
                  value={displayLocation}
                />
                <QuickInfo
                  icon={<Factory className="h-4 w-4" />}
                  label="전문 공정"
                  value={joinOrPlaceholder(profile?.specialty)}
                />
                <QuickInfo
                  icon={<Package className="h-4 w-4" />}
                  label="생산 품목"
                  value={joinOrPlaceholder(profile?.products)}
                />
                <QuickInfo
                  icon={<Clock className="h-4 w-4" />}
                  label="응답 시간"
                  value={profile?.avgResponseTime ?? EMPTY_LIST_PLACEHOLDER}
                />
                {company.representative && (
                  <QuickInfo
                    icon={<ShieldCheck className="h-4 w-4" />}
                    label="대표자"
                    value={company.representative}
                  />
                )}
              </CardContent>
            </Card>

            {showQuoteCta && (
              <>
                <EscrowMiniStepper currentStep={1} variant="vertical" />
                <Card className="border-border bg-ink-950 text-white shadow-ct-soft">
                  <CardContent className="p-6">
                    <ShieldCheck className="h-10 w-10 text-brand-light" />
                    <h2 className="text-kr-pretty mt-4 text-[18px] font-bold sm:text-[20px]">
                      이 공장에 견적을 요청해보세요
                    </h2>
                    <p className="text-kr-pretty mt-2 text-sm leading-6 text-white/70">
                      도면과 수량을 공유하면 생산 가능 여부와 예상 단가를 빠르게 확인할 수 있습니다.
                    </p>
                    <Separator className="my-4 bg-white/20" />
                    <Button asChild fullWidth className="mt-5">
                      <Link href={`/request?factoryId=${company.id}`}>
                        견적 요청하기
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              </>
            )}
          </aside>
        </div>

        <Card className="mt-8 border-border bg-card shadow-ct-soft">
          <CardHeader>
            <div className="flex items-center gap-2">
              <ImageIcon className="h-5 w-5 text-brand" />
              <CardTitle className="text-kr-pretty text-[18px] font-bold sm:text-[20px]">
                포트폴리오
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <EmptyStatePanel message={EMPTY_PORTFOLIO_MESSAGE} />
          </CardContent>
        </Card>

        <Card className="mt-8 border-border bg-card shadow-ct-soft">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Star className="h-5 w-5 fill-amber-400 text-amber-400" />
              <CardTitle className="text-kr-pretty text-[18px] font-bold sm:text-[20px]">
                고객 리뷰
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <EmptyStatePanel message={EMPTY_REVIEWS_MESSAGE} />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function DetailErrorCard({ reason }: { reason: 'unauthenticated' | 'not-found' | 'error' }) {
  const message =
    reason === 'unauthenticated'
      ? '로그인이 필요한 페이지입니다. 다시 로그인한 후 시도해주세요.'
      : reason === 'not-found'
        ? '해당 기업 정보를 찾을 수 없습니다. 디렉토리로 돌아가 다른 기업을 확인해주세요.'
        : '기업 정보를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.'

  return (
    <div className="bg-background">
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
        <Link
          href="/companies"
          className="mb-5 inline-flex items-center gap-2 text-sm font-bold text-ink-700 hover:text-brand"
        >
          <ArrowLeft className="h-4 w-4" />
          기업 디렉토리로
        </Link>
        <Card className="border-border bg-card shadow-ct-soft">
          <CardContent className="p-8 text-center">
            <h1 className="text-kr-pretty text-[20px] font-bold text-foreground sm:text-[22px]">
              정보 없음
            </h1>
            <p className="text-kr-pretty mt-3 text-base text-muted-foreground">{message}</p>
            <Button asChild className="mt-6">
              <Link href="/companies">
                기업 디렉토리로 돌아가기
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
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
    <Card className="border-border bg-card shadow-ct-soft">
      <CardHeader>
        <div className="flex items-center gap-2">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-brand-light text-brand">
            {icon}
          </span>
          <CardTitle className="text-kr-pretty text-[18px] font-bold sm:text-[20px]">
            {title}
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  )
}

function QuickInfo({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-lg bg-muted px-4 py-3">
      <div className="flex gap-3">
        <span className="mt-0.5 text-brand">{icon}</span>
        <div>
          <p className="text-kr-keep text-xs font-bold uppercase tracking-wide text-muted-foreground">
            {label}
          </p>
          <p className="text-kr-pretty mt-1 text-sm font-semibold leading-6 text-foreground">
            {value}
          </p>
        </div>
      </div>
    </div>
  )
}

function ChipListOrEmpty({ items }: { items: string[] }) {
  if (items.length === 0) {
    return (
      <p className="text-kr-keep text-sm font-semibold text-muted-foreground">
        {EMPTY_LIST_PLACEHOLDER}
      </p>
    )
  }
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item) => (
        <Badge key={item} variant="info" className="text-kr-keep">
          {item}
        </Badge>
      ))}
    </div>
  )
}

function KpiCard({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <Card className="border-border bg-card shadow-ct-soft">
      <CardContent className="p-5">
        <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-brand-light text-brand">
          {icon}
        </div>
        <p className="text-kr-keep text-sm font-semibold text-muted-foreground">{label}</p>
        <p className="text-kr-pretty mt-1 text-2xl font-bold text-foreground">{value}</p>
      </CardContent>
    </Card>
  )
}

function EmptyStatePanel({ message }: { message: string }) {
  return (
    <div className="rounded-2xl bg-surface-muted p-8 text-center text-sm font-semibold text-ink-400">
      {message}
    </div>
  )
}

function buildHeadline(company: CompanyDetail): string | null {
  const parts: string[] = []
  if (company.processHint) parts.push(company.processHint)
  if (company.industry) parts.push(company.industry)
  return parts.length > 0 ? parts.join(' · ') : null
}

function formatTrustScore(profile: CompanyFactoryProfile): string {
  if (!profile.isSynthesized && profile.qualitySatisfaction != null) {
    return `${profile.qualitySatisfaction.toFixed(1)} / 5.0`
  }
  return `${profile.trustScore} / 100`
}

function formatQualityValue(profile: CompanyFactoryProfile): string {
  if (!profile.isSynthesized && profile.qualitySatisfaction != null) {
    return `${profile.qualitySatisfaction.toFixed(1)} / 5.0`
  }
  return `${profile.qualityScore} / 100`
}

function joinOrPlaceholder(items: string[] | undefined): string {
  if (!items || items.length === 0) return EMPTY_LIST_PLACEHOLDER
  return items.join(', ')
}

function formatConfidenceTier(tier: NonNullable<CompanyDetail['confidenceTier']>): string {
  switch (tier) {
    case 'A_CERTIFIED_ROOT':
      return '인증 뿌리기업'
    case 'B_LOCAL_STRONG_INSIDE':
      return '산업단지 검증 기업'
    case 'C_BORDERLINE_INSIDE':
      return '검증 후보 기업'
    case 'D_LOW_CONFIDENCE':
      return '디렉토리 등록 기업'
  }
}
