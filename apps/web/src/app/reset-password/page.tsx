'use client'

import { Suspense, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { AlertCircle, ArrowLeft, CheckCircle2, Lock } from 'lucide-react'
import { Logo } from '@/components/brand/Logo'
import { AppButton } from '@/components/ui/AppButton'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { authClient } from '@/lib/auth-client'

const schema = z
  .object({
    password: z.string().min(6, '비밀번호는 6자 이상이어야 합니다'),
    confirm: z.string().min(1, '비밀번호 확인을 입력해주세요'),
  })
  .refine((value) => value.password === value.confirm, {
    message: '비밀번호가 일치하지 않습니다',
    path: ['confirm'],
  })

type FormValues = z.infer<typeof schema>

function ResetPasswordForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token') ?? ''
  const [errorMessage, setErrorMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { password: '', confirm: '' },
  })

  async function submit({ password }: FormValues) {
    setErrorMessage('')
    if (!token) {
      setErrorMessage('재설정 토큰이 없습니다. 비밀번호 찾기를 다시 시도해주세요.')
      return
    }
    setIsSubmitting(true)
    const { error } = await authClient.resetPassword({
      newPassword: password,
      token,
    })
    setIsSubmitting(false)
    if (error) {
      setErrorMessage(error.message ?? '비밀번호 재설정 중 오류가 발생했습니다')
      return
    }
    router.push('/login?reset=success')
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-background px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-10">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_18%_18%,hsl(var(--accent))_0,transparent_28%),radial-gradient(circle_at_82%_12%,hsl(var(--success-subtle))_0,transparent_26%),linear-gradient(135deg,hsl(var(--background))_0%,hsl(var(--muted))_100%)]" />
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(hsl(var(--border))_1px,transparent_1px)] bg-[length:22px_22px] opacity-40" />
      <div className="mx-auto grid min-h-[calc(100vh-3rem)] max-w-md items-start py-6">
        <section className="w-full space-y-6">
          <div className="flex justify-center">
            <Logo variant="primary" size="lg" priority />
          </div>
          <Card className="overflow-hidden rounded-3xl border border-border/70 bg-card/95 shadow-ct-card backdrop-blur-xl">
            <CardHeader className="space-y-3 p-5 pb-0 sm:p-7 sm:pb-0">
              <CardTitle className="text-kr-pretty text-rm-h2-m font-bold tracking-tight text-foreground sm:text-rm-h2">
                새 비밀번호 설정
              </CardTitle>
              <CardDescription className="text-kr-pretty text-rm-body-sm leading-7 text-muted-foreground sm:text-rm-body-d">
                새로 사용할 비밀번호를 입력해주세요. 6자 이상 입력해야 합니다.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-5 sm:p-7">
              <form onSubmit={form.handleSubmit(submit)} className="space-y-6 sm:space-y-7">
                {errorMessage && (
                  <p className="text-kr-pretty flex items-start gap-3 rounded-2xl border border-destructive/25 bg-destructive/10 px-4 py-3 text-rm-body-sm font-bold text-destructive">
                    <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
                    <span>{errorMessage}</span>
                  </p>
                )}
                <div className="space-y-2">
                  <Label
                    htmlFor="password"
                    className="text-kr-keep text-rm-body-d font-bold text-foreground"
                  >
                    새 비밀번호
                  </Label>
                  <div className="relative">
                    <span className="pointer-events-none absolute left-4 top-1/2 z-10 -translate-y-1/2 text-muted-foreground">
                      <Lock className="h-5 w-5" />
                    </span>
                    <Input
                      id="password"
                      type="password"
                      autoComplete="new-password"
                      className="h-14 rounded-2xl border-border bg-background/80 pl-12 text-rm-body shadow-toss-sm transition-all focus-visible:ring-2 focus-visible:ring-primary/30"
                      {...form.register('password')}
                    />
                  </div>
                  {form.formState.errors.password?.message && (
                    <p className="text-kr-pretty text-rm-body-sm font-semibold text-destructive">
                      {form.formState.errors.password.message}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label
                    htmlFor="confirm"
                    className="text-kr-keep text-rm-body-d font-bold text-foreground"
                  >
                    비밀번호 확인
                  </Label>
                  <div className="relative">
                    <span className="pointer-events-none absolute left-4 top-1/2 z-10 -translate-y-1/2 text-muted-foreground">
                      <CheckCircle2 className="h-5 w-5" />
                    </span>
                    <Input
                      id="confirm"
                      type="password"
                      autoComplete="new-password"
                      className="h-14 rounded-2xl border-border bg-background/80 pl-12 text-rm-body shadow-toss-sm transition-all focus-visible:ring-2 focus-visible:ring-primary/30"
                      {...form.register('confirm')}
                    />
                  </div>
                  {form.formState.errors.confirm?.message && (
                    <p className="text-kr-pretty text-rm-body-sm font-semibold text-destructive">
                      {form.formState.errors.confirm.message}
                    </p>
                  )}
                </div>
                <AppButton
                  type="submit"
                  size="lg"
                  fullWidth
                  disabled={isSubmitting}
                  loading={isSubmitting}
                  className="tap-primary rounded-2xl text-rm-body-d font-bold shadow-ct-soft"
                >
                  {isSubmitting ? '변경 중...' : '비밀번호 변경하기'}
                </AppButton>
              </form>
            </CardContent>
          </Card>
          <Link
            href="/login"
            className="text-kr-keep mx-auto inline-flex min-h-tap-min w-full items-center justify-center gap-2 rounded-2xl text-rm-body-sm font-bold text-foreground/70 transition hover:bg-card/80 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            <ArrowLeft className="h-4 w-4" />
            로그인으로
          </Link>
        </section>
      </div>
    </main>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordForm />
    </Suspense>
  )
}
