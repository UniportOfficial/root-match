'use client'

import { useMemo, useState, type ReactNode } from 'react'
import Link from 'next/link'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle,
  ClipboardCheck,
  Factory,
  FileUp,
  Gauge,
  PackageCheck,
  PencilLine,
  RefreshCw,
  ShieldCheck,
  Truck,
  UserRound,
} from 'lucide-react'
import type { TransactionUpdate } from '@rootmatching/shared'
import { AppBadge } from '@/components/ui/AppBadge'
import { ProcessStepper } from '@/components/ui/ProcessStepper'
import { transactionCases, transactionSteps } from '@/data/transactionData'
import { cn } from '@/lib/cn'

type ViewerRole = 'client' | 'factory'

function clampProgress(value: number): number {
  return Math.min(100, Math.max(0, value))
}

function getProgressStage(rate: number): string {
  if (rate >= 100) return '납품 및 검수 단계'
  if (rate >= 75) return '마감 작업 및 출하 준비'
  if (rate >= 50) return '주요 가공/제작 진행'
  if (rate >= 25) return '자재 입고 및 초도 작업'
  return '계약/작업 준비'
}

export default function TransactionProgressPage() {
  const params = useParams<{ id: string }>()
  const searchParams = useSearchParams()
  const router = useRouter()
  const transaction = transactionCases.find((item) => item.id === params.id)
  const initialRole: ViewerRole =
    searchParams.get('mode') === 'factory' || transaction?.myRole === 'factory'
      ? 'factory'
      : 'client'
  const [viewerRole, setViewerRole] = useState<ViewerRole>(initialRole)
  const [progressInput, setProgressInput] = useState(transaction?.progressRate ?? 0)
  const [updateTitle, setUpdateTitle] = useState('')
  const [updateDescription, setUpdateDescription] = useState('')
  const [localUpdates, setLocalUpdates] = useState<TransactionUpdate[]>([])

  const currentProgress = clampProgress(progressInput)
  const progressStage = getProgressStage(currentProgress)
  const canUpdateProgress =
    transaction?.myRole === 'factory' || searchParams.get('mode') === 'factory'

  const progressCheckpoints = useMemo(
    () => [
      { label: '계약/결제 완료', percent: 10, done: currentProgress >= 10 },
      { label: '자재 준비', percent: 25, done: currentProgress >= 25 },
      { label: '주요 제작 진행', percent: 50, done: currentProgress >= 50 },
      { label: '마감/품질 확인', percent: 75, done: currentProgress >= 75 },
      { label: '납품/검수 대기', percent: 100, done: currentProgress >= 100 },
    ],
    [currentProgress],
  )

  if (!transaction) {
    return (
      <div className="min-h-screen bg-surface-muted px-4 py-8 sm:px-6 lg:px-8">
        <main className="mx-auto flex min-h-[60vh] max-w-3xl items-center justify-center">
          <section className="w-full rounded-2xl border border-border bg-white p-12 text-center shadow-sm">
            <Truck className="mx-auto h-12 w-12 text-ink-400" />
            <h1 className="mt-4 text-2xl font-bold text-ink-950">거래를 찾을 수 없습니다.</h1>
            <Link
              href="/transactions"
              className="mt-6 inline-flex items-center justify-center gap-2 rounded-xl bg-brand px-5 py-3 text-sm font-bold text-white transition hover:bg-brand-hover"
            >
              목록으로 돌아가기
            </Link>
          </section>
        </main>
      </div>
    )
  }

  const displayedUpdates = [...localUpdates, ...transaction.updates]

  function submitProgressUpdate() {
    const title = updateTitle.trim() || progressStage
    const description =
      updateDescription.trim() || `공장이 현재 진행률을 ${currentProgress}%로 업데이트했습니다.`

    setLocalUpdates((updates) => [
      {
        title,
        description,
        date: new Date().toLocaleString('ko-KR', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
        }),
      },
      ...updates,
    ])
    setUpdateTitle('')
    setUpdateDescription('')
  }

  return (
    <div className="min-h-screen bg-surface-muted px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <Link
          href="/transactions"
          className="mb-5 inline-flex items-center gap-2 text-sm font-bold text-ink-700 transition hover:text-brand"
        >
          <ArrowLeft className="h-4 w-4" />
          거래 진행 현황으로 돌아가기
        </Link>

        <header className="mb-8 rounded-2xl border border-brand-light bg-white p-6 shadow-sm sm:p-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <AppBadge variant="blue">
                <ShieldCheck className="h-4 w-4" />
                거래 진행 관리
              </AppBadge>
              <p className="mt-5 text-sm font-bold text-ink-400">{transaction.id}</p>
              <h1 className="mt-2 text-3xl font-bold tracking-normal text-ink-950 sm:text-4xl">
                {transaction.projectName}
              </h1>
              <p className="mt-3 max-w-3xl text-lg leading-8 text-ink-700">
                요청자는 공장의 작업 현황을 확인하고, 공장은 현재 작업 단계와 진행률을
                업데이트합니다.
              </p>
            </div>

            <div className="inline-flex rounded-xl border border-border bg-surface-muted p-1">
              {canUpdateProgress && (
                <RoleButton
                  active={viewerRole === 'client'}
                  onClick={() => setViewerRole('client')}
                >
                  <UserRound className="h-4 w-4" />
                  요청자 보기
                </RoleButton>
              )}
              <RoleButton
                active={viewerRole === 'factory'}
                onClick={() => setViewerRole('factory')}
              >
                <Factory className="h-4 w-4" />
                공장 입력
              </RoleButton>
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 gap-8 xl:grid-cols-[minmax(0,1fr)_380px]">
          <main className="space-y-8">
            <section className="rounded-2xl border border-border bg-white p-5 shadow-sm sm:p-7">
              <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-ink-950">현재 진행 위치</h2>
                  <p className="mt-1 text-sm text-ink-400">{progressStage}</p>
                </div>
                <AppBadge variant={transaction.statusKey === 'delayed' ? 'amber' : 'blue'}>
                  <CheckCircle className="h-4 w-4" />
                  {transaction.status}
                </AppBadge>
              </div>

              <div className="rounded-2xl bg-surface-muted p-5">
                <div className="mb-3 flex items-end justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold text-ink-400">전체 진행률</p>
                    <p className="mt-1 text-4xl font-black text-ink-950">{currentProgress}%</p>
                  </div>
                  <Gauge className="h-10 w-10 text-brand" />
                </div>
                <div className="h-4 overflow-hidden rounded-full bg-white ring-1 ring-border">
                  <div
                    className="h-full rounded-full bg-brand transition-all"
                    style={{ width: `${currentProgress}%` }}
                  />
                </div>
              </div>

              <div className="mt-6 grid grid-cols-1 gap-3 md:grid-cols-5">
                {progressCheckpoints.map((checkpoint) => (
                  <div
                    key={checkpoint.label}
                    className={cn(
                      'rounded-xl border p-4',
                      checkpoint.done
                        ? 'border-brand-light bg-brand-light'
                        : 'border-border bg-white',
                    )}
                  >
                    <div
                      className={cn(
                        'mb-3 flex h-9 w-9 items-center justify-center rounded-full text-sm font-black',
                        checkpoint.done ? 'bg-brand text-white' : 'bg-surface-muted text-ink-400',
                      )}
                    >
                      {checkpoint.percent}
                    </div>
                    <p className="text-sm font-bold text-ink-700">{checkpoint.label}</p>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-2xl border border-border bg-white p-5 shadow-sm sm:p-7">
              <h2 className="mb-5 text-2xl font-bold text-ink-950">전체 거래 흐름</h2>
              <ProcessStepper steps={transactionSteps} currentStep={transaction.currentStep} />
            </section>

            <section className="rounded-2xl border border-border bg-white p-5 shadow-sm sm:p-7">
              <div className="mb-5 flex items-center gap-3">
                <RefreshCw className="h-6 w-6 text-brand" />
                <h2 className="text-2xl font-bold text-ink-950">작업 진행 업데이트</h2>
              </div>

              {viewerRole === 'factory' ? (
                <div className="mb-6 rounded-2xl border border-brand-light bg-brand-light p-5">
                  <div className="mb-5 flex items-center gap-2">
                    <PencilLine className="h-5 w-5 text-brand" />
                    <h3 className="text-lg font-bold text-ink-950">공장 진행상황 입력</h3>
                  </div>

                  <label className="block">
                    <span className="text-sm font-bold text-ink-700">현재 진행률</span>
                    <div className="mt-3 grid grid-cols-[1fr_92px] gap-3">
                      <input
                        value={progressInput}
                        onChange={(event) => setProgressInput(Number(event.target.value))}
                        type="range"
                        min="0"
                        max="100"
                        step="1"
                        className="w-full accent-brand"
                      />
                      <input
                        value={progressInput}
                        onChange={(event) => setProgressInput(Number(event.target.value))}
                        type="number"
                        min="0"
                        max="100"
                        className="h-11 rounded-xl border border-slate-300 px-3 text-right font-bold outline-none focus:border-brand focus:ring-4 focus:ring-brand-light"
                      />
                    </div>
                  </label>

                  <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <label className="block">
                      <span className="text-sm font-bold text-ink-700">작업 제목</span>
                      <input
                        value={updateTitle}
                        onChange={(event) => setUpdateTitle(event.target.value)}
                        type="text"
                        placeholder="예: 2차 가공 완료"
                        className="mt-2 h-12 w-full rounded-xl border border-slate-300 px-4 outline-none focus:border-brand focus:ring-4 focus:ring-brand-light"
                      />
                    </label>
                    <label className="block">
                      <span className="text-sm font-bold text-ink-700">상세 내용</span>
                      <input
                        value={updateDescription}
                        onChange={(event) => setUpdateDescription(event.target.value)}
                        type="text"
                        placeholder="요청자가 확인할 현재 작업 상태"
                        className="mt-2 h-12 w-full rounded-xl border border-slate-300 px-4 outline-none focus:border-brand focus:ring-4 focus:ring-brand-light"
                      />
                    </label>
                  </div>

                  <button
                    type="button"
                    onClick={submitProgressUpdate}
                    className="mt-4 inline-flex items-center justify-center rounded-xl bg-brand px-5 py-3 text-sm font-bold text-white transition hover:bg-brand-hover"
                  >
                    진행상황 업데이트
                  </button>
                </div>
              ) : (
                <div className="mb-6 rounded-2xl border border-emerald-100 bg-emerald-50 p-5">
                  <div className="flex items-start gap-3">
                    <Factory className="mt-0.5 h-5 w-5 text-emerald-700" />
                    <div>
                      <h3 className="font-bold text-ink-950">공장이 입력한 최신 진행상황</h3>
                      <p className="mt-1 text-sm leading-6 text-ink-700">
                        현재 {transaction.factory}에서 입력한 진행률은 {currentProgress}%이며,
                        단계는 {progressStage}입니다.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <ol className="space-y-4">
                {displayedUpdates.map((item) => (
                  <li
                    key={`${item.date}-${item.title}`}
                    className="rounded-xl border border-border bg-surface-muted p-4"
                  >
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <h3 className="text-lg font-bold text-ink-950">{item.title}</h3>
                        <p className="mt-1 text-base leading-7 text-ink-700">{item.description}</p>
                      </div>
                      <span className="shrink-0 text-sm font-semibold text-ink-400">
                        {item.date}
                      </span>
                    </div>
                  </li>
                ))}
              </ol>
            </section>

            <section className="rounded-2xl border border-border bg-white p-5 shadow-sm sm:p-7">
              <div className="mb-5 flex items-center gap-3">
                <Truck className="h-6 w-6 text-brand" />
                <h2 className="text-2xl font-bold text-ink-950">납품 등록 및 검수</h2>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <FilePanel
                  icon={<FileUp className="h-5 w-5 text-brand" />}
                  label="납품 자료"
                  name={transaction.deliveryFile.name}
                />
                <FilePanel
                  icon={<ClipboardCheck className="h-5 w-5 text-brand" />}
                  label="검수 결과서"
                  name={transaction.inspectionFile.name}
                />
              </div>
              <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => router.push('/transaction/review')}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-brand px-5 py-3 text-base font-bold text-white transition hover:bg-brand-hover"
                >
                  <PackageCheck className="h-6 w-6" />
                  검수 승인 및 리뷰 작성
                </button>
                <button
                  type="button"
                  onClick={() => router.push('/disputes/mediation')}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-white px-5 py-3 text-base font-bold text-ink-700 transition hover:border-brand-light hover:bg-surface-muted hover:text-brand"
                >
                  <AlertTriangle className="h-6 w-6" />
                  문제 발생, 중재 요청
                </button>
              </div>
            </section>
          </main>

          <aside className="space-y-5 xl:sticky xl:top-8 xl:self-start">
            <div className="rounded-2xl border border-border bg-white p-6 shadow-sm">
              <h2 className="text-xl font-bold text-ink-950">거래 상세 정보</h2>
              <dl className="mt-5 space-y-4">
                <DetailRow label="요청자" value={transaction.client} />
                <DetailRow label="공장" value={transaction.factory} />
                <DetailRow label="계약 금액" value={transaction.amount} />
                <DetailRow label="납기" value={transaction.dueDate} />
                <DetailRow label="최근 업데이트" value={transaction.updatedAt} />
              </dl>
            </div>

            <div className="rounded-2xl border border-brand-light bg-brand-light p-6">
              <div className="flex items-start gap-3">
                <RefreshCw className="h-6 w-6 text-brand" />
                <p className="text-base leading-7 text-ink-700">
                  요청자는 공장 입력 내용을 기준으로 진행 상태를 확인하고, 공장은 이 화면에서
                  진행률과 작업 로그를 갱신합니다.
                </p>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}

function RoleButton({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: ReactNode
}) {
  return (
    <button
      type="button"
      className={cn(
        'inline-flex h-11 items-center gap-2 rounded-lg px-4 text-sm font-bold transition',
        active ? 'bg-white text-brand shadow-sm' : 'text-ink-700 hover:text-ink-950',
      )}
      onClick={onClick}
    >
      {children}
    </button>
  )
}

function FilePanel({ icon, label, name }: { icon: ReactNode; label: string; name: string }) {
  return (
    <div className="rounded-xl border border-border bg-surface-muted p-4">
      <div className="mb-3 flex items-center gap-2 text-base font-bold text-ink-950">
        {icon}
        {label}
      </div>
      <p className="truncate text-sm text-ink-700">{name}</p>
    </div>
  )
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-ink-400">{label}</dt>
      <dd className="font-semibold text-ink-950">{value}</dd>
    </div>
  )
}
