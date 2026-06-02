'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { zodResolver } from '@hookform/resolvers/zod'
import { Bell, LockKeyhole, Save, Settings, UserRound } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { AppBadge } from '@/components/ui/AppBadge'
import { AppButton } from '@/components/ui/AppButton'
import { mockCurrentUser } from '@/data/users'
import { cn } from '@/lib/cn'
import { useUserDispatch, useUserState } from '@/state/UserContext'

const profileSchema = z.object({
  name: z.string().min(1, '이름을 입력해주세요.'),
  position: z.string().optional(),
  email: z.string().email('올바른 이메일 형식이 아닙니다.'),
  phone: z.string().optional(),
})

type ProfileFormValues = z.infer<typeof profileSchema>

const tabItems = [
  { label: '기업 프로필', href: '/mypage', current: false },
  { label: '활동 분석', href: '/mypage/analytics', current: false },
  { label: '계정 설정', href: '/mypage/settings', current: true },
]

const inputClassName =
  'h-12 w-full rounded-xl border border-slate-300 bg-surface px-4 text-base text-ink-950 outline-none transition placeholder:text-ink-400 focus:border-brand focus:ring-4 focus:ring-brand-light'
const labelClassName = 'mb-2 block text-sm font-semibold text-ink-700'
const errorClassName = 'mt-2 text-sm font-semibold text-danger'
const successClassName = 'text-sm font-semibold text-success'

function buildDefaultValues(currentUser: typeof mockCurrentUser): ProfileFormValues {
  return {
    name: currentUser.name,
    position: currentUser.position ?? '',
    email: currentUser.email,
    phone: currentUser.phone ?? '',
  }
}

