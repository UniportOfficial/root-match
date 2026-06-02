'use client'

import { useEffect, useState, type ReactNode } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { X } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { cn } from '@/lib/cn'
import { mockCompanies } from '@/data/companies'
import { mockCurrentUser } from '@/data/users'
import { useUserDispatch } from '@/state/UserContext'
import { AppButton } from '@/components/ui/AppButton'

type AuthTab = 'login' | 'register'

const loginSchema = z.object({
  email: z.string().email('올바른 이메일 형식이 아닙니다'),
  password: z.string().min(6, '비밀번호는 6자 이상이어야 합니다'),
})

const registerSchema = z.object({
  email: z.string().email('올바른 이메일 형식이 아닙니다'),
  password: z.string().min(6, '비밀번호는 6자 이상이어야 합니다'),
  name: z.string().min(1, '이름을 입력해주세요'),
  companyName: z.string().min(1, '회사명을 입력해주세요'),
  position: z.string().optional(),
  phone: z.string().optional(),
  terms: z.boolean().refine((value) => value, '약관 동의가 필요합니다'),
})

type LoginFormValues = z.infer<typeof loginSchema>
type RegisterFormValues = z.input<typeof registerSchema>

interface AuthModalProps {
  open: boolean
  onClose: () => void
  defaultTab?: AuthTab
  className?: string
}

const tabStyles: Record<AuthTab, string> = {
  login: '로그인',
  register: '회원가입',
}

const inputClassName =
  'mt-2 h-12 w-full rounded-xl border border-slate-300 px-4 outline-none transition focus:border-brand focus:ring-4 focus:ring-brand-light'

export function AuthModal({ open, onClose, defaultTab = 'login', className }: AuthModalProps) {
  const [activeTab, setActiveTab] = useState<AuthTab>(defaultTab)
  const [submitError, setSubmitError] = useState('')
  const dispatch = useUserDispatch()
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
      companyName: '',
      position: '',
      phone: '',
      terms: false,
    },
  })

  useEffect(() => {
    if (open) {
      setActiveTab(defaultTab)
      setSubmitError('')
    }
  }, [defaultTab, open])

  if (!open) return null

  function submitLogin(values: LoginFormValues) {
    setSubmitError('')
    if (values.email !== 'hong@techsolution.co.kr' || values.password !== '123456') {
      setSubmitError('이메일 또는 비밀번호가 올바르지 않습니다')
      return
    }
    dispatch({ type: 'user/login', payload: mockCurrentUser })
    onClose()
  }

  function submitRegister(values: RegisterFormValues) {
    setSubmitError('')
    const company = mockCompanies.find(() => true)
    if (!company) {
      setSubmitError('가입에 필요한 회사 정보를 찾을 수 없습니다')
      return
    }
    dispatch({
      type: 'user/register',
      payload: {
        ...values,
        id: 'new-user',
        company,
        role: 'admin',
      },
    })
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-950/50 px-4 py-8">
      <dialog
        open
        className={cn(
          'm-0 w-full max-w-lg rounded-2xl border border-border bg-white p-0 shadow-lg',
          className,
        )}
      >
        <div className="flex items-center justify-between border-b border-border px-6 py-5">
          <h2 className="text-2xl font-bold text-ink-950">계정 시작하기</h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-xl text-ink-400 transition hover:bg-surface-muted hover:text-ink-950"
            aria-label="닫기"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6">
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
              <AppButton type="submit" size="lg" fullWidth>
                로그인
              </AppButton>
            </form>
          ) : (
            <form onSubmit={registerForm.handleSubmit(submitRegister)} className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="이름" error={registerForm.formState.errors.name?.message}>
                  <input
                    type="text"
                    className={inputClassName}
                    {...registerForm.register('name')}
                  />
                </Field>
                <Field label="회사명" error={registerForm.formState.errors.companyName?.message}>
                  <input
                    type="text"
                    className={inputClassName}
                    {...registerForm.register('companyName')}
                  />
                </Field>
              </div>
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
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="직책" error={registerForm.formState.errors.position?.message}>
                  <input
                    type="text"
                    className={inputClassName}
                    {...registerForm.register('position')}
                  />
                </Field>
                <Field label="연락처" error={registerForm.formState.errors.phone?.message}>
                  <input
                    type="tel"
                    className={inputClassName}
                    {...registerForm.register('phone')}
                  />
                </Field>
              </div>
              <label className="flex items-start gap-3 rounded-xl border border-border bg-surface-muted p-4 text-sm font-semibold text-ink-700">
                <input
                  type="checkbox"
                  className="mt-1 h-4 w-4 accent-brand"
                  {...registerForm.register('terms')}
                />
                <span>서비스 이용약관과 개인정보 처리방침에 동의합니다.</span>
              </label>
              {registerForm.formState.errors.terms?.message && (
                <p className="text-sm font-semibold text-danger">
                  {registerForm.formState.errors.terms.message}
                </p>
              )}
              <AppButton type="submit" size="lg" fullWidth>
                회원가입
              </AppButton>
            </form>
          )}
        </div>
      </dialog>
    </div>
  )
}

function Field({ label, error, children }: { label: string; error?: string; children: ReactNode }) {
  return (
    <label className="block text-sm font-bold text-ink-700">
      {label}
      {children}
      {error && <span className="mt-1 block text-sm font-semibold text-danger">{error}</span>}
    </label>
  )
}
