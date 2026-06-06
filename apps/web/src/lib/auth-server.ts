import { cache } from 'react'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'

import type { AccountTypeValue, UserRoleValue } from '@/lib/auth-client'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'

export interface ServerSessionUser {
  id: string
  email: string
  name: string
  emailVerified: boolean
  image: string | null
  role: UserRoleValue
  accountType: AccountTypeValue
  createdAt: string
  updatedAt: string
}

export interface ServerSessionSession {
  id: string
  expiresAt: string
  token: string
  userId: string
  ipAddress: string | null
  userAgent: string | null
  createdAt: string
  updatedAt: string
}

export interface ServerSession {
  user: ServerSessionUser
  session: ServerSessionSession
}

const CLIENT_HOME = '/dashboard'
const FACTORY_HOME = '/factory/requests'
const LOGIN_PATH = '/login'

export const getServerSession = cache(async (): Promise<ServerSession | null> => {
  const requestHeaders = await headers()
  const cookieHeader = requestHeaders.get('cookie') ?? ''
  if (!cookieHeader) return null

  try {
    const response = await fetch(`${API_URL}/api/auth/get-session`, {
      headers: { cookie: cookieHeader },
      cache: 'no-store',
    })
    if (!response.ok) return null
    const data = (await response.json()) as unknown
    if (!data || typeof data !== 'object') return null
    const candidate = data as Partial<ServerSession>
    if (!candidate.user || !candidate.session) return null
    return candidate as ServerSession
  } catch (error) {
    console.warn('auth-server: failed to fetch session', error)
    return null
  }
})

export async function requireSession(): Promise<ServerSession> {
  const session = await getServerSession()
  if (!session) redirect(LOGIN_PATH)
  return session
}

export async function requireAccountType(accountType: AccountTypeValue): Promise<ServerSession> {
  const session = await requireSession()
  if (session.user.accountType !== accountType) {
    redirect(accountType === 'client' ? FACTORY_HOME : CLIENT_HOME)
  }
  return session
}
