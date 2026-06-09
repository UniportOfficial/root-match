'use client'

import { Suspense, useEffect, useState, type ReactNode } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { zodResolver } from '@hookform/resolvers/zod'
import { Controller, useForm } from 'react-hook-form'
import { z } from 'zod'
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Factory,
  Lock,
  Mail,
  ShoppingCart,
  Sparkles,
  User,
} from 'lucide-react'
import { Logo } from '@/components/brand/Logo'
import { AppButton } from '@/components/ui/AppButton'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { authClient } from '@/lib/auth-client'

type AuthTab = 'login' | 'register'

const loginSchema = z.object({
  email: z.string().email('올바른 이메일 형식이 아닙니다'),
  password: z.string().min(6, '비밀번호는 6자 이상이어야 합니다'),
})

const registerSchema = z.object({
  email: z.string().email('올바른 이메일 형식이 아닙니다'),
  password: z.string().min(6, '비밀번호는 6자 이상이어야 합니다'),
  name: z.string().min(1, '이름을 입력해주세요'),
  accountType: z.enum(['client', 'factory']),
  terms: z.boolean().refine((value) => value, '약관 동의가 필요합니다'),
})

type LoginFormValues = z.infer<typeof loginSchema>
type RegisterFormValues = z.input<typeof registerSchema>

const tabStyles: Record<AuthTab, string> = {
  login: '로그인',
  register: '회원가입',
}

function resolveRedirectTarget(fallback: string): string {
  if (typeof window === 'undefined') return fallback
  const target = new URLSearchParams(window.location.search).get('redirectTo')
  if (!target) return fallback
  if (!target.startsWith('/')) return fallback
  if (target.startsWith('//')) return fallback
  return target
}

