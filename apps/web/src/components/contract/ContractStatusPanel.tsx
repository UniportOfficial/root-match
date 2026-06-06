'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { ArrowRight, ExternalLink, RefreshCw, RotateCcw } from 'lucide-react'
import { ContractStatusSchema, type ContractStatus } from '@rootmatching/shared/schemas'
import { AppBadge } from '@/components/ui/AppBadge'
import { AppButton } from '@/components/ui/AppButton'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { cancelContract, mapContractError } from '@/lib/contracts-api'

const statusCopy: Record<
  ContractStatus,
  {
    badgeVariant: 'slate' | 'blue' | 'amber' | 'green' | 'red'
    label: string
    description: string
  }
> = {
  draft: {
    badgeVariant: 'slate',
    label: '임시저장',
    description: '계약서가 임시저장 상태입니다. 발송이 필요하면 다시 시도해 주세요.',
  },
  pending: {
    badgeVariant: 'blue',
    label: '서명 대기 중',
    description: '공장 측 서명을 기다리고 있어요. 서명을 진행하려면 아래 버튼을 누르세요.',
  },
  in_progress: {
    badgeVariant: 'amber',
    label: '서명 진행 중',
    description: '양측 서명이 진행 중입니다. 잠시 후 자동으로 상태가 갱신됩니다.',
  },
  completed: {
    badgeVariant: 'green',
    label: '서명 완료',
    description: '모든 서명이 완료되었습니다. 거래 진행 페이지로 이동합니다.',
  },
  cancelled: {
    badgeVariant: 'red',
    label: '계약 취소됨',
    description: '계약이 취소되었습니다. 매칭으로 돌아가 다시 시도해 주세요.',
  },
}

function readStatusFromPayload(payload: unknown): ContractStatus | null {
  if (typeof payload !== 'object' || payload === null || !('status' in payload)) return null
  const parsed = ContractStatusSchema.safeParse(payload.status)
  return parsed.success ? parsed.data : null
}

function readUrlFromPayload(payload: unknown): string | null {
  if (typeof payload !== 'object' || payload === null || !('url' in payload)) return null
  const value = payload.url
  return typeof value === 'string' && value.length > 0 ? value : null
}

interface ContractStatusPanelProps {
  apiUrl: string
  contractId: string
  fallbackTransactionId: string
  onCompletedStatus: () => void
  onStartTransaction: () => void
}

