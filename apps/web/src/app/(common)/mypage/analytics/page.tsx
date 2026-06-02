'use client'

import Link from 'next/link'
import { Eye, Mail, MessageCircle, Sparkles, type LucideIcon } from 'lucide-react'
import { AppBadge } from '@/components/ui/AppBadge'
import { cn } from '@/lib/cn'
import { mockActivityLogs } from '@/data/activityLogs'
import { mockDashboardStats } from '@/data/dashboardStats'

type ActivityType = (typeof mockActivityLogs)[number]['type']

interface StatCard {
  title: string
  value: number
  icon: LucideIcon
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
  { title: '총 조회수', value: mockDashboardStats.totalViews, icon: Eye },
  { title: '총 문의', value: mockDashboardStats.totalInquiries, icon: MessageCircle },
  { title: '매칭 기업', value: mockDashboardStats.totalMatches, icon: Sparkles },
  { title: '최근 메시지', value: mockDashboardStats.recentMessages, icon: Mail },
]

const activityIcons: Record<ActivityType, LucideIcon> = {
  view: Eye,
  inquiry: MessageCircle,
  match: Sparkles,
  message: Mail,
}

const summaryItems: ActivitySummaryItem[] = [
  { type: 'view', label: '프로필 조회', icon: Eye },
  { type: 'inquiry', label: '협력 문의', icon: MessageCircle },
  { type: 'match', label: '매칭 발견', icon: Sparkles },
  { type: 'message', label: '메시지', icon: Mail },
]

function formatActivityDate(value: string): string {
  return new Date(value).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
}

function countActivityType(type: ActivityType): number {
  return mockActivityLogs.filter((activity) => activity.type === type).length
}

export default function MyPageAnalyticsPage() {
  const maxSummaryCount = Math.max(...summaryItems.map((item) => countActivityType(item.type)), 1)

  return (
    <div className="px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-8">
        <nav aria-label="마이페이지 메뉴" className="flex flex-wrap gap-2">
          {tabItems.map((item) =>
            item.current ? (
              <span
                key={item.href}
                aria-current="page"
                className="rounded-full bg-brand px-4 py-2 text-sm font-bold text-white shadow-sm"
              >
                {item.label}
              </span>
            ) : (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-full border border-border bg-white px-4 py-2 text-sm font-semibold text-ink-700 transition hover:border-brand-light hover:bg-brand-light/40 hover:text-brand"
              >
                {item.label}
              </Link>
            ),
          )}
        </nav>

        <header>
          <AppBadge variant="blue">
            <Sparkles className="h-4 w-4" />
            활동 분석
          </AppBadge>
          <h1 className="mt-5 text-3xl font-bold text-ink-950 sm:text-4xl">활동 분석</h1>
          <p className="mt-3 text-lg leading-8 text-ink-700">
            기업 프로필 조회와 문의, 매칭 추이를 확인하세요.
          </p>
        </header>

        <section>
          <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {statCards.map((stat) => {
              const Icon = stat.icon

              return (
                <article
                  key={stat.title}
                  className="rounded-2xl border border-border bg-white p-5 shadow-sm"
                >
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-light text-brand">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h2 className="mt-4 text-sm font-bold text-ink-700">{stat.title}</h2>
                  <p className="mt-2 text-3xl font-black text-ink-950">
                    {stat.value.toLocaleString('ko-KR')}
                  </p>
                </article>
              )
            })}
          </div>
        </section>

        <section>
          <div className="mb-4">
            <h2 className="text-2xl font-bold text-ink-950">최근 활동</h2>
          </div>

          <div className="divide-y divide-border rounded-2xl border border-border bg-white shadow-sm">
            {mockActivityLogs.map((activity) => {
              const Icon = activityIcons[activity.type]

              return (
                <div key={activity.id} className="flex items-start gap-4 px-5 py-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-light text-brand">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-ink-950">{activity.description}</p>
                    <p className="mt-1 text-sm text-ink-700">{activity.targetCompanyName}</p>
                  </div>
                  <time className="shrink-0 text-sm font-semibold text-ink-400">
                    {formatActivityDate(activity.createdAt)}
                  </time>
                </div>
              )
            })}
          </div>
        </section>

        <section className="rounded-2xl border border-border bg-white p-6 shadow-sm">
          <div className="mb-5">
            <h2 className="text-2xl font-bold text-ink-950">활동 유형별 요약</h2>
          </div>

          <div className="space-y-5">
            {summaryItems.map((item) => {
              const Icon = item.icon
              const count = countActivityType(item.type)
              const width = `${Math.max((count / maxSummaryCount) * 100, 8)}%`

              return (
                <div key={item.type}>
                  <div className="mb-2 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2 text-sm font-bold text-ink-950">
                      <Icon className="h-4 w-4 text-brand" />
                      {item.label}
                    </div>
                    <span className="text-sm font-black text-brand">
                      {count.toLocaleString('ko-KR')}
                    </span>
                  </div>
                  <div className="h-3 overflow-hidden rounded-full bg-surface-muted">
                    <div
                      className={cn('h-full rounded-full bg-brand transition-all')}
                      style={{ width }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      </div>
    </div>
  )
}
