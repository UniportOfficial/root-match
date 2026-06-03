'use client'

import { useState, type ReactNode } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { zodResolver } from '@hookform/resolvers/zod'
import { Sparkles } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { AppButton } from '@/components/ui/AppButton'
import { authClient } from '@/lib/auth-client'
import { cn } from '@/lib/cn'

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

const inputClassName =
  'mt-2 h-12 w-full rounded-xl border border-slate-300 px-4 outline-none transition focus:border-brand focus:ring-4 focus:ring-brand-light'

function resolveRedirectTarget(fallback: string): string {
  if (typeof window === 'undefined') return fallback
  const target = new URLSearchParams(window.location.search).get('redirectTo')
  if (!target) return fallback
  if (!target.startsWith('/')) return fallback
  if (target.startsWith('//')) return fallback
  return target
}

export default function LoginPage() {
  const [activeTab, setActiveTab] = useState<AuthTab>('login')
  const [submitError, setSubmitError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const router = useRouter()
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
    router.push(resolveRedirectTarget('/dashboard'))
  }

  return (
    <main className="min-h-screen bg-surface-muted px-4 py-16 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-md">
        <header className="mb-8 text-center">
          <span className="inline-flex items-center gap-2 rounded-full bg-brand-light px-4 py-1.5 text-sm font-semibold text-brand">
            <Sparkles className="h-4 w-4" />
            Rootmatching
          </span>
          <h1 className="mt-5 text-3xl font-bold text-ink-950">로그인 / 회원가입</h1>
        </header>

        <section className="rounded-2xl border border-border bg-white p-6 shadow-sm sm:p-8">
          <div className="mb-6 grid grid-cols-2 rounded-xl border border-border bg-surface-muted p-1">
            {(['login', 'register'] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => {
                  setActiveTab(tab)
                  setSubmitError('')
                }}
                className={cn(
                  'rounded-lg px-4 py-2.5 text-sm font-bold transition',
                  activeTab === tab
                    ? 'bg-white text-brand shadow-sm'
                    : 'text-ink-700 hover:text-brand',
                )}
              >
                {tabStyles[tab]}
              </button>
            ))}
          </div>

          {submitError && (
            <p className="mb-4 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-bold text-danger">
              {submitError}
            </p>
          )}

          {activeTab === 'login' ? (
            <form onSubmit={loginForm.handleSubmit(submitLogin)} className="space-y-4">
              <Field label="이메일" error={loginForm.formState.errors.email?.message}>
                <input
                  type="email"
                  autoComplete="email"
                  className={inputClassName}
                  {...loginForm.register('email')}
                />
              </Field>
              <Field label="비밀번호" error={loginForm.formState.errors.password?.message}>
                <input
                  type="password"
                  autoComplete="current-password"
                  className={inputClassName}
                  {...loginForm.register('password')}
                />
              </Field>
              <AppButton type="submit" size="lg" fullWidth disabled={isSubmitting}>
                {isSubmitting ? '로그인 중...' : '로그인'}
              </AppButton>
            </form>
          ) : (
            <form onSubmit={registerForm.handleSubmit(submitRegister)} className="space-y-4">
              <Field label="이름" error={registerForm.formState.errors.name?.message}>
                <input type="text" className={inputClassName} {...registerForm.register('name')} />
              </Field>
              <Field label="이메일" error={registerForm.formState.errors.email?.message}>
                <input
                  type="email"
                  autoComplete="email"
                  className={inputClassName}
                  {...registerForm.register('email')}
                />
              </Field>
              <Field label="비밀번호" error={registerForm.formState.errors.password?.message}>
                <input
                  type="password"
                  autoComplete="new-password"
                  className={inputClassName}
                  {...registerForm.register('password')}
                />
              </Field>
              <fieldset className="rounded-xl border border-border bg-surface-muted p-4">
                <legend className="px-2 text-sm font-bold text-ink-700">계정 유형</legend>
                <div className="mt-2 grid grid-cols-2 gap-3">
                  <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-border bg-white px-3 py-2 text-sm font-semibold text-ink-700 has-[:checked]:border-brand has-[:checked]:bg-brand-light has-[:checked]:text-brand">
                    <input
                      type="radio"
                      value="client"
                      className="accent-brand"
                      {...registerForm.register('accountType')}
                    />
                    발주처 (client)
                  </label>
                  <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-border bg-white px-3 py-2 text-sm font-semibold text-ink-700 has-[:checked]:border-brand has-[:checked]:bg-brand-light has-[:checked]:text-brand">
                    <input
                      type="radio"
                      value="factory"
                      className="accent-brand"
                      {...registerForm.register('accountType')}
                    />
                    공장 (factory)
                  </label>
                </div>
              </fieldset>
              <label className="flex items-start gap-3 rounded-xl border border-border bg-surface-muted p-4 text-sm font-semibold text-ink-700">
                <input
                  type="checkbox"
                  className="mt-1 h-4 w-4 accent-brand"
                  {...registerForm.register('terms')}
                />
                <span>서비스 이용약관과 개인정보 처리방침에 동의합니다.</span>
              </label>
              {registerForm.formState.errors.terms?.message && (
                <p className="mt-1 text-sm text-danger">
                  {registerForm.formState.errors.terms.message}
                </p>
              )}
              <AppButton type="submit" size="lg" fullWidth disabled={isSubmitting}>
                {isSubmitting ? '가입 중...' : '회원가입'}
              </AppButton>
            </form>
          )}
        </section>

        <Link
          href="/"
          className="mt-6 inline-flex w-full justify-center text-sm font-bold text-ink-700 transition hover:text-brand"
        >
          ← 처음으로
        </Link>
      </div>
    </main>
  )
}

function Field({ label, error, children }: { label: string; error?: string; children: ReactNode }) {
  return (
    <label className="block text-sm font-bold text-ink-700">
      {label}
      {children}
      {error && <span className="mt-1 block text-sm text-danger">{error}</span>}
    </label>
  )
}
