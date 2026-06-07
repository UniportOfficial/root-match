'use client'

import Link from 'next/link'
import { Eye, Mail, MessageCircle, Sparkles, type LucideIcon } from 'lucide-react'
import { AppBadge } from '@/components/ui/AppBadge'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'

type ActivityType = 'view' | 'inquiry' | 'match' | 'message'

interface StatCard {
  title: string
  value: number
  icon: LucideIcon
  delta: string
}

interface ActivitySummaryItem {
  type: ActivityType
  label: string
  icon: LucideIcon
}

const tabItems = [
  { label: '기업 프로필', href: '/mypage', current: false },
  { label: '활동 분석', href: '/mypage/analytics', current: true },
  { label: '계정 설정', href: '/mypage/settings', current: false },
]

const statCards: StatCard[] = [
  { title: '총 조회수', value: 0, icon: Eye, delta: '데이터 연결 대기' },
  {
    title: '총 문의',
    value: 0,
    icon: MessageCircle,
    delta: '데이터 연결 대기',
  },
  { title: '매칭 기업', value: 0, icon: Sparkles, delta: '데이터 연결 대기' },
  { title: '최근 메시지', value: 0, icon: Mail, delta: '데이터 연결 대기' },
]

const summaryItems: ActivitySummaryItem[] = [
  { type: 'view', label: '프로필 조회', icon: Eye },
  { type: 'inquiry', label: '협력 문의', icon: MessageCircle },
  { type: 'match', label: '매칭 발견', icon: Sparkles },
  { type: 'message', label: '메시지', icon: Mail },
]

function countActivityType(type: ActivityType): number {
  void type
  return 0
}

export default function MyPageAnalyticsPage() {
  const maxSummaryCount = Math.max(...summaryItems.map((item) => countActivityType(item.type)), 1)

  return (
    <div className="bg-background px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-8">
        <nav aria-label="마이페이지 메뉴" className="flex flex-wrap gap-2">
          {tabItems.map((item) =>
            item.current ? (
              <Badge
                key={item.href}
                aria-current="page"
                className="text-kr-keep px-4 py-2 text-sm font-bold shadow-sm"
              >
                {item.label}
              </Badge>
            ) : (
              <Link
                key={item.href}
                href={item.href}
                className="text-kr-keep rounded-pill border border-border bg-card px-4 py-2 text-sm font-semibold text-foreground transition hover:border-brand-light hover:bg-brand-light/40 hover:text-brand"
              >
                {item.label}
              </Link>
            ),
          )}
        </nav>

        <header className="relative overflow-hidden rounded-2xl border border-border bg-card p-6 shadow-ct-soft sm:p-8">
          <div className="absolute right-0 top-0 h-40 w-40 rounded-full bg-brand-light/70 blur-3xl" />
          <AppBadge variant="blue">
            <Sparkles className="h-4 w-4" />
            활동 분석
          </AppBadge>
          <h1 className="text-kr-pretty mt-5 text-[24px] font-bold text-foreground sm:text-[28px]">
            활동 분석
          </h1>
          <p className="text-kr-pretty mt-3 text-lg leading-8 text-muted-foreground">
            기업 프로필 조회와 문의, 매칭 추이를 확인하세요.
          </p>
        </header>

        <section>
          <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {statCards.map((stat) => {
              const Icon = stat.icon

              return (
                <Card
                  key={stat.title}
                  className="border-border bg-card shadow-ct-soft transition-shadow hover:shadow-ct-card"
                >
                  <CardHeader className="p-5 pb-3">
                    <div className="flex items-center justify-between gap-3">
                      <CardTitle className="text-kr-keep text-[15px] font-semibold text-muted-foreground">
                        {stat.title}
                      </CardTitle>
                      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent text-primary">
                        <Icon className="h-5 w-5" />
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-5 pt-0">
                    <p className="text-3xl font-black tabular-nums text-foreground">
                      {stat.value.toLocaleString('ko-KR')}
                    </p>
                    <Badge variant="success" size="sm" className="mt-3 text-kr-keep">
                      {stat.delta} 업데이트
                    </Badge>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </section>

        <section>
          <div className="mb-4">
            <h2 className="text-kr-pretty text-[18px] font-bold text-foreground sm:text-[20px]">
              최근 활동
            </h2>
          </div>

          <Card className="border-border bg-card shadow-ct-soft">
            <CardContent className="p-6 text-center">
              <p className="text-kr-pretty text-[15px] font-semibold text-muted-foreground">
                활동 데이터가 연결되면 최근 활동이 표시됩니다.
              </p>
            </CardContent>
          </Card>
        </section>

        <Card className="border-border bg-card shadow-ct-soft">
          <CardHeader>
            <CardTitle className="text-kr-pretty text-[18px] font-bold text-foreground sm:text-[20px]">
              활동 유형별 요약
            </CardTitle>
            <CardDescription className="text-kr-pretty text-[15px]">
              활동 신호를 유형별로 정리했습니다.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-5">
            {summaryItems.map((item) => {
              const Icon = item.icon
              const count = countActivityType(item.type)
              const value = Math.max((count / maxSummaryCount) * 100, 8)

              return (
                <div key={item.type}>
                  <div className="mb-2 flex items-center justify-between gap-4">
                    <div className="text-kr-keep flex items-center gap-2 text-sm font-bold text-foreground">
                      <Icon className="h-4 w-4 text-brand" />
                      {item.label}
                    </div>
                    <span className="text-sm font-black text-brand">
                      {count.toLocaleString('ko-KR')}
                    </span>
                  </div>
                  <Progress value={value} className="h-3 bg-muted" />
                </div>
              )
            })}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
