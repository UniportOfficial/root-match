'use client'

import * as React from 'react'
import { z } from 'zod'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { SeniorInput } from '@/components/ui/SeniorInput'

const emailSchema = z.string().email()

export interface ParticipantContactValue {
  name: string
  email: string
  phone: string
}

export interface ParticipantContactCardProps {
  role: 'client' | 'factory'
  title: string
  companyName: string
  defaultValue: ParticipantContactValue
  helperText?: string
  onChange: (value: ParticipantContactValue) => void
  onValidityChange?: (valid: boolean) => void
}

interface ParticipantContactErrors {
  name?: string
  email?: string
  phone?: string
}

function validateParticipantContact(value: ParticipantContactValue): {
  valid: boolean
  errors: ParticipantContactErrors
} {
  const errors: ParticipantContactErrors = {}
  const name = value.name.trim()
  const email = value.email.trim()

  if (!name) {
    errors.name = '담당자명을 입력해주세요'
  }

  if (!email) {
    errors.email = '이메일을 입력해주세요'
  } else if (!emailSchema.safeParse(email).success) {
    errors.email = '이메일 형식을 확인해주세요'
  }

  return { valid: !errors.name && !errors.email && !errors.phone, errors }
}

const ParticipantContactCard = React.memo(function ParticipantContactCard({
  role,
  title,
  companyName,
  defaultValue,
  helperText,
  onChange,
  onValidityChange,
}: ParticipantContactCardProps) {
  const [isEditing, setIsEditing] = React.useState(false)
  const [draftName, setDraftName] = React.useState(defaultValue.name)
  const [draftEmail, setDraftEmail] = React.useState(defaultValue.email)
  const [draftPhone, setDraftPhone] = React.useState(defaultValue.phone)
  const [nameError, setNameError] = React.useState<string | undefined>()
  const [emailError, setEmailError] = React.useState<string | undefined>()
  const [phoneError, setPhoneError] = React.useState<string | undefined>()
  const roleLabel = role === 'client' ? '발주처' : '공장'

  React.useEffect(() => {
    setDraftName(defaultValue.name)
    setDraftEmail(defaultValue.email)
    setDraftPhone(defaultValue.phone)
  }, [defaultValue])

  React.useEffect(() => {
    const validation = validateParticipantContact(defaultValue)
    onChange(defaultValue)
    onValidityChange?.(validation.valid)
  }, [defaultValue, onChange, onValidityChange])

  const clearErrors = React.useCallback(() => {
    setNameError(undefined)
    setEmailError(undefined)
    setPhoneError(undefined)
  }, [])

  const handleCancel = React.useCallback(() => {
    setDraftName(defaultValue.name)
    setDraftEmail(defaultValue.email)
    setDraftPhone(defaultValue.phone)
    clearErrors()
    setIsEditing(false)
  }, [clearErrors, defaultValue])

  const handleSave = React.useCallback(() => {
    const nextValue = {
      name: draftName.trim(),
      email: draftEmail.trim(),
      phone: draftPhone.trim(),
    }
    const validation = validateParticipantContact(nextValue)

    setNameError(validation.errors.name)
    setEmailError(validation.errors.email)
    setPhoneError(validation.errors.phone)
    onValidityChange?.(validation.valid)

    if (!validation.valid) return

    onChange(nextValue)
    clearErrors()
    setIsEditing(false)
  }, [clearErrors, draftEmail, draftName, draftPhone, onChange, onValidityChange])

  if (!isEditing) {
    return (
      <Card className="border-border bg-card shadow-ct-soft">
        <CardHeader className="flex flex-row items-start justify-between gap-3 p-5 pb-3 sm:p-6 sm:pb-3">
          <div className="space-y-1">
            <CardTitle className="text-kr-pretty text-[18px] font-bold text-foreground sm:text-[20px]">
              {title}
            </CardTitle>
            <CardDescription className="text-kr-keep text-[14px] text-muted-foreground">
              {companyName}
            </CardDescription>
          </div>
          <Button
            type="button"
            variant="secondary"
            size="default"
            onClick={() => setIsEditing(true)}
            className="shrink-0"
            aria-label={`${roleLabel} 담당자 연락처 수정`}
          >
            수정
          </Button>
        </CardHeader>
        <CardContent className="p-5 pt-0 sm:p-6 sm:pt-0">
          <dl className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-lg bg-muted p-3">
              <dt className="text-kr-keep text-[13px] font-semibold text-muted-foreground">
                담당자명
              </dt>
              <dd className="text-kr-pretty mt-1 text-[16px] font-bold text-foreground">
                {defaultValue.name || '-'}
              </dd>
            </div>
            <div className="rounded-lg bg-muted p-3">
              <dt className="text-kr-keep text-[13px] font-semibold text-muted-foreground">
                이메일
              </dt>
              <dd className="text-kr-pretty mt-1 text-[16px] font-bold text-foreground">
                {defaultValue.email || '-'}
              </dd>
            </div>
            <div className="rounded-lg bg-muted p-3">
              <dt className="text-kr-keep text-[13px] font-semibold text-muted-foreground">
                전화번호
              </dt>
              <dd className="text-kr-pretty mt-1 text-[16px] font-bold text-foreground">
                {defaultValue.phone || '-'}
              </dd>
            </div>
          </dl>
          {helperText ? (
            <p className="text-kr-pretty mt-3 text-[14px] text-muted-foreground">{helperText}</p>
          ) : null}
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-border bg-card shadow-ct-soft">
      <CardHeader className="p-5 pb-3 sm:p-6 sm:pb-3">
        <div className="space-y-1">
          <CardTitle className="text-kr-pretty text-[18px] font-bold text-foreground sm:text-[20px]">
            {title}
          </CardTitle>
          <CardDescription className="text-kr-keep text-[14px] text-muted-foreground">
            {companyName}
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 p-5 pt-0 sm:p-6 sm:pt-0">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <SeniorInput
              label="담당자명"
              value={draftName}
              onChange={(event) => {
                setDraftName(event.target.value)
                setNameError(undefined)
              }}
              error={nameError}
            />
          </div>
          <SeniorInput
            label="이메일"
            type="email"
            inputMode="email"
            autoComplete="email"
            value={draftEmail}
            onChange={(event) => {
              setDraftEmail(event.target.value)
              setEmailError(undefined)
            }}
            error={emailError}
          />
          <SeniorInput
            label="전화번호 (선택)"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            value={draftPhone}
            onChange={(event) => {
              setDraftPhone(event.target.value)
              setPhoneError(undefined)
            }}
            error={phoneError}
          />
        </div>
        {helperText ? (
          <p className="text-kr-pretty text-[14px] text-muted-foreground">{helperText}</p>
        ) : null}
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button type="button" variant="ghost" size="lg" onClick={handleCancel}>
            취소
          </Button>
          <Button type="button" variant="default" size="lg" onClick={handleSave}>
            저장
          </Button>
        </div>
      </CardContent>
    </Card>
  )
})
ParticipantContactCard.displayName = 'ParticipantContactCard'

export { ParticipantContactCard }
