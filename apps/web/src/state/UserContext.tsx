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
import { clearAuthCookie, setAuthCookie } from '@/lib/auth-cookie'

interface UserState {
  currentUser: User | null
  isAuthenticated: boolean
}

interface RegisterPayload {
  id: string
  email: string
  name: string
  companyName: string
  company: Company
  role?: User['role']
  password: string
  terms: boolean
  position?: string
  phone?: string
}

type UserAction =
  | { type: 'user/login'; payload: User }
  | { type: 'user/register'; payload: RegisterPayload }
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
    case 'user/register': {
      const user: User = {
        id: action.payload.id,
        email: action.payload.email,
        name: action.payload.name,
        company: action.payload.company,
        role: action.payload.role ?? 'admin',
        accountType: 'client',
        ...(action.payload.position ? { position: action.payload.position } : {}),
        ...(action.payload.phone ? { phone: action.payload.phone } : {}),
      }
      return { currentUser: user, isAuthenticated: true }
    }
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

export function UserProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState)

  useEffect(() => {
    if (state.isAuthenticated && state.currentUser) {
      setAuthCookie(state.currentUser.accountType)
    } else {
      clearAuthCookie()
    }
  }, [state.isAuthenticated, state.currentUser])

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
