'use client'

import Link from 'next/link'
import { Building2, Eye, Mail, MessageCircle, Sparkles, type LucideIcon } from 'lucide-react'
import { AppBadge } from '@/components/ui/AppBadge'
import { mockActivityLogs } from '@/data/activityLogs'
import { mockCompanies } from '@/data/companies'
import { mockDashboardStats } from '@/data/dashboardStats'
import { useUserState } from '@/state/UserContext'

type ActivityType = (typeof mockActivityLogs)[number]['type']

interface StatCard {
  title: string
  value: number
  icon: LucideIcon
}

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

function formatActivityDate(value: string): string {
  return new Date(value).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
}

export default function DashboardPage() {
  const { currentUser } = useUserState()
  const recommendedCompanies = mockCompanies.slice(0, 3)
  const recentActivities = mockActivityLogs.slice(0, 5)

  return (
    <div className="px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-8">
        <header>
          <AppBadge variant="blue">
            <Sparkles className="h-4 w-4" />
            오늘의 대시보드
          </AppBadge>
          <h1 className="mt-5 text-3xl font-bold text-ink-950 sm:text-4xl">
            {currentUser ? `안녕하세요, ${currentUser.name}님` : '안녕하세요'}
          </h1>
          <p className="mt-3 text-lg leading-8 text-ink-700">오늘의 활동을 확인하세요.</p>
        </header>

        <section>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
          <div className="mb-4 flex items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-ink-950">추천 기업</h2>
              <p className="mt-1 text-sm text-ink-400">최근 활동을 기반으로 추천된 기업입니다.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            {recommendedCompanies.map((company) => (
              <article
                key={company.id}
                className="rounded-2xl border border-border bg-white p-5 shadow-sm transition hover:border-brand-light hover:shadow-md"
              >
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-surface-muted text-brand">
                    <Building2 className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-lg font-bold text-ink-950">{company.name}</h3>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <AppBadge variant="slate">{company.industry}</AppBadge>
                      <AppBadge variant="slate">{company.region}</AppBadge>
                    </div>
                  </div>
                </div>
                <p className="mt-4 line-clamp-2 text-sm leading-6 text-ink-700">
                  {company.description}
                </p>
                <Link
                  href={`/companies/${company.id}`}
                  className="mt-5 inline-flex text-sm font-bold text-brand transition hover:text-brand-hover"
                >
                  기업 상세 보기 →
                </Link>
              </article>
            ))}
          </div>
        </section>

        <section>
          <div className="mb-4">
            <h2 className="text-2xl font-bold text-ink-950">최근 활동</h2>
            <p className="mt-1 text-sm text-ink-400">
              조회, 문의, 매칭, 메시지를 최신순으로 확인하세요.
            </p>
          </div>

          <div className="divide-y divide-border rounded-2xl border border-border bg-white shadow-sm">
            {recentActivities.map((activity) => {
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
      </div>
    </div>
  )
}
