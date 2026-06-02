import Link from 'next/link'
import { ArrowRight, Factory, Sparkles } from 'lucide-react'

export default function Home() {
  return (
    <main className="min-h-screen bg-surface-muted px-4 py-16 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl text-center">
        <span className="inline-flex items-center gap-2 rounded-full bg-brand-light px-4 py-1.5 text-sm font-semibold text-brand">
          <Sparkles className="h-4 w-4" />
          Rootmatching
        </span>
        <h1 className="mt-6 text-4xl font-bold tracking-tight text-ink-950 sm:text-5xl">
          뿌리산업 B2B 수주를 한곳에서 매칭합니다
        </h1>
        <p className="mt-4 text-lg leading-8 text-ink-700">
          6대 뿌리공정(금형, 소성가공, 주조, 용접, 표면처리, 열처리)을 다루는 공장과 발주처를
          연결하는 플랫폼입니다.
        </p>
        <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            href="/quotes"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand px-6 py-3 text-base font-semibold text-white transition hover:bg-brand-hover"
          >
            <Factory className="h-5 w-5" />
            견적 모집 게시판 보기
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/request"
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-white px-6 py-3 text-base font-semibold text-ink-700 transition hover:border-brand hover:text-brand"
          >
            견적 요청하기
          </Link>
        </div>
      </div>
    </main>
  )
}
