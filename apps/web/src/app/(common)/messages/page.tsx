'use client'

import { Suspense, useEffect, useMemo, useState, type KeyboardEvent } from 'react'
import { Mail, Send } from 'lucide-react'
import { useSearchParams } from 'next/navigation'
import type { Message } from '@rootmatching/shared'
import { AppBadge } from '@/components/ui/AppBadge'
import { AppButton } from '@/components/ui/AppButton'
import { cn } from '@/lib/cn'
import { useMessagesDispatch, useMessagesState, useSortedMessages } from '@/state/MessagesContext'
import { useUserState } from '@/state/UserContext'

type MessageFilter = 'all' | 'unread'

function formatMessageDate(value: string): string {
  return new Intl.DateTimeFormat('ko-KR', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}

function MessagesPageContent() {
  const searchParams = useSearchParams()
  const { messages } = useMessagesState()
  const dispatch = useMessagesDispatch()
  const sortedMessages = useSortedMessages()
  const { currentUser } = useUserState()
  const [activeFilter, setActiveFilter] = useState<MessageFilter>('all')
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(null)
  const [replyText, setReplyText] = useState('')
  const [replies, setReplies] = useState<Record<string, string[]>>({})

  useEffect(() => {
    const msgId = searchParams?.get('message')
    if (msgId) {
      setSelectedMessageId(msgId)
      const msg = messages.find((message) => message.id === msgId)
      if (msg && !msg.isRead) {
        dispatch({ type: 'messages/markAsRead', payload: { id: msgId } })
      }
    }
  }, [searchParams, messages, dispatch])

  const unreadCount = useMemo(
    () => sortedMessages.filter((message) => !message.isRead).length,
    [sortedMessages],
  )
  const visibleMessages = useMemo(
    () =>
      activeFilter === 'unread'
        ? sortedMessages.filter((message) => !message.isRead)
        : sortedMessages,
    [activeFilter, sortedMessages],
  )
  const selectedMessage = useMemo(
    () => sortedMessages.find((message) => message.id === selectedMessageId) ?? null,
    [selectedMessageId, sortedMessages],
  )
  const selectedReplies = selectedMessage ? (replies[selectedMessage.id] ?? []) : []

  function selectMessage(message: Message) {
    setSelectedMessageId(message.id)
    if (!message.isRead) {
      dispatch({ type: 'messages/markAsRead', payload: { id: message.id } })
    }
  }

  function submitReply() {
    const trimmedReply = replyText.trim()
    if (!selectedMessage || !trimmedReply) return

    setReplies((currentReplies) => ({
      ...currentReplies,
      [selectedMessage.id]: [...(currentReplies[selectedMessage.id] ?? []), trimmedReply],
    }))
    setReplyText('')
  }

  function handleReplyKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      submitReply()
    }
  }

  return (
    <div className="min-h-screen bg-surface-muted px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <header className="mb-8 overflow-hidden rounded-2xl border border-brand-light bg-white shadow-sm">
          <div className="p-6 sm:p-8">
            <AppBadge variant="blue" className="mb-4 px-4 py-2 text-sm font-semibold">
              <Mail className="h-4 w-4" />
              메시지
            </AppBadge>
            <h1 className="text-3xl font-bold tracking-normal text-ink-950 sm:text-4xl">메시지</h1>
            <p className="mt-3 max-w-3xl text-lg leading-8 text-ink-700">
              수신/발신 메시지를 한 곳에서 확인하세요.
            </p>
          </div>
        </header>

        <section className="mb-6 rounded-2xl border border-border bg-white p-2 shadow-sm">
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setActiveFilter('all')}
              className={cn(
                'rounded-xl px-4 py-3 text-sm font-bold transition',
                activeFilter === 'all'
                  ? 'bg-brand-light text-brand'
                  : 'text-ink-700 hover:bg-surface-muted hover:text-brand',
              )}
            >
              전체 ({sortedMessages.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveFilter('unread')}
              className={cn(
                'rounded-xl px-4 py-3 text-sm font-bold transition',
                activeFilter === 'unread'
                  ? 'bg-brand-light text-brand'
                  : 'text-ink-700 hover:bg-surface-muted hover:text-brand',
              )}
            >
              읽지 않음 ({unreadCount})
            </button>
          </div>
        </section>

        <div className="grid min-h-[600px] grid-cols-1 gap-6 lg:grid-cols-[360px_minmax(0,1fr)]">
          <aside className="overflow-hidden rounded-2xl border border-border bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-border bg-surface-muted px-5 py-4">
              <div>
                <p className="text-sm font-semibold text-ink-400">메시지함</p>
                <p className="mt-1 text-lg font-bold text-ink-950">{visibleMessages.length}개</p>
              </div>
              <AppButton
                variant="secondary"
                className="px-3 py-2 text-xs"
                onClick={() => dispatch({ type: 'messages/markAllAsRead' })}
              >
                전체 읽음 처리
              </AppButton>
            </div>

            {visibleMessages.length > 0 ? (
              <div className="divide-y divide-border">
                {visibleMessages.map((message) => {
                  const isSelected = message.id === selectedMessageId
                  return (
                    <button
                      key={message.id}
                      type="button"
                      onClick={() => selectMessage(message)}
                      className={cn(
                        'block w-full border-l-4 border-transparent px-5 py-4 text-left transition hover:bg-surface-muted',
                        isSelected && 'border-brand bg-brand-light/30',
                      )}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            {!message.isRead && (
                              <span className="h-2 w-2 shrink-0 rounded-full bg-brand" />
                            )}
                            <p
                              className={cn(
                                'truncate text-sm text-ink-950',
                                message.isRead ? 'font-semibold' : 'font-extrabold',
                              )}
                            >
                              {message.senderName}
                            </p>
                          </div>
                          <p
                            className={cn(
                              'mt-2 line-clamp-1 text-base text-ink-950',
                              message.isRead ? 'font-semibold' : 'font-extrabold',
                            )}
                          >
                            {message.subject}
                          </p>
                          <p
                            className={cn(
                              'mt-1 line-clamp-1 text-sm',
                              message.isRead ? 'text-ink-400' : 'font-semibold text-ink-700',
                            )}
                          >
                            {message.content}
                          </p>
                        </div>
                        <time className="shrink-0 text-xs font-semibold text-ink-400">
                          {formatMessageDate(message.createdAt)}
                        </time>
                      </div>
                    </button>
                  )
                })}
              </div>
            ) : (
              <div className="flex min-h-[360px] items-center justify-center p-8 text-center">
                <p className="text-base font-semibold text-ink-400">메시지가 없습니다.</p>
              </div>
            )}
          </aside>

          <main className="rounded-2xl border border-border bg-white p-5 shadow-sm sm:p-6">
            {selectedMessage ? (
              <div className="flex h-full flex-col gap-5">
                <section className="rounded-xl border border-border bg-white p-5 shadow-sm">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-xl font-bold text-ink-950">
                          {selectedMessage.senderName}
                        </h2>
                        {selectedMessage.subject.includes('견적') && (
                          <AppBadge variant="green">견적 협의</AppBadge>
                        )}
                      </div>
                      <p className="mt-1 text-sm font-semibold text-ink-700">
                        {selectedMessage.senderCompany}
                      </p>
                      <p className="mt-3 text-lg font-bold text-ink-950">
                        {selectedMessage.subject}
                      </p>
                      <time className="mt-2 block text-sm font-medium text-ink-400">
                        {formatMessageDate(selectedMessage.createdAt)}
                      </time>
                    </div>
                    <AppBadge variant={selectedMessage.isRead ? 'slate' : 'blue'}>
                      {selectedMessage.isRead ? '읽음' : '읽지 않음'}
                    </AppBadge>
                  </div>
                </section>

                <section className="rounded-xl border border-border-subtle bg-surface-muted p-5">
                  <p className="whitespace-pre-wrap text-base leading-8 text-ink-700">
                    {selectedMessage.content}
                  </p>
                </section>

                <section className="flex min-h-[220px] flex-1 flex-col gap-4 rounded-xl border border-border bg-white p-5">
                  <div className="flex-1 space-y-3">
                    {selectedReplies.map((reply, index) => (
                      <div key={`${selectedMessage.id}-${index}`} className="flex justify-end">
                        <div className="max-w-[78%] rounded-2xl rounded-tr-sm bg-brand-light px-4 py-3 text-brand shadow-sm">
                          <div className="mb-1 flex items-center justify-between gap-3 text-xs font-bold">
                            <span>{currentUser?.name ?? '나'}</span>
                            <time>방금 전</time>
                          </div>
                          <p className="whitespace-pre-wrap text-sm leading-6 text-ink-950">
                            {reply}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="grid gap-3 border-t border-border pt-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
                    <textarea
                      rows={2}
                      value={replyText}
                      onChange={(event) => setReplyText(event.target.value)}
                      onKeyDown={handleReplyKeyDown}
                      placeholder="답장을 입력하세요... (Enter 전송, Shift+Enter 줄바꿈)"
                      className="w-full resize-none rounded-xl border border-slate-300 bg-surface px-4 py-3 text-base text-ink-950 outline-none transition placeholder:text-ink-400 focus:border-brand focus:ring-4 focus:ring-brand-light"
                    />
                    <AppButton
                      variant="secondary"
                      onClick={submitReply}
                      disabled={!replyText.trim()}
                    >
                      <Send className="h-4 w-4" />
                      전송
                    </AppButton>
                  </div>
                </section>
              </div>
            ) : (
              <div className="flex min-h-[560px] items-center justify-center rounded-xl border border-border bg-surface-muted p-8 text-center">
                <div>
                  <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-brand-light text-brand">
                    <Mail className="h-10 w-10" />
                  </div>
                  <p className="mt-5 text-xl font-bold text-ink-950">메시지를 선택하세요.</p>
                </div>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  )
}

export default function MessagesPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-surface-muted px-4 py-8 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl rounded-2xl border border-border bg-white p-8 shadow-sm">
            <p className="text-base font-semibold text-ink-700">메시지를 불러오는 중입니다.</p>
          </div>
        </div>
      }
    >
      <MessagesPageContent />
    </Suspense>
  )
}
