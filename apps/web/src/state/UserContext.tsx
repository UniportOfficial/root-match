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
import { mockCompanies } from '@/data/companies'

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

// Map a Better Auth session.user → local UI User shape.
// W2-5 will fetch real Company via /companies; for now we fall back to the
// first mock company so existing UI surfaces (AppHeader, dashboard, contract,
// mypage, companies/[id]) keep rendering.
function sessionUserToLocalUser(sessionUser: {
  id: string
  email: string
  name: string
  image?: string | null
  role: string
  accountType: string
}): User | null {
  const fallbackCompany = mockCompanies[0]
  if (!fallbackCompany) return null
  return {
    id: sessionUser.id,
    email: sessionUser.email,
    name: sessionUser.name,
    company: fallbackCompany,
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
    if (session.data?.user) {
      const localUser = sessionUserToLocalUser(session.data.user)
      if (localUser) {
        dispatch({ type: 'user/login', payload: localUser })
      }
    } else {
      dispatch({ type: 'user/logout' })
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