function LoginPageContent() {
  const [activeTab, setActiveTab] = useState<AuthTab>('login')
  const [submitError, setSubmitError] = useState('')
  const [registerSuccess, setRegisterSuccess] = useState('')
  const [resetSuccess, setResetSuccess] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    if (searchParams.get('reset') === 'success') {
      setResetSuccess('비밀번호가 변경되었습니다. 새 비밀번호로 로그인해주세요.')
    }
  }, [searchParams])
  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  })
  const registerForm = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: '',
      password: '',
      name: '',
      accountType: 'client',
      terms: false,
    },
  })

  async function submitLogin(values: LoginFormValues) {
    setSubmitError('')
    setRegisterSuccess('')
    setIsSubmitting(true)
    const { error } = await authClient.signIn.email({
      email: values.email,
      password: values.password,
    })
    setIsSubmitting(false)
    if (error) {
      setSubmitError(error.message ?? '이메일 또는 비밀번호가 올바르지 않습니다')
      return
    }
    router.push(resolveRedirectTarget('/dashboard'))
  }

  async function submitRegister(values: RegisterFormValues) {
    setSubmitError('')
    setRegisterSuccess('')
    setIsSubmitting(true)
    const { error } = await authClient.signUp.email({
      email: values.email,
      password: values.password,
      name: values.name,
      accountType: values.accountType,
    })
    setIsSubmitting(false)
    if (error) {
      setSubmitError(error.message ?? '회원가입 중 오류가 발생했습니다')
      return
    }
    setRegisterSuccess(
      `${values.email}로 인증 메일을 발송했어요. 메일함을 확인하고 인증 링크를 눌러 가입을 완료해주세요.`,
    )
    registerForm.reset()
  }

  function handleTabChange(value: string) {
    if (value !== 'login' && value !== 'register') return
    setActiveTab(value)
    setSubmitError('')
    setRegisterSuccess('')
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-background px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-10">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_18%_18%,hsl(var(--accent))_0,transparent_28%),radial-gradient(circle_at_82%_12%,hsl(var(--success-subtle))_0,transparent_26%),linear-gradient(135deg,hsl(var(--background))_0%,hsl(var(--muted))_100%)]" />
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(hsl(var(--border))_1px,transparent_1px)] bg-[length:22px_22px] opacity-40" />
      <div className="mx-auto grid min-h-[calc(100vh-3rem)] max-w-6xl grid-cols-1 items-start gap-8 py-6 lg:grid-cols-[minmax(0,0.92fr)_minmax(420px,500px)] lg:gap-12 lg:py-10">
        <section className="space-y-7 text-center lg:text-left">
          <div className="flex justify-center lg:justify-start">
            <Logo variant="primary" size="lg" priority />
          </div>

          <div className="space-y-5">
            <div className="inline-flex items-center gap-2 rounded-pill border border-border bg-card/80 px-4 py-2 text-kr-keep text-rm-caption font-bold text-primary shadow-toss-sm backdrop-blur-sm">
              <Sparkles className="h-4 w-4" />
              안심 계약을 위한 계정 접속
            </div>
            <h1 className="text-kr-balance text-rm-h1-m font-bold tracking-tight text-foreground sm:text-rm-h1 lg:text-rm-display">
              제조 의뢰와 공장 견적을 더 선명하게 연결합니다
            </h1>
            <p className="text-kr-pretty mx-auto max-w-2xl text-rm-body leading-8 text-muted-foreground lg:mx-0">
              RootMatch 계정으로 견적 요청, 공장 추천, 거래 진행 상황을 한곳에서 안전하게
              관리하세요.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 lg:max-w-2xl">
            {['역할별 화면 안내', '인증 메일 확인', '안심 거래 흐름'].map((item) => (
              <div
                key={item}
                className="flex min-h-tap-min items-center justify-center gap-2 rounded-2xl border border-border bg-card/75 px-4 py-3 text-kr-keep text-rm-body-sm font-bold text-foreground shadow-toss-sm backdrop-blur-sm"
              >
                <CheckCircle2 className="h-5 w-5 text-primary" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="w-full">
          <Card className="overflow-hidden rounded-3xl border border-border/70 bg-card/95 shadow-ct-card backdrop-blur-xl">
            <CardHeader className="space-y-3 p-5 pb-0 sm:p-7 sm:pb-0">
              <CardTitle className="text-kr-pretty text-rm-h2-m font-bold tracking-tight text-foreground sm:text-rm-h2">
                시작할 계정을 선택하세요
              </CardTitle>
              <CardDescription className="text-kr-pretty text-rm-body-sm leading-7 text-muted-foreground sm:text-rm-body-d">
                기존 계정은 로그인하고, 처음이라면 역할을 선택해 가입을 진행하세요.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-5 sm:p-7">
              <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-5">
                <TabsList className="grid h-auto w-full grid-cols-2 rounded-2xl border border-border bg-muted/70 p-1.5 shadow-inner">
                  {(['login', 'register'] as const).map((tab) => (
                    <TabsTrigger
                      key={tab}
                      value={tab}
                      className="min-h-tap-min rounded-xl text-kr-keep text-rm-body-d font-bold text-muted-foreground transition-all data-[state=active]:bg-card data-[state=active]:text-primary data-[state=active]:shadow-ct-soft"
                    >
                      {tabStyles[tab]}
                    </TabsTrigger>
                  ))}
                </TabsList>

                {submitError && (
                  <AuthNotice tone="error" icon={<AlertCircle className="h-5 w-5" />}>
                    {submitError}
                  </AuthNotice>
                )}

                {registerSuccess && (
                  <AuthNotice tone="success" icon={<CheckCircle2 className="h-5 w-5" />}>
                    {registerSuccess}
                  </AuthNotice>
                )}

                {resetSuccess && (
                  <AuthNotice tone="success" icon={<CheckCircle2 className="h-5 w-5" />}>
                    {resetSuccess}
                  </AuthNotice>
                )}

                <TabsContent value="login" className="mt-0">
                  <form
                    onSubmit={loginForm.handleSubmit(submitLogin)}
                    className="space-y-6 sm:space-y-7"
                  >
                    <Field
                      htmlFor="login-email"
                      label="이메일"
                      icon={<Mail className="h-5 w-5" />}
                      error={loginForm.formState.errors.email?.message}
                    >
                      <Input
                        id="login-email"
                        type="email"
                        autoComplete="email"
                        className="h-14 rounded-2xl border-border bg-background/80 pl-12 text-rm-body shadow-toss-sm transition-all focus-visible:ring-2 focus-visible:ring-primary/30"
                        {...loginForm.register('email')}
                      />
                    </Field>
                    <Field
                      htmlFor="login-password"
                      label="비밀번호"
                      icon={<Lock className="h-5 w-5" />}
                      error={loginForm.formState.errors.password?.message}
                    >
                      <Input
                        id="login-password"
                        type="password"
                        autoComplete="current-password"
                        className="h-14 rounded-2xl border-border bg-background/80 pl-12 text-rm-body shadow-toss-sm transition-all focus-visible:ring-2 focus-visible:ring-primary/30"
                        {...loginForm.register('password')}
                      />
                    </Field>
                    <AppButton
                      type="submit"
                      size="lg"
                      fullWidth
                      disabled={isSubmitting}
                      loading={isSubmitting}
                      className="tap-primary rounded-2xl text-rm-body-d font-bold shadow-ct-soft"
                    >
                      {isSubmitting ? '로그인 중...' : '로그인'}
                    </AppButton>
                    <Link
                      href="/forgot-password"
                      className="text-kr-keep mx-auto inline-flex min-h-tap-min items-center justify-center text-rm-body-sm font-bold text-primary transition hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                    >
                      비밀번호를 잊으셨나요?
                    </Link>
                  </form>
                </TabsContent>

                <TabsContent value="register" className="mt-0">
                  <form
                    onSubmit={registerForm.handleSubmit(submitRegister)}
                    className="space-y-6 sm:space-y-7"
                  >
                    <Field
                      htmlFor="register-name"
                      label="이름"
                      icon={<User className="h-5 w-5" />}
                      error={registerForm.formState.errors.name?.message}
                    >
                      <Input
                        id="register-name"
                        type="text"
                        className="h-14 rounded-2xl border-border bg-background/80 pl-12 text-rm-body shadow-toss-sm transition-all focus-visible:ring-2 focus-visible:ring-primary/30"
                        {...registerForm.register('name')}
                      />
                    </Field>
                    <Field
                      htmlFor="register-email"
                      label="이메일"
                      icon={<Mail className="h-5 w-5" />}
                      error={registerForm.formState.errors.email?.message}
                    >
                      <Input
                        id="register-email"
                        type="email"
                        autoComplete="email"
                        className="h-14 rounded-2xl border-border bg-background/80 pl-12 text-rm-body shadow-toss-sm transition-all focus-visible:ring-2 focus-visible:ring-primary/30"
                        {...registerForm.register('email')}
                      />
                    </Field>
                    <Field
                      htmlFor="register-password"
                      label="비밀번호"
                      icon={<Lock className="h-5 w-5" />}
                      error={registerForm.formState.errors.password?.message}
                    >
                      <Input
                        id="register-password"
                        type="password"
                        autoComplete="new-password"
                        className="h-14 rounded-2xl border-border bg-background/80 pl-12 text-rm-body shadow-toss-sm transition-all focus-visible:ring-2 focus-visible:ring-primary/30"
                        {...registerForm.register('password')}
                      />
                    </Field>
                    <fieldset className="rounded-3xl border border-border bg-card p-4 shadow-toss-sm sm:p-5">
                      <legend className="text-kr-keep px-2 text-rm-body-d font-bold text-foreground">
                        계정 유형
                      </legend>
                      <Controller
                        control={registerForm.control}
                        name="accountType"
                        render={({ field }) => (
                          <RadioGroup
                            value={field.value}
                            onValueChange={field.onChange}
                            className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2"
                          >
                            <AccountTypeOption
                              value="client"
                              icon={<ShoppingCart className="h-6 w-6" />}
                              title="발주처"
                              description="견적을 요청하는 회사"
                            />
                            <AccountTypeOption
                              value="factory"
                              icon={<Factory className="h-6 w-6" />}
                              title="공장"
                              description="견적을 제공하는 공장"
                            />
                          </RadioGroup>
                        )}
                      />
                    </fieldset>
                    <Controller
                      control={registerForm.control}
                      name="terms"
                      render={({ field }) => (
                        <Label className="flex min-h-tap-min cursor-pointer items-start gap-3 rounded-2xl border border-border bg-background/80 p-4 text-rm-body-d font-semibold leading-7 text-foreground shadow-toss-sm transition-all hover:bg-accent/40 has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:bg-accent/60 has-[[data-state=checked]]:shadow-ct-soft">
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={(checked) => field.onChange(checked === true)}
                            className="mt-0.5 h-6 w-6 rounded-md"
                          />
                          <span className="text-kr-pretty">
                            서비스 이용약관과 개인정보 처리방침에 동의합니다.
                          </span>
                        </Label>
                      )}
                    />
                    {registerForm.formState.errors.terms?.message && (
                      <p className="text-kr-pretty text-rm-body-sm font-semibold text-destructive">
                        {registerForm.formState.errors.terms.message}
                      </p>
                    )}
                    <AppButton
                      type="submit"
                      size="lg"
                      fullWidth
                      disabled={isSubmitting}
                      loading={isSubmitting}
                      className="rounded-2xl text-rm-body-d font-bold shadow-rm-card transition-shadow hover:shadow-toss-md"
                    >
                      {isSubmitting ? '가입 중...' : '회원가입'}
                    </AppButton>
                  </form>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          <Link
            href="/"
            className="text-kr-keep mx-auto mt-5 inline-flex min-h-tap-min w-full items-center justify-center gap-2 rounded-2xl text-rm-body-sm font-bold text-foreground/70 transition hover:bg-card/80 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            <ArrowLeft className="h-4 w-4" />
            처음으로
          </Link>
        </section>
      </div>
    </main>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginPageContent />
    </Suspense>
  )
}

function AuthNotice({
  tone,
  icon,
  children,
}: {
  tone: 'error' | 'success'
  icon: ReactNode
  children: ReactNode
}) {
  const toneClass =
    tone === 'error'
      ? 'border-destructive/25 bg-destructive/10 text-destructive'
      : 'border-success/25 bg-success-subtle text-success'

  return (
    <p
      className={`text-kr-pretty flex items-start gap-3 rounded-2xl border px-4 py-3 text-rm-body-sm font-bold ${toneClass}`}
    >
      <span className="mt-0.5 shrink-0">{icon}</span>
      <span>{children}</span>
    </p>
  )
}

function AccountTypeOption({
  value,
  icon,
  title,
  description,
}: {
  value: 'client' | 'factory'
  icon: ReactNode
  title: string
  description: string
}) {
  return (
    <Label className="group relative flex min-h-[112px] cursor-pointer items-start gap-3 rounded-2xl border border-border bg-card p-4 pr-12 text-foreground shadow-toss-sm transition-all hover:border-primary/30 hover:bg-accent/40 hover:shadow-ct-soft has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-primary/30 has-[:focus-visible]:ring-offset-2 has-[:focus-visible]:ring-offset-background has-[[data-state=checked]]:border-2 has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:bg-accent has-[[data-state=checked]]:shadow-toss-md">
      <RadioGroupItem value={value} className="absolute h-5 w-5 opacity-0" />
      <CheckCircle2 className="absolute right-4 top-4 h-6 w-6 text-primary opacity-0 transition-opacity group-has-[[data-state=checked]]:opacity-100" />
      <span className="flex flex-1 flex-col gap-2">
        <span className="flex items-center gap-2 text-primary">
          {icon}
          <span className="text-kr-keep text-rm-body-d font-bold text-foreground group-has-[[data-state=checked]]:text-primary">
            {title}
          </span>
        </span>
        <span className="text-kr-pretty text-rm-body-sm font-semibold leading-6 text-muted-foreground">
          {description}
        </span>
      </span>
    </Label>
  )
}

function Field({
  htmlFor,
  label,
  icon,
  error,
  children,
}: {
  htmlFor: string
  label: string
  icon: ReactNode
  error?: string
  children: ReactNode
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={htmlFor} className="text-kr-keep text-rm-body-d font-bold text-foreground">
        {label}
      </Label>
      <div className="relative">
        <span className="pointer-events-none absolute left-4 top-1/2 z-10 -translate-y-1/2 text-muted-foreground">
          {icon}
        </span>
        {children}
      </div>
      {error && (
        <p className="text-kr-pretty text-rm-body-sm font-semibold text-destructive">{error}</p>
      )}
    </div>
  )
}
