'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Factory, Sparkles } from 'lucide-react'
import { AppButton } from '@/components/ui/AppButton'
import { mockCurrentUser, mockFactoryUser } from '@/data/users'
import { useUserDispatch } from '@/state/UserContext'

export default function RoleSelectPage() {
  const router = useRouter()
  const dispatch = useUserDispatch()

  function startAsClient() {
    dispatch({ type: 'user/login', payload: mockCurrentUser })
    router.push('/request')
  }

  function startAsFactory() {
    dispatch({ type: 'user/login', payload: mockFactoryUser })
    router.push('/factory/onboarding')
  }

  return (
    <main className="min-h-screen bg-surface-muted px-4 py-16 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        <header className="mb-10 text-center">
          <span className="inline-flex items-center gap-2 rounded-full bg-brand-light px-4 py-1.5 text-sm font-semibold text-brand">
            <Sparkles className="h-4 w-4" />
            Rootmatching 시작 설정
          </span>
          <h1 className="mt-5 text-3xl font-bold text-ink-950 sm:text-4xl">
            어떤 역할로 시작하시나요?
          </h1>
          <p className="mt-4 text-lg leading-8 text-ink-700">
            발주처는 견적을 요청하고, 공장은 견적을 제출합니다.
          </p>
        </header>

        <section className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <article className="rounded-2xl border border-border bg-white p-6 shadow-sm transition hover:border-brand-light hover:shadow-md sm:p-8">
            <Sparkles className="h-12 w-12 text-brand" />
            <h2 className="mt-6 text-2xl font-bold text-ink-950">발주처로 시작</h2>
            <p className="mt-3 min-h-16 text-base leading-7 text-ink-700">
              제작 의뢰를 등록하고 AI 추천 공장과 매칭하세요.
            </p>
            <AppButton type="button" size="lg" fullWidth className="mt-8" onClick={startAsClient}>
              견적 요청 등록하기
            </AppButton>
          </article>

          <article className="rounded-2xl border border-border bg-white p-6 shadow-sm transition hover:border-brand-light hover:shadow-md sm:p-8">
            <Factory className="h-12 w-12 text-brand" />
            <h2 className="mt-6 text-2xl font-bold text-ink-950">공장으로 시작</h2>
            <p className="mt-3 min-h-16 text-base leading-7 text-ink-700">
              공장 프로필을 등록하고 견적 기회를 받아보세요.
            </p>
            <AppButton type="button" size="lg" fullWidth className="mt-8" onClick={startAsFactory}>
              공장 프로필 등록하기
            </AppButton>
          </article>
        </section>

        <Link
          href="/login"
          className="mt-8 inline-flex w-full justify-center text-sm font-bold text-ink-700 transition hover:text-brand"
        >
          이미 가입했어요 → 로그인
        </Link>
      </div>
    </main>
  )
}
