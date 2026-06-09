'use client'

import { useState } from 'react'
import Link from 'next/link'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { AlertCircle, ArrowLeft, CheckCircle2, Mail } from 'lucide-react'
import { Logo } from '@/components/brand/Logo'
import { AppButton } from '@/components/ui/AppButton'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { authClient } from '@/lib/auth-client'

const schema = z.object({
  email: z.string().email('올바른 이메일 형식이 아닙니다'),
})

type FormValues = z.infer<typeof schema>

export default function ForgotPasswordPage() {
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: '' },
  })

  async function submit({ email }: FormValues) {
    setErrorMessage('')
    setSuccessMessage('')
    setIsSubmitting(true)
    const { error } = await authClient.requestPasswordReset({
      email,
      redirectTo: '/reset-password',
    })
    setIsSubmitting(false)
    if (error) {
      setErrorMessage(error.message ?? '메일 발송 중 오류가 발생했습니다')
      return
    }
    setSuccessMessage(
      `${email}로 비밀번호 재설정 메일을 발송했어요. 메일함을 확인하고 링크를 눌러주세요.`,
    )
    form.reset()
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
                비밀번호 찾기
              </CardTitle>
              <CardDescription className="text-kr-pretty text-rm-body-sm leading-7 text-muted-foreground sm:text-rm-body-d">
                가입하신 이메일을 입력하시면 비밀번호 재설정 링크를 보내드립니다.
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
                {successMessage && (
                  <p className="text-kr-pretty flex items-start gap-3 rounded-2xl border border-success/25 bg-success-subtle px-4 py-3 text-rm-body-sm font-bold text-success">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
                    <span>{successMessage}</span>
                  </p>
                )}
                <div className="space-y-2">
                  <Label
                    htmlFor="email"
                    className="text-kr-keep text-rm-body-d font-bold text-foreground"
                  >
                    이메일
                  </Label>
                  <div className="relative">
                    <span className="pointer-events-none absolute left-4 top-1/2 z-10 -translate-y-1/2 text-muted-foreground">
                      <Mail className="h-5 w-5" />
                    </span>
                    <Input
                      id="email"
                      type="email"
                      autoComplete="email"
                      className="h-14 rounded-2xl border-border bg-background/80 pl-12 text-rm-body shadow-toss-sm transition-all focus-visible:ring-2 focus-visible:ring-primary/30"
                      {...form.register('email')}
                    />
                  </div>
                  {form.formState.errors.email?.message && (
                    <p className="text-kr-pretty text-rm-body-sm font-semibold text-destructive">
                      {form.formState.errors.email.message}
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
                  {isSubmitting ? '발송 중...' : '재설정 메일 보내기'}
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
