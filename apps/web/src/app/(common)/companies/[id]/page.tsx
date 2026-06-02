'use client'

import { useState, type FormEvent, type ReactNode } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import type { Message } from '@rootmatching/shared'
import { Building2, Globe, Heart, Mail, Phone, Send } from 'lucide-react'
import { AppBadge } from '@/components/ui/AppBadge'
import { AppButton } from '@/components/ui/AppButton'
import { useCompaniesDispatch, useCompaniesState } from '@/state/CompaniesContext'
import { useMessagesDispatch } from '@/state/MessagesContext'
import { useUserState } from '@/state/UserContext'

const fieldClassName =
  'mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-base text-ink-950 outline-none transition placeholder:text-ink-400 focus:border-brand focus:ring-4 focus:ring-brand-light'

export default function CompanyDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { companies, favorites } = useCompaniesState()
  const companiesDispatch = useCompaniesDispatch()
  const messagesDispatch = useMessagesDispatch()
  const userState = useUserState()
  const [isInquiryOpen, setIsInquiryOpen] = useState(false)
  const [inquirySubject, setInquirySubject] = useState('')
  const [inquiryContent, setInquiryContent] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  const foundCompany = companies.find((item) => item.id === id)

  if (!foundCompany) {
    return (
      <div className="px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="rounded-2xl border border-border bg-white p-12 text-center shadow-sm">
            <Building2 className="mx-auto h-12 w-12 text-ink-400" />
            <p className="mt-4 text-lg font-semibold text-ink-700">기업을 찾을 수 없습니다.</p>
            <Link
              href="/companies"
              className="mt-5 inline-flex items-center justify-center rounded-xl bg-brand px-5 py-3 text-sm font-bold text-white transition hover:bg-brand-hover"
            >
              기업 디렉토리
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const company = foundCompany
  const isFavorite = favorites.includes(id)
  const portfolio = company.portfolio ?? []

  function closeInquiry() {
    setIsInquiryOpen(false)
  }

  function submitInquiry(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const trimmedSubject = inquirySubject.trim()
    const trimmedContent = inquiryContent.trim()
    if (!trimmedSubject || trimmedContent.length < 10) return

    const newId = `msg-inquiry-${Date.now()}`
    const newMessage: Message = {
      id: newId,
      senderId: userState.currentUser?.id ?? 'user1',
      senderName: userState.currentUser?.name ?? '홍길동',
      senderCompany: userState.currentUser?.company.name ?? '테크솔루션 주식회사',
      receiverId: 'company-' + company.id,
      receiverName: company.name,
      receiverCompany: company.name,
      subject: `[문의] ${trimmedSubject}`,
      content: trimmedContent,
      isRead: false,
      createdAt: new Date().toISOString(),
    }

    messagesDispatch({ type: 'messages/sendMessage', payload: newMessage })
    setIsInquiryOpen(false)
    setInquirySubject('')
    setInquiryContent('')
    setSuccessMessage('문의 메시지가 전송되었습니다.')
    window.setTimeout(() => setSuccessMessage(''), 3000)
  }

  return (
    <div className="px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <Link
          href="/companies"
          className="inline-flex text-sm font-bold text-ink-700 transition hover:text-brand"
        >
          ← 기업 디렉토리
        </Link>

        <header className="relative rounded-2xl border border-border bg-white p-6 shadow-sm sm:p-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0">
              <AppBadge variant="slate">{company.industry}</AppBadge>
              <h1 className="mt-4 text-3xl font-bold text-ink-950 sm:text-4xl">{company.name}</h1>
              <p className="mt-3 max-w-3xl text-lg leading-8 text-ink-700">{company.description}</p>
            </div>

            <div className="flex shrink-0 flex-wrap gap-2">
              <button
                type="button"
                aria-label={isFavorite ? '관심 기업 해제' : '관심 기업 추가'}
                onClick={() =>
                  companiesDispatch({ type: 'companies/toggleFavorite', payload: company.id })
                }
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-white px-4 py-2.5 text-sm font-bold text-ink-700 transition hover:border-brand-light hover:bg-brand-light/40 hover:text-brand"
              >
                <Heart
                  className={`h-5 w-5 ${isFavorite ? 'fill-danger text-danger' : 'text-ink-400'}`}
                />
                관심
              </button>
              <AppButton onClick={() => setIsInquiryOpen(true)}>
                <Send className="h-4 w-4" />
                문의하기
              </AppButton>
            </div>
          </div>
        </header>

        {successMessage && (
          <div className="rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700 shadow-sm">
            {successMessage}
          </div>
        )}

        <Section title="기본 정보">
          <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <InfoTile label="업종" value={company.industry} />
            <InfoTile label="지역" value={company.region} />
            <InfoTile label="규모" value={company.size} />
            <InfoTile label="설립연도" value={`${company.establishedYear}년`} />
            <InfoTile label="직원수" value={`${company.employeeCount.toLocaleString('ko-KR')}명`} />
            <InfoTile label="매출" value={company.revenue} />
          </dl>
        </Section>

        <Section title="태그">
          <ChipList
            items={company.tags.map((tag) => `#${tag}`)}
            className="bg-brand-light text-brand"
          />
        </Section>

        <Section title="인증/자격">
          <ChipList items={company.certifications} className="bg-blue-50 text-blue-700" />
        </Section>

        <Section title="대표 프로젝트">
          {portfolio.length ? (
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {portfolio.map((item) => (
                <article
                  key={`${item.title}-${item.description}`}
                  className="rounded-xl bg-surface-muted p-4"
                >
                  <h3 className="font-bold text-ink-950">{item.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-ink-700">{item.description}</p>
                </article>
              ))}
            </div>
          ) : (
            <p className="rounded-xl bg-surface-muted p-4 text-sm font-semibold text-ink-400">
              등록된 대표 프로젝트가 없습니다.
            </p>
          )}
        </Section>

        <Section title="연락처">
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
            <ContactItem icon={<Mail className="h-5 w-5" />} label="이메일">
              <a
                href={`mailto:${company.contactEmail}`}
                className="text-brand hover:text-brand-hover"
              >
                {company.contactEmail}
              </a>
            </ContactItem>
            <ContactItem icon={<Phone className="h-5 w-5" />} label="전화">
              {company.contactPhone}
            </ContactItem>
            <ContactItem icon={<Globe className="h-5 w-5" />} label="웹사이트">
              <a
                href={company.website}
                target="_blank"
                rel="noreferrer"
                className="text-brand hover:text-brand-hover"
              >
                {company.website}
              </a>
            </ContactItem>
          </div>
        </Section>
      </div>

      {isInquiryOpen && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/50 p-4">
          <form
            onSubmit={submitInquiry}
            className="z-50 w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl"
          >
            <h2 className="text-2xl font-bold text-ink-950">기업 문의</h2>
            <p className="mt-2 text-sm leading-6 text-ink-700">
              {company.name}에 보낼 문의 내용을 작성하세요.
            </p>

            <label className="mt-5 block text-sm font-bold text-ink-700">
              제목
              <input
                value={inquirySubject}
                onChange={(event) => setInquirySubject(event.target.value)}
                required
                minLength={1}
                className={fieldClassName}
              />
            </label>

            <label className="mt-4 block text-sm font-bold text-ink-700">
              내용
              <textarea
                value={inquiryContent}
                onChange={(event) => setInquiryContent(event.target.value)}
                required
                minLength={10}
                rows={6}
                className={`${fieldClassName} resize-none`}
              />
            </label>

            <div className="mt-6 flex justify-end gap-2">
              <AppButton variant="secondary" onClick={closeInquiry}>
                취소
              </AppButton>
              <AppButton type="submit">보내기</AppButton>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-2xl border border-border bg-white p-5 shadow-sm sm:p-6">
      <h2 className="text-xl font-bold text-ink-950">{title}</h2>
      <div className="mt-4">{children}</div>
    </section>
  )
}

function InfoTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-surface-muted p-4">
      <dt className="text-sm font-semibold text-ink-400">{label}</dt>
      <dd className="mt-1 text-base font-bold text-ink-950">{value}</dd>
    </div>
  )
}

function ChipList({ items, className }: { items: string[]; className: string }) {
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item) => (
        <span key={item} className={`rounded-full px-3 py-1 text-xs font-bold ${className}`}>
          {item}
        </span>
      ))}
    </div>
  )
}

function ContactItem({
  icon,
  label,
  children,
}: {
  icon: ReactNode
  label: string
  children: ReactNode
}) {
  return (
    <div className="flex items-start gap-3 rounded-xl bg-surface-muted p-4">
      <div className="mt-0.5 text-ink-400">{icon}</div>
      <div className="min-w-0">
        <p className="text-sm font-semibold text-ink-400">{label}</p>
        <p className="mt-1 break-words text-sm font-bold text-ink-950">{children}</p>
      </div>
    </div>
  )
}
