'use client'

import Link from 'next/link'
import { useParams } from 'next/navigation'
import {
  ArrowLeft,
  CalendarClock,
  CheckCircle,
  Circle,
  FileText,
  MessageSquareText,
  ShieldCheck,
  UserRound,
} from 'lucide-react'
import { disputeCases, disputeStatusStyles } from '@/data/disputeData'
import { cn } from '@/lib/cn'

export default function DisputeDetailPage() {
  const params = useParams<{ id: string }>()
  const dispute = disputeCases.find((item) => item.id === params.id)

  return (
    <div className="min-h-screen bg-surface-muted px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <Link
          href="/disputes"
          className="mb-5 inline-flex items-center gap-2 text-sm font-bold text-ink-700 transition hover:text-brand"
        >
          <ArrowLeft className="h-4 w-4" />
          분쟁 중재 현황으로 돌아가기
        </Link>

        {dispute ? (
          <>
            <header className="mb-8 overflow-hidden rounded-2xl border border-brand-light bg-white shadow-sm">
              <div className="grid gap-6 p-6 sm:p-8 lg:grid-cols-[1fr_320px] lg:items-start">
                <div>
                  <div className="mb-4 flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-bold text-ink-700">
                      {dispute.id}
                    </span>
                    <span
                      className={cn(
                        'rounded-full px-3 py-1 text-sm font-bold ring-1',
                        disputeStatusStyles[dispute.status],
                      )}
                    >
                      {dispute.statusLabel}
                    </span>
                    <span className="rounded-full bg-brand-light px-3 py-1 text-sm font-bold text-brand">
                      {dispute.type}
                    </span>
                  </div>
                  <h1 className="text-3xl font-bold tracking-normal text-ink-950 sm:text-4xl">
                    {dispute.projectName}
                  </h1>
                  <p className="mt-3 max-w-3xl text-lg leading-8 text-ink-700">{dispute.summary}</p>
                </div>

                <div className="rounded-xl border border-brand-light bg-brand-light p-5">
                  <div className="mb-2 flex items-center justify-between text-sm">
                    <span className="font-semibold text-brand">현재 진행률</span>
                    <span className="font-bold text-ink-950">{dispute.progress}%</span>
                  </div>
                  <div className="h-3 rounded-full bg-white">
                    <div
                      className="h-3 rounded-full bg-brand"
                      style={{ width: `${dispute.progress}%` }}
                    />
                  </div>
                  <p className="mt-4 text-sm font-semibold leading-6 text-ink-700">
                    다음 조치: {dispute.nextAction}
                  </p>
                </div>
              </div>
            </header>

            <div className="grid grid-cols-1 gap-8 xl:grid-cols-[minmax(0,1fr)_360px]">
              <main className="space-y-8">
                <section className="rounded-2xl border border-border bg-white p-5 shadow-sm sm:p-7">
                  <div className="mb-6 flex items-center gap-3">
                    <ShieldCheck className="h-6 w-6 text-brand" />
                    <h2 className="text-2xl font-bold text-ink-950">현재 진행 과정</h2>
                  </div>

                  <ol className="space-y-4">
                    {dispute.steps.map((step) => (
                      <li
                        key={step.title}
                        className={cn(
                          'flex gap-4 rounded-xl border p-4',
                          step.completed
                            ? 'border-brand-light bg-brand-light'
                            : 'border-border bg-white',
                        )}
                      >
                        {step.completed ? (
                          <CheckCircle className="mt-1 h-6 w-6 shrink-0 text-brand" />
                        ) : (
                          <Circle className="mt-1 h-6 w-6 shrink-0 text-slate-300" />
                        )}
                        <div>
                          <h3 className="text-lg font-bold text-ink-950">{step.title}</h3>
                          <p className="mt-1 text-base leading-7 text-ink-700">
                            {step.description}
                          </p>
                        </div>
                      </li>
                    ))}
                  </ol>
                </section>

                <section className="rounded-2xl border border-border bg-white p-5 shadow-sm sm:p-7">
                  <div className="mb-6 flex items-center gap-3">
                    <MessageSquareText className="h-6 w-6 text-brand" />
                    <h2 className="text-2xl font-bold text-ink-950">진행 이력</h2>
                  </div>

                  <div className="space-y-4">
                    {dispute.timeline.map((item) => (
                      <div
                        key={`${item.title}-${item.date}`}
                        className="rounded-xl border border-border bg-surface-muted p-4"
                      >
                        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                          <h3 className="text-base font-bold text-ink-950">{item.title}</h3>
                          <span className="text-sm font-semibold text-ink-400">{item.date}</span>
                        </div>
                        <p className="mt-2 text-base leading-7 text-ink-700">{item.description}</p>
                      </div>
                    ))}
                  </div>
                </section>
              </main>

              <aside className="space-y-6 xl:sticky xl:top-8 xl:self-start">
                <section className="rounded-2xl border border-border bg-white p-6 shadow-sm">
                  <div className="mb-5 flex items-center gap-3">
                    <FileText className="h-6 w-6 text-brand" />
                    <h2 className="text-xl font-bold text-ink-950">상세 정보</h2>
                  </div>
                  <dl className="space-y-4">
                    <DetailItem label="요청자" value={dispute.requester} />
                    <DetailItem label="상대방" value={dispute.respondent} />
                    <DetailItem label="계약일" value={dispute.contractDate} />
                    <DetailItem label="납기" value={dispute.dueDate} />
                    <DetailItem label="계약 금액" value={dispute.amount} />
                  </dl>
                </section>

                <section className="rounded-2xl border border-border bg-white p-6 shadow-sm">
                  <div className="mb-5 flex items-center gap-3">
                    <UserRound className="h-6 w-6 text-brand" />
                    <h2 className="text-xl font-bold text-ink-950">담당 중재자</h2>
                  </div>
                  <p className="text-base font-bold text-ink-950">{dispute.mediator}</p>
                  <p className="mt-2 text-sm leading-6 text-ink-700">
                    최근 업데이트: {dispute.updatedAt}
                  </p>
                </section>

                <section className="rounded-2xl border border-border bg-white p-6 shadow-sm">
                  <div className="mb-5 flex items-center gap-3">
                    <CalendarClock className="h-6 w-6 text-brand" />
                    <h2 className="text-xl font-bold text-ink-950">요청 해결안</h2>
                  </div>
                  <p className="text-base leading-7 text-ink-700">{dispute.requestedResolution}</p>
                </section>

                <section className="rounded-2xl border border-border bg-white p-6 shadow-sm">
                  <h2 className="mb-4 text-xl font-bold text-ink-950">증빙 자료</h2>
                  <ul className="space-y-3">
                    {dispute.evidenceFiles.map((file) => (
                      <li
                        key={file}
                        className="flex items-center gap-3 rounded-lg bg-surface-muted px-4 py-3 text-sm font-semibold text-ink-700"
                      >
                        <FileText className="h-4 w-4 shrink-0 text-ink-400" />
                        <span className="truncate">{file}</span>
                      </li>
                    ))}
                  </ul>
                </section>
              </aside>
            </div>
          </>
        ) : (
          <section className="rounded-2xl border border-border bg-white p-8 text-center shadow-sm">
            <h1 className="text-2xl font-bold text-ink-950">분쟁 정보를 찾을 수 없습니다.</h1>
            <p className="mt-2 text-ink-700">목록에서 다시 확인해 주세요.</p>
            <Link
              href="/disputes"
              className="mt-6 inline-flex items-center justify-center rounded-xl bg-brand px-5 py-3 text-sm font-bold text-white transition hover:bg-brand-hover"
            >
              분쟁 목록으로 돌아가기
            </Link>
          </section>
        )}
      </div>
    </div>
  )
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-sm font-semibold text-ink-400">{label}</dt>
      <dd className="mt-1 text-base font-bold text-ink-950">{value}</dd>
    </div>
  )
}