export default function MyPageSettingsPage() {
  const { currentUser } = useUserState()
  const dispatch = useUserDispatch()
  const user = currentUser ?? mockCurrentUser
  const [profileSaved, setProfileSaved] = useState(false)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [passwordSuccess, setPasswordSuccess] = useState('')
  const [emailNotif, setEmailNotif] = useState(true)
  const [pushNotif, setPushNotif] = useState(false)
  const [notificationSaved, setNotificationSaved] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: buildDefaultValues(user),
  })

  useEffect(() => {
    reset(buildDefaultValues(user))
  }, [reset, user])

  useEffect(() => {
    if (!profileSaved) return
    const timer = window.setTimeout(() => setProfileSaved(false), 3000)
    return () => window.clearTimeout(timer)
  }, [profileSaved])

  useEffect(() => {
    if (!notificationSaved) return
    const timer = window.setTimeout(() => setNotificationSaved(false), 3000)
    return () => window.clearTimeout(timer)
  }, [notificationSaved])

  function saveProfile(values: ProfileFormValues) {
    const profileUpdate = {
      name: values.name,
      position: values.position,
      email: values.email,
      phone: values.phone,
    }

    dispatch({ type: 'user/updateProfile', payload: profileUpdate })
    setProfileSaved(true)
  }

  function changePassword() {
    setPasswordSuccess('')

    if (newPassword !== confirmPassword) {
      setPasswordError('새 비밀번호와 확인이 일치하지 않습니다.')
      return
    }

    setPasswordError('')
    setPasswordSuccess('비밀번호가 변경되었습니다. (목업)')
    setCurrentPassword('')
    setNewPassword('')
    setConfirmPassword('')
  }

  function saveNotifications() {
    setNotificationSaved(true)
  }

  return (
    <div className="px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl space-y-8">
        <nav aria-label="마이페이지 메뉴" className="flex flex-wrap gap-2">
          {tabItems.map((item) =>
            item.current ? (
              <span
                key={item.href}
                aria-current="page"
                className="rounded-full bg-brand px-4 py-2 text-sm font-bold text-white shadow-sm"
              >
                {item.label}
              </span>
            ) : (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-full border border-border bg-white px-4 py-2 text-sm font-semibold text-ink-700 transition hover:border-brand-light hover:bg-brand-light/40 hover:text-brand"
              >
                {item.label}
              </Link>
            ),
          )}
        </nav>

        <header>
          <AppBadge variant="blue">
            <Settings className="h-4 w-4" />
            계정 설정
          </AppBadge>
          <h1 className="mt-5 text-3xl font-bold text-ink-950 sm:text-4xl">계정 설정</h1>
          <p className="mt-3 text-lg leading-8 text-ink-700">
            사용자 정보와 알림 설정을 관리하세요.
          </p>
        </header>

        <section className="overflow-hidden rounded-2xl border border-border bg-white shadow-sm">
          <div className="border-b border-border p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-light text-brand">
                <UserRound className="h-5 w-5" />
              </div>
              <h2 className="text-2xl font-bold text-ink-950">사용자 정보</h2>
            </div>
          </div>

          <form onSubmit={handleSubmit(saveProfile)} className="grid gap-5 p-6 sm:grid-cols-2">
            <Field label="이름" htmlFor="name" error={errors.name?.message}>
              <input id="name" type="text" className={inputClassName} {...register('name')} />
            </Field>

            <Field label="직책" htmlFor="position" error={errors.position?.message}>
              <input
                id="position"
                type="text"
                className={inputClassName}
                {...register('position')}
              />
            </Field>

            <Field label="이메일" htmlFor="email" error={errors.email?.message}>
              <input id="email" type="email" className={inputClassName} {...register('email')} />
            </Field>

            <Field label="연락처" htmlFor="phone" error={errors.phone?.message}>
              <input id="phone" type="tel" className={inputClassName} {...register('phone')} />
            </Field>

            <div className="flex items-center gap-4 sm:col-span-2">
              <AppButton type="submit" disabled={isSubmitting}>
                <Save className="h-4 w-4" />
                정보 저장
              </AppButton>
              {profileSaved && <p className={successClassName}>정보가 저장되었습니다.</p>}
            </div>
          </form>
        </section>

        <section className="overflow-hidden rounded-2xl border border-border bg-white shadow-sm">
          <div className="border-b border-border p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-light text-brand">
                <LockKeyhole className="h-5 w-5" />
              </div>
              <h2 className="text-2xl font-bold text-ink-950">비밀번호 변경</h2>
            </div>
          </div>

          <div className="grid gap-5 p-6">
            <Field label="현재 비밀번호" htmlFor="currentPassword">
              <input
                id="currentPassword"
                type="password"
                value={currentPassword}
                onChange={(event) => setCurrentPassword(event.target.value)}
                className={inputClassName}
              />
            </Field>

            <Field label="새 비밀번호" htmlFor="newPassword">
              <input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                className={inputClassName}
              />
            </Field>

            <Field label="비밀번호 확인" htmlFor="confirmPassword">
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                className={inputClassName}
              />
            </Field>

            {passwordError && <p className={errorClassName}>{passwordError}</p>}
            {passwordSuccess && <p className={successClassName}>{passwordSuccess}</p>}

            <div>
              <AppButton type="button" onClick={changePassword}>
                비밀번호 변경
              </AppButton>
            </div>
          </div>
        </section>

        <section className="overflow-hidden rounded-2xl border border-border bg-white shadow-sm">
          <div className="border-b border-border p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-light text-brand">
                <Bell className="h-5 w-5" />
              </div>
              <h2 className="text-2xl font-bold text-ink-950">알림 설정</h2>
            </div>
          </div>

          <div className="space-y-5 p-6">
            <ToggleRow
              label="이메일 알림"
              enabled={emailNotif}
              onToggle={() => setEmailNotif((value) => !value)}
            />
            <ToggleRow
              label="푸시 알림"
              enabled={pushNotif}
              onToggle={() => setPushNotif((value) => !value)}
            />

            <div className="flex items-center gap-4 pt-2">
              <AppButton type="button" onClick={saveNotifications}>
                알림 설정 저장
              </AppButton>
              {notificationSaved && <p className={successClassName}>알림 설정이 저장되었습니다.</p>}
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}

function Field({
  label,
  htmlFor,
  error,
  children,
}: {
  label: string
  htmlFor: string
  error?: string
  children: React.ReactNode
}) {
  return (
    <div>
      <label className={labelClassName} htmlFor={htmlFor}>
        {label}
      </label>
      {children}
      {error && <p className={errorClassName}>{error}</p>}
    </div>
  )
}

function ToggleRow({
  label,
  enabled,
  onToggle,
}: {
  label: string
  enabled: boolean
  onToggle: () => void
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-xl border border-border bg-surface-muted px-4 py-4">
      <span className="text-sm font-bold text-ink-950">{label}</span>
      <button
        type="button"
        aria-pressed={enabled}
        onClick={onToggle}
        className={cn(
          'relative h-7 w-12 rounded-full transition',
          enabled ? 'bg-brand' : 'bg-slate-300',
        )}
      >
        <span
          className={cn(
            'absolute top-1 h-5 w-5 rounded-full bg-white transition',
            enabled ? 'left-6' : 'left-1',
          )}
        />
      </button>
    </div>
  )
}