export function ContractStatusPanel({
  apiUrl,
  contractId,
  fallbackTransactionId,
  onCompletedStatus,
  onStartTransaction,
}: ContractStatusPanelProps) {
  const [status, setStatus] = useState<ContractStatus>('pending')
  const [hasFetched, setHasFetched] = useState(false)
  const [statusMessage, setStatusMessage] = useState(
    '계약 발송이 완료되었습니다. 상태를 확인하고 있어요.',
  )
  const [actionMessage, setActionMessage] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [signLoading, setSignLoading] = useState(false)
  const [resendLoading, setResendLoading] = useState(false)
  const [cancelLoading, setCancelLoading] = useState(false)
  const [cancelDialogError, setCancelDialogError] = useState<string | null>(null)
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false)
  const completedNotifiedRef = useRef(false)

  const refreshStatus = useCallback(async () => {
    try {
      const response = await fetch(`${apiUrl}/contracts/${contractId}`, {
        credentials: 'include',
      })

      if (response.status === 401) {
        console.warn('Contract status fetch returned 401; keeping last-known status')
        setStatusMessage(
          '로그인 확인이 필요할 수 있어요. 현재 보이는 상태는 마지막으로 확인된 상태입니다.',
        )
        setHasFetched(true)
        return
      }

      if (!response.ok) {
        console.warn(`Contract status fetch returned ${response.status}`)
        setErrorMessage('계약 상태를 잠시 불러오지 못했어요. 버튼은 계속 사용할 수 있습니다.')
        setHasFetched(true)
        return
      }

      const payload: unknown = await response.json()
      const nextStatus = readStatusFromPayload(payload)
      if (!nextStatus) {
        console.warn('Contract status response did not include a valid status', payload)
        setErrorMessage('계약 상태 응답을 확인하지 못했어요. 잠시 후 자동으로 다시 확인합니다.')
        setHasFetched(true)
        return
      }

      setStatus(nextStatus)
      setHasFetched(true)
      setErrorMessage(null)
      setStatusMessage('계약 상태가 최신 정보로 갱신되었습니다.')
    } catch (error) {
      console.warn('Contract status API unreachable; keeping last-known status', error)
      setErrorMessage('계약 상태 확인이 지연되고 있어요. 아래 버튼으로 계속 진행할 수 있습니다.')
      setHasFetched(true)
    }
  }, [apiUrl, contractId])

  useEffect(() => {
    void refreshStatus()
  }, [refreshStatus])

  useEffect(() => {
    function onFocus() {
      void refreshStatus()
    }

    function onVisibilityChange() {
      if (document.visibilityState === 'visible') {
        void refreshStatus()
      }
    }

    window.addEventListener('focus', onFocus)
    document.addEventListener('visibilitychange', onVisibilityChange)
    return () => {
      window.removeEventListener('focus', onFocus)
      document.removeEventListener('visibilitychange', onVisibilityChange)
    }
  }, [refreshStatus])

  useEffect(() => {
    if (status !== 'pending' && status !== 'in_progress') return undefined
    const intervalId = window.setInterval(() => {
      void refreshStatus()
    }, 30000)
    return () => window.clearInterval(intervalId)
  }, [refreshStatus, status])

  useEffect(() => {
    if (status !== 'completed' || completedNotifiedRef.current) return
    completedNotifiedRef.current = true
    onCompletedStatus()
  }, [onCompletedStatus, status])

  async function openSigningUrl() {
    setSignLoading(true)
    setActionMessage(null)
    setErrorMessage(null)
    try {
      const redirectUrl = encodeURIComponent(`${window.location.origin}/contract`)
      const response = await fetch(
        `${apiUrl}/contracts/${contractId}/embed/sign?redirectUrl=${redirectUrl}`,
        { credentials: 'include' },
      )

      if (!response.ok) {
        console.warn(`Contract signing embed returned ${response.status}`)
        setErrorMessage('서명 화면을 열지 못했어요. 잠시 후 다시 눌러 주세요.')
        return
      }

      const payload: unknown = await response.json()
      const url = readUrlFromPayload(payload)
      if (!url) {
        console.warn('Contract signing embed response did not include a valid URL', payload)
        setErrorMessage('서명 주소를 확인하지 못했어요. 잠시 후 다시 시도해 주세요.')
        return
      }

      window.open(url, '_blank', 'noopener')
      setActionMessage(
        '서명 화면을 새 창으로 열었습니다. 완료 후 이 화면으로 돌아오면 자동으로 갱신됩니다.',
      )
    } catch (error) {
      console.warn('Contract signing embed API unreachable', error)
      setErrorMessage('서명 화면 연결이 지연되고 있어요. 네트워크를 확인한 뒤 다시 눌러 주세요.')
    } finally {
      setSignLoading(false)
    }
  }

  async function resendSigningNotice() {
    setResendLoading(true)
    setActionMessage(null)
    setErrorMessage(null)
    try {
      const response = await fetch(`${apiUrl}/contracts/${contractId}/send`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resend: true }),
      })

      if (!response.ok) {
        console.warn(`Contract resend returned ${response.status}`)
        setErrorMessage('서명 알림을 다시 보내지 못했어요. 잠시 후 다시 시도해 주세요.')
        return
      }

      setActionMessage('서명 재발송 알림을 보냈습니다. 상태도 다시 확인하고 있어요.')
      await refreshStatus()
    } catch (error) {
      console.warn('Contract resend API unreachable', error)
      setErrorMessage('서명 재발송 연결이 지연되고 있어요. 잠시 후 다시 눌러 주세요.')
    } finally {
      setResendLoading(false)
    }
  }

  const handleCancel = useCallback(async () => {
    setCancelLoading(true)
    setErrorMessage(null)
    setActionMessage(null)
    setCancelDialogError(null)
    try {
      const response = await cancelContract({ apiUrl, contractId })
      if (!response.ok) {
        const message = await mapContractError(response)
        setCancelDialogError(message)
        return
      }
      setStatus('cancelled')
      setActionMessage('계약이 취소되었습니다.')
      setCancelDialogError(null)
      setCancelDialogOpen(false)
    } catch (error) {
      console.warn('Contract cancel failed', error)
      const message =
        error instanceof DOMException && error.name === 'AbortError'
          ? '요청 시간이 너무 오래 걸려요. 다시 시도해주세요'
          : '서버 응답이 지연되고 있어요. 잠시 후 다시 시도해주세요'
      setCancelDialogError(message)
    } finally {
      setCancelLoading(false)
    }
  }, [apiUrl, contractId])

  const copy = statusCopy[status]
  const showSigningActions = status === 'pending' || status === 'in_progress'

  return (
    <Card className="border-brand-light bg-card shadow-ct-card">
      <CardHeader className="p-5 pb-3 sm:p-7 sm:pb-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="text-kr-pretty text-[20px] font-bold text-foreground sm:text-[22px]">
              계약 상태
            </CardTitle>
            <CardDescription className="text-kr-pretty mt-2 text-base leading-7 text-muted-foreground">
              전자서명 진행 상황을 이 화면에서 바로 확인할 수 있습니다.
            </CardDescription>
          </div>
          <AppBadge variant={copy.badgeVariant} size="lg" className="self-start sm:self-center">
            {copy.label}
          </AppBadge>
        </div>
      </CardHeader>
      <CardContent className="space-y-5 p-5 pt-2 sm:p-7 sm:pt-3">
        <div className="rounded-2xl border border-brand-light bg-brand-light/30 p-5 shadow-ct-soft">
          <p className="text-kr-pretty text-base font-semibold leading-8 text-foreground">
            {hasFetched
              ? copy.description
              : '발송 완료 후 계약 상태를 확인하고 있어요. 잠시만 기다려 주세요.'}
          </p>
          <p className="text-kr-pretty mt-2 flex items-center gap-2 text-[15px] leading-7 text-muted-foreground">
            <RefreshCw className="h-4 w-4" aria-hidden="true" />
            {statusMessage}
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          {showSigningActions ? (
            <>
              <AppButton
                size="lg"
                fullWidth
                loading={signLoading}
                disabled={resendLoading || cancelLoading}
                onClick={() => void openSigningUrl()}
              >
                <ExternalLink className="h-5 w-5" aria-hidden="true" />
                서명하러 가기
              </AppButton>
              <AppButton
                variant="secondary"
                size="md"
                fullWidth
                loading={resendLoading}
                disabled={signLoading || cancelLoading}
                onClick={() => void resendSigningNotice()}
              >
                <RotateCcw className="h-5 w-5" aria-hidden="true" />
                서명 재발송 알림
              </AppButton>
              <AlertDialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
                <AlertDialogTrigger asChild>
                  <AppButton
                    variant="danger"
                    size="md"
                    fullWidth
                    loading={cancelLoading}
                    disabled={signLoading || resendLoading}
                    onClick={() => {
                      setCancelDialogOpen(true)
                      setCancelDialogError(null)
                    }}
                  >
                    계약 취소
                  </AppButton>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>이 계약을 취소하시겠어요?</AlertDialogTitle>
                    <AlertDialogDescription className="text-[15px] leading-7">
                      취소된 계약은 되돌릴 수 없습니다.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  {cancelDialogError ? (
                    <div
                      role="alert"
                      className="mt-2 rounded-lg bg-danger-bg p-3 text-[15px] font-semibold text-danger"
                    >
                      {cancelDialogError}
                    </div>
                  ) : null}
                  <AlertDialogFooter>
                    <AlertDialogCancel disabled={cancelLoading}>닫기</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={(event) => {
                        event.preventDefault()
                        void handleCancel()
                      }}
                      disabled={cancelLoading}
                      className="bg-danger text-white hover:bg-danger/90"
                    >
                      계약 취소하기
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </>
          ) : null}

          {status === 'completed' ? (
            <AppButton size="lg" fullWidth onClick={onStartTransaction}>
              <ArrowRight className="h-5 w-5" aria-hidden="true" />
              거래 시작하기
            </AppButton>
          ) : null}
        </div>

        {actionMessage ? (
          <p className="text-kr-pretty rounded-xl border border-success/30 bg-success-bg p-4 text-[15px] font-semibold leading-7 text-success">
            {actionMessage}
          </p>
        ) : null}
        {errorMessage ? (
          <div className="space-y-3 rounded-xl border border-danger/30 bg-danger-bg p-4">
            <p className="text-kr-pretty text-[15px] font-semibold leading-7 text-danger">
              {errorMessage}
            </p>
            <AppButton variant="secondary" size="md" fullWidth onClick={onStartTransaction}>
              거래 진행으로 이동
            </AppButton>
          </div>
        ) : null}

        <p className="text-kr-pretty text-center text-[15px] leading-7 text-muted-foreground">
          계약 번호 {contractId} · 데모 거래 번호 {fallbackTransactionId}
        </p>
      </CardContent>
    </Card>
  )
}
