'use client'

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  type Dispatch,
  type ReactNode,
} from 'react'
import type { Company, CompanyFilter } from '@rootmatching/shared'
import { fetchCompanies } from '@/lib/companies-api'
import { getDemoCompanies } from '@/lib/demo-companies'
import { isDemoFallbackEnabled } from '@/lib/demo-policy'
import { useUserState } from '@/state/UserContext'

type LoadStatus = 'idle' | 'loading' | 'ready' | 'error'

interface CompaniesState {
  companies: Company[]
  filter: CompanyFilter
  favorites: string[]
  status: LoadStatus
  error: string | null
}

type CompaniesAction =
  | { type: 'companies/setFilter'; payload: Partial<CompanyFilter> }
  | { type: 'companies/clearFilter' }
  | { type: 'companies/toggleFavorite'; payload: string }
  | { type: 'companies/updateCompany'; payload: Company }
  | { type: 'companies/loadStart' }
  | { type: 'companies/loadSuccess'; payload: Company[] }
  | { type: 'companies/loadError'; payload: string }

const emptyFilter: CompanyFilter = { keyword: '', industry: '', region: '', size: '' }

const initialState: CompaniesState = {
  companies: [],
  filter: emptyFilter,
  favorites: [],
  status: 'idle',
  error: null,
}

function reducer(state: CompaniesState, action: CompaniesAction): CompaniesState {
  switch (action.type) {
    case 'companies/setFilter':
      return { ...state, filter: { ...state.filter, ...action.payload } }
    case 'companies/clearFilter':
      return { ...state, filter: emptyFilter }
    case 'companies/toggleFavorite':
      return {
        ...state,
        favorites: state.favorites.includes(action.payload)
          ? state.favorites.filter((id) => id !== action.payload)
          : [...state.favorites, action.payload],
      }
    case 'companies/updateCompany':
      return {
        ...state,
        companies: state.companies.map((company) =>
          company.id === action.payload.id ? action.payload : company,
        ),
      }
    case 'companies/loadStart':
      return { ...state, status: 'loading', error: null }
    case 'companies/loadSuccess':
      return {
        ...state,
        companies: action.payload,
        status: 'ready',
        error: null,
      }
    case 'companies/loadError':
      return { ...state, status: 'error', error: action.payload }
    default:
      return state
  }
}

const StateContext = createContext<CompaniesState | undefined>(undefined)
const DispatchContext = createContext<Dispatch<CompaniesAction> | undefined>(undefined)

const INITIAL_LIMIT = 100

export function CompaniesProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState)
  const { isAuthenticated } = useUserState()

  useEffect(() => {
    if (!isAuthenticated) {
      dispatch({ type: 'companies/loadSuccess', payload: [] })
      return
    }
    const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'
    let cancelled = false
    dispatch({ type: 'companies/loadStart' })
    fetchCompanies(apiUrl, { limit: INITIAL_LIMIT }).then((result) => {
      if (cancelled) return
      if (result.ok) {
        dispatch({ type: 'companies/loadSuccess', payload: result.data.items })
      } else if (isDemoFallbackEnabled()) {
        dispatch({ type: 'companies/loadSuccess', payload: getDemoCompanies() })
      } else if (result.message === 'unauthenticated') {
        dispatch({ type: 'companies/loadSuccess', payload: [] })
      } else {
        dispatch({ type: 'companies/loadError', payload: result.message })
      }
    })
    return () => {
      cancelled = true
    }
  }, [isAuthenticated])

  return (
    <StateContext.Provider value={state}>
      <DispatchContext.Provider value={dispatch}>{children}</DispatchContext.Provider>
    </StateContext.Provider>
  )
}

export function useCompaniesState() {
  const ctx = useContext(StateContext)
  if (!ctx) throw new Error('useCompaniesState must be used within CompaniesProvider')
  return ctx
}

export function useCompaniesDispatch() {
  const ctx = useContext(DispatchContext)
  if (!ctx) throw new Error('useCompaniesDispatch must be used within CompaniesProvider')
  return ctx
}

export function useCompaniesFiltered() {
  const { companies, filter } = useCompaniesState()
  return useMemo(() => {
    const kw = filter.keyword.trim().toLowerCase()
    return companies.filter((company) => {
      const matchKw =
        !kw ||
        `${company.name} ${company.description} ${company.tags.join(' ')}`
          .toLowerCase()
          .includes(kw)
      const matchInd = !filter.industry || company.industry === filter.industry
      const matchReg = !filter.region || company.region === filter.region
      const matchSize = !filter.size || company.size === filter.size
      return matchKw && matchInd && matchReg && matchSize
    })
  }, [companies, filter])
}

export function useFavoriteCompanies() {
  const { companies, favorites } = useCompaniesState()
  return useMemo(
    () => companies.filter((company) => favorites.includes(company.id)),
    [companies, favorites],
  )
}
