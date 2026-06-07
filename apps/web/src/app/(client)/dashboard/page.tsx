'use client'

import Link from 'next/link'
import {
  ArrowRight,
  Building2,
  Eye,
  Mail,
  MessageCircle,
  Sparkles,
  type LucideIcon,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { useCompaniesState } from '@/state/CompaniesContext'
import { useUserState } from '@/state/UserContext'
import { cn } from '@/lib/utils'

interface SupportingStat {
  title: string
  value: number
  icon: LucideIcon
  delta: string
  deltaTone: 'success' | 'muted'
}

interface ActionTile {
  icon: LucideIcon
  label: string
  count: number
  href: string
  toneClass: string
}

export default function DashboardPage() {
  const { currentUser } = useUserState()
  const { companies } = useCompaniesState()
  const recommendedCompanies = companies.slice(0, 3)
  const verifiedCompanyCount = companies.filter(
    (company) => company.confidenceTier === 'A_CERTIFIED_ROOT' || company.certifications.length > 0,
  ).length
  const activeRegionCount = new Set(companies.map((company) => company.region).filter(Boolean)).size
  const todayActionCount = companies.length

  const supportingStats: SupportingStat[] = [
    {
      title: '등록 기업',
      value: companies.length,
      icon: Building2,
      delta: '실시간 디렉토리 기준',
      deltaTone: 'muted',
    },
    {
      title: '검증 기업',
      value: verifiedCompanyCount,
      icon: Eye,
      delta: '인증/자격 데이터 기준',
      deltaTone: 'muted',
    },
    {
      title: '활성 권역',
      value: activeRegionCount,
      icon: Sparkles,
      delta: '기업 지역 데이터 기준',
      deltaTone: 'muted',
    },
  ]

  const actionTiles: ActionTile[] = [
    {
      icon: Sparkles,
      label: '기업 디렉토리 확인',
      count: companies.length,
      href: '/companies',
      toneClass: 'border-primary/30 bg-primary/5 text-primary hover:bg-primary/10',
    },
    {
      icon: MessageCircle,
      label: '답장 필요한 문의',
      count: 0,
      href: '/messages',
      toneClass: 'border-warning/30 bg-warning-subtle text-warning-foreground hover:bg-warning/10',
    },
    {
      icon: Mail,
      label: '미확인 메시지',
      count: 0,
      href: '/messages',
      toneClass: 'border-info/30 bg-info-subtle text-info hover:bg-info/10',
    },
  ]

  return (
    <div className="bg-background px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-8">
        <header className="relative overflow-hidden rounded-2xl border border-border bg-card p-6 shadow-ct-soft sm:p-8">
          <div
            className="pointer-events-none absolute -right-12 -top-12 h-56 w-56 rounded-full bg-accent/50 blur-3xl"
            aria-hidden="true"
          />
          <div className="relative space-y-6">
            <div className="grid gap-6 sm:grid-cols-[1fr_auto] sm:items-end">
              <div className="space-y-3">
                <p className="text-kr-keep text-[13px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
                  오늘의 액션 센터
                </p>
                <h1 className="text-kr-balance text-[26px] font-bold leading-tight text-foreground sm:text-[32px]">
                  {currentUser ? `${currentUser.name}님, ` : '환영합니다. '}
                  <br className="hidden sm:block" />
                  오늘 확인할 기업이 <span className="text-primary">{todayActionCount}곳</span>{' '}
                  있습니다.
                </h1>
                <p className="text-kr-pretty text-[15px] leading-7 text-muted-foreground sm:text-[16px]">
                  아래 카드를 눌러 바로 다음 행동을 진행하세요.
                </p>
              </div>
              <Button asChild size="xl" className="w-full shadow-toss-md sm:w-auto">
                <Link href="/matching">
                  <Sparkles className="h-5 w-5" />
                  AI 매칭 결과 보기
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {actionTiles.map((tile) => {
                const Icon = tile.icon
                return (
                  <Link
                    key={tile.label}
                    href={tile.href}
                    className={cn(
                      'group flex items-center gap-3 rounded-xl border px-4 py-3.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40',
                      tile.toneClass,
                    )}
                  >
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-card/80 shadow-ct-soft">
                      <Icon className="h-5 w-5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-kr-keep text-[13px] font-bold opacity-80">{tile.label}</p>
                      <p className="text-kr-keep text-[22px] font-extrabold leading-tight tabular-nums">
                        {tile.count.toLocaleString('ko-KR')}건
                      </p>
                    </div>
                    <ArrowRight className="h-4 w-4 shrink-0 opacity-70 transition-transform group-hover:translate-x-0.5" />
                  </Link>
                )
              })}
            </div>
          </div>
        </header>

        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr_1fr]">
          <Card className="border-primary/20 bg-primary text-primary-foreground shadow-ct-card sm:col-span-2 lg:col-span-1">
            <CardContent className="flex h-full flex-col justify-between gap-6 p-6">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <p className="text-kr-keep text-[14px] font-bold opacity-90">등록 기업</p>
                  <p className="text-kr-keep text-[13px] font-semibold opacity-70">
                    실시간 디렉토리 기준
                  </p>
                </div>
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/10">
                  <Sparkles className="h-5 w-5" />
                </span>
              </div>
              <div>
                <p className="text-[52px] font-bold leading-none tabular-nums sm:text-[60px]">
                  {companies.length.toLocaleString('ko-KR')}
                </p>
                <Link
                  href="/matching"
                  className="text-kr-keep mt-4 inline-flex items-center gap-1 text-[14px] font-bold opacity-90 transition hover:gap-2 hover:opacity-100"
                >
                  추천 결과 보기 <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </CardContent>
          </Card>

          {supportingStats.map((stat) => {
            const Icon = stat.icon
            return (
              <Card
                key={stat.title}
                className="border-border bg-card shadow-ct-soft transition-shadow hover:shadow-ct-card"
              >
                <CardContent className="flex h-full flex-col justify-between gap-4 p-5">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-kr-keep text-[14px] font-bold text-muted-foreground">
                      {stat.title}
                    </p>
                    <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
                  </div>
                  <div className="space-y-2">
                    <p className="text-[30px] font-bold leading-none tabular-nums text-foreground">
                      {stat.value.toLocaleString('ko-KR')}
                    </p>
                    <p
                      className={cn(
                        'text-kr-keep text-[13px] font-semibold',
                        stat.deltaTone === 'success' ? 'text-success' : 'text-muted-foreground',
                      )}
                    >
                      {stat.delta}
                    </p>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </section>

        <section>
          <div className="mb-4 flex items-end justify-between gap-4">
            <div>
              <h2 className="text-kr-pretty text-[20px] font-bold text-foreground sm:text-[22px]">
                추천 기업
              </h2>
              <p className="text-kr-pretty mt-1 text-[14px] text-muted-foreground">
                기업 디렉토리에서 불러온 최신 기업입니다.
              </p>
            </div>
            <Link
              href="/companies"
              className="text-kr-keep hidden shrink-0 text-[14px] font-bold text-primary hover:underline sm:inline-flex"
            >
              전체 보기 →
            </Link>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {recommendedCompanies.map((company) => (
              <Card
                key={company.id}
                className="group border-border bg-card shadow-ct-soft transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-ct-card"
              >
                <CardContent className="flex h-full flex-col p-5">
                  <div className="flex items-start gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent text-accent-foreground">
                      <Building2 className="h-5 w-5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-kr-pretty truncate text-[17px] font-bold text-foreground">
                        {company.name}
                      </h3>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        <Badge variant="slate" size="sm" className="text-kr-keep">
                          {company.industry}
                        </Badge>
                        <Badge variant="slate" size="sm" className="text-kr-keep">
                          {company.region}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <p className="text-kr-pretty mt-4 line-clamp-2 flex-1 text-[14px] leading-6 text-muted-foreground">
                    {company.description}
                  </p>
                  <Link
                    href={`/factories/${company.id}`}
                    className="text-kr-keep mt-4 inline-flex items-center gap-1 text-[14px] font-bold text-primary transition group-hover:gap-2"
                  >
                    기업 상세 보기 <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section>
          <div className="mb-4 flex items-end justify-between gap-4">
            <div>
              <h2 className="text-kr-pretty text-[20px] font-bold text-foreground sm:text-[22px]">
                최근 활동
              </h2>
              <p className="text-kr-pretty mt-1 text-[14px] text-muted-foreground">
                조회·문의·매칭·메시지를 최신순으로 확인하세요.
              </p>
            </div>
          </div>

          <Card className="border-border bg-card shadow-ct-soft">
            <CardContent className="p-6 text-center">
              <p className="text-kr-pretty text-[15px] font-semibold text-muted-foreground">
                최근 활동 데이터가 연결되면 이 영역에 표시됩니다.
              </p>
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  )
}
