'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { CreditCard, FileSignature, Settings, ShieldCheck } from 'lucide-react'
import { AppBadge } from '@/components/ui/AppBadge'
import { AppButton } from '@/components/ui/AppButton'
import { ProcessStepper } from '@/components/ui/ProcessStepper'
import { useUserState } from '@/state/UserContext'
import { useWorkflowDispatch, useWorkflowState } from '@/state/WorkflowContext'

const contractSteps = [
  { title: '계약 생성', description: '계약 조건 확인' },
  { title: '전자서명', description: '양측 서명 완료' },
  { title: '에스크로 결제', description: '대금 보호 적용' },
  { title: '작업 진행', description: '제작 진행 및 상태 업데이트' },
  { title: '납품 검수', description: '납품 자료 확인' },
]

export default function ContractPage() {
  const router = useRouter()
  const workflowState = useWorkflowState()
  const workflowDispatch = useWorkflowDispatch()
  const { currentUser, isAuthenticated } = useUserState()

  const request = workflowState.matchingResults?.request
  const selectedFactory = workflowState.selectedFactory
  const projectName = request?.projectName ?? '신규 프로젝트'
  const clientCompanyName =
    isAuthenticated && currentUser ? currentUser.company.name : '테크솔루션 주식회사'

  function completePayment() {
    if (!selectedFactory) return

    workflowDispatch({
      type: 'workflow/setContract',
      payload: {
        transactionId: 'TXN-2026-018',
        projectName,
        factoryName: selectedFactory.name,
        amount: `${selectedFactory.estimateMin}만원 ~ ${selectedFactory.estimateMax}만원`,
        dueDate: request?.desiredDeadline ?? '',
      },
    })
    workflowDispatch({ type: 'workflow/completePayment' })
    router.push('/transactions/TXN-2026-018')
  }

  if (!workflowState.hydrated) {
    return (
      <div className="min-h-screen bg-surface-muted px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto flex min-h-[60vh] max-w-5xl flex-col items-center justify-center gap-6">
          <div className="h-16 w-16 animate-spin rounded-full border-4 border-brand-light border-t-brand" />
          <div className="text-center">
            <h2 className="text-xl font-bold text-ink-950">계약 정보를 준비 중입니다</h2>
            <p className="mt-2 text-ink-400">선택한 공장과 견적 조건을 불러오고 있어요</p>
          </div>
        </div>
      </div>
    )
  }

  if (!selectedFactory) {
    return (
      <div className="min-h-screen bg-surface-muted px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto flex min-h-[60vh] max-w-3xl items-center justify-center">
          <section className="w-full rounded-2xl border border-border bg-white p-8 text-center shadow-sm sm:p-10">
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-brand-light">
              <Settings className="h-8 w-8 text-brand" />
            </div>
            <h1 className="text-2xl font-bold text-ink-950">선택한 공장이 없습니다.</h1>
            <p className="mt-3 text-base leading-7 text-ink-700">
              선택한 공장이 없습니다. 매칭에서 공장을 먼저 선택해주세요.
            </p>
            <Link
              href="/matching"
              className="mt-6 inline-flex items-center justify-center rounded-xl bg-brand px-5 py-3 text-sm font-bold text-white transition hover:bg-brand-hover focus:outline-none focus:ring-4 focus:ring-brand-light"
            >
              매칭으로 이동
            </Link>
          </section>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-surface-muted px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <header className="mb-8 rounded-2xl border border-brand-light bg-white p-6 shadow-sm sm:p-8">
          <AppBadge variant="blue">
            <FileSignature className="h-4 w-4" />
            전자 계약서 작성
          </AppBadge>
          <h1 className="mt-4 text-3xl font-bold tracking-normal text-ink-950 sm:text-4xl">
            계약 및 에스크로 결제
          </h1>
          <p className="mt-3 max-w-3xl text-lg leading-8 text-ink-700">
            선택한 공장 정보와 계약 조건을 확인하고 결제를 진행합니다.
          </p>
        </header>

        <main className="space-y-8">
          <section className="rounded-2xl border border-border bg-white p-5 shadow-sm sm:p-7">
            <div className="mb-5 flex items-center gap-3">
              <ShieldCheck className="h-6 w-6 text-brand" />
              <h2 className="text-2xl font-bold text-ink-950">계약 조건</h2>
            </div>
            <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <ContractDetail label="프로젝트명" value={projectName} />
              <ContractDetail label="발주처" value={clientCompanyName} />
              <ContractDetail label="공장" value={selectedFactory.name} />
              <ContractDetail
                label="견적 범위"
                value={`${selectedFactory.estimateMin}만원 ~ ${selectedFactory.estimateMax}만원`}
              />
              <ContractDetail label="희망 납기" value={request?.desiredDeadline ?? '-'} />
            </dl>
          </section>

          <section className="rounded-2xl border border-border bg-white p-5 shadow-sm sm:p-7">
            <h2 className="mb-5 text-2xl font-bold text-ink-950">결제 방식 선택</h2>
            <label className="flex items-start gap-4 rounded-2xl border-2 border-brand bg-brand-light/30 p-5">
              <input
                type="radio"
                name="paymentMethod"
                checked
                readOnly
                className="mt-1 h-5 w-5 border-border text-brand focus:ring-brand-light"
              />
              <span>
                <span className="flex items-center gap-2 text-lg font-bold text-ink-950">
                  <CreditCard className="h-5 w-5 text-brand" />
                  에스크로 결제 (권장)
                </span>
                <span className="mt-2 block text-sm leading-6 text-ink-700">
                  거래 완료 시까지 대금을 안전하게 보호합니다.
                </span>
              </span>
            </label>
          </section>

          <section className="rounded-2xl border border-border bg-white p-5 shadow-sm sm:p-7">
            <h2 className="mb-5 text-2xl font-bold text-ink-950">진행 단계</h2>
            <ProcessStepper steps={contractSteps} currentStep={3} />
          </section>

          <section className="rounded-2xl border border-border bg-white p-5 shadow-sm sm:p-7">
            <AppButton size="lg" fullWidth onClick={completePayment}>
              에스크로 결제 진행
            </AppButton>
            <p className="mt-3 text-center text-sm text-ink-400">
              결제 진행 시 양측 전자서명이 자동으로 완료됩니다 (목 시뮬레이션).
            </p>
          </section>
        </main>
      </div>
    </div>
  )
}

function ContractDetail({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-surface-muted p-4">
      <dt className="text-xs font-semibold text-ink-400">{label}</dt>
      <dd className="mt-2 text-base font-bold text-ink-950">{value}</dd>
    </div>
  )
}
