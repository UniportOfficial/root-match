'use client'

import {
  createContext,
  useContext,
  useEffect,
  useReducer,
  type Dispatch,
  type ReactNode,
} from 'react'
import type { Company, User } from '@rootmatching/shared'
import { authClient } from '@/lib/auth-client'

interface UserState {
  currentUser: User | null
  isAuthenticated: boolean
}

type UserAction =
  | { type: 'user/login'; payload: User }
  | {
      type: 'user/updateProfile'
      payload: Partial<Pick<User, 'name' | 'avatar' | 'position' | 'phone'>>
    }
  | { type: 'user/updateCompany'; payload: Company }
  | { type: 'user/logout' }

const initialState: UserState = {
  currentUser: null,
  isAuthenticated: false,
}

function reducer(state: UserState, action: UserAction): UserState {
  switch (action.type) {
    case 'user/login':
      return { currentUser: action.payload, isAuthenticated: true }
    case 'user/updateProfile':
      if (!state.currentUser) return state
      return { ...state, currentUser: { ...state.currentUser, ...action.payload } }
    case 'user/updateCompany':
      if (!state.currentUser) return state
      return { ...state, currentUser: { ...state.currentUser, company: action.payload } }
    case 'user/logout':
      return { currentUser: null, isAuthenticated: false }
    default:
      return state
  }
}

const StateContext = createContext<UserState | undefined>(undefined)
const DispatchContext = createContext<Dispatch<UserAction> | undefined>(undefined)

interface BackendCompany {
  id: string
  userId: string
  name: string
  industry: string | null
  region: string | null
  size: string | null
  description: string | null
  contactEmail: string | null
  contactPhone: string | null
  website: string | null
  establishedYear: number | null
  employeeCount: number | null
  revenue: string | null
  createdAt: string
  updatedAt: string
}

function backendCompanyToShared(be: BackendCompany): Company {
  return {
    id: be.id,
    name: be.name,
    industry: be.industry ?? '',
    region: be.region ?? '',
    size: be.size ?? '',
    description: be.description ?? '',
    contactEmail: be.contactEmail ?? '',
    contactPhone: be.contactPhone ?? '',
    website: be.website ?? '',
    establishedYear: be.establishedYear ?? 0,
    employeeCount: be.employeeCount ?? 0,
    revenue: be.revenue ?? '',
    certifications: [],
    tags: [],
    createdAt: be.createdAt,
  }
}

async function fetchMyCompany(): Promise<Company | null> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'
  try {
    const response = await fetch(`${apiUrl}/companies/me`, {
      credentials: 'include',
    })
    if (response.status === 404) return null
    if (!response.ok) {
      console.warn('Failed to load company: HTTP', response.status)
      return null
    }
    const data = (await response.json()) as { company: BackendCompany | null }
    if (!data.company) return null
    return backendCompanyToShared(data.company)
  } catch (error) {
    console.warn('Failed to load company: network error', error)
    return null
  }
}

function sessionUserToLocalUser(
  sessionUser: {
    id: string
    email: string
    name: string
    image?: string | null
    role: string
    accountType: string
  },
  company: Company | null,
): User {
  return {
    id: sessionUser.id,
    email: sessionUser.email,
    name: sessionUser.name,
    company,
    role: (sessionUser.role as User['role']) ?? 'member',
    accountType: (sessionUser.accountType as User['accountType']) ?? 'client',
    ...(sessionUser.image ? { avatar: sessionUser.image } : {}),
  }
}

export function UserProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState)
  const session = authClient.useSession()

  useEffect(() => {
    if (session.isPending) return
    const sessionUser = session.data?.user
    if (!sessionUser) {
      dispatch({ type: 'user/logout' })
      return
    }

    let cancelled = false
    void (async () => {
      const company = await fetchMyCompany()
      if (cancelled) return
      const localUser = sessionUserToLocalUser(sessionUser, company)
      dispatch({ type: 'user/login', payload: localUser })
    })()

    return () => {
      cancelled = true
    }
  }, [session.isPending, session.data?.user])

  return (
    <StateContext.Provider value={state}>
      <DispatchContext.Provider value={dispatch}>{children}</DispatchContext.Provider>
    </StateContext.Provider>
  )
}

export function useUserState() {
  const ctx = useContext(StateContext)
  if (!ctx) throw new Error('useUserState must be used within UserProvider')
  return ctx
}

export function useUserDispatch() {
  const ctx = useContext(DispatchContext)
  if (!ctx) throw new Error('useUserDispatch must be used within UserProvider')
  return ctx
}
