'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  type Dispatch,
  type ReactNode,
} from 'react'
import type { Company, CompanyFilter, CompanyListQuery } from '@rootmatching/shared'
import { fetchCompanies } from '@/lib/companies-api'
import { getDemoCompanies } from '@/lib/demo-companies'
import { isDemoFallbackEnabled } from '@/lib/demo-policy'
import { useUserState } from '@/state/UserContext'

type LoadStatus = 'idle' | 'loading' | 'ready' | 'error'
type LoadMoreStatus = 'idle' | 'loading'

interface CompaniesState {
  companies: Company[]
  filter: CompanyFilter
  favorites: string[]
  status: LoadStatus
  loadMoreStatus: LoadMoreStatus
  error: string | null
  total: number
  page: number
  limit: number
  hasMore: boolean
}

type CompaniesAction =
  | { type: 'companies/setFilter'; payload: Partial<CompanyFilter> }
  | { type: 'companies/clearFilter' }
  | { type: 'companies/toggleFavorite'; payload: string }
  | { type: 'companies/updateCompany'; payload: Company }
  | { type: 'companies/loadStart' }
  | {
      type: 'companies/loadSuccess'
      payload: { items: Company[]; total: number; page: number; hasMore: boolean }
    }
  | { type: 'companies/loadError'; payload: string }
  | { type: 'companies/loadMoreStart' }
  | {
      type: 'companies/loadMoreSuccess'
      payload: { items: Company[]; page: number; hasMore: boolean }
    }

const emptyFilter: CompanyFilter = { keyword: '', industry: '', region: '', size: '' }

const PAGE_LIMIT = 100

const initialState: CompaniesState = {
  companies: [],
  filter: emptyFilter,
  favorites: [],
  status: 'idle',
  loadMoreStatus: 'idle',
  error: null,
  total: 0,
  page: 1,
  limit: PAGE_LIMIT,
  hasMore: false,
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
        companies: action.payload.items,
        total: action.payload.total,
        page: action.payload.page,
        hasMore: action.payload.hasMore,
        status: 'ready',
        loadMoreStatus: 'idle',
        error: null,
      }
    case 'companies/loadError':
      return { ...state, status: 'error', error: action.payload }
    case 'companies/loadMoreStart':
      return { ...state, loadMoreStatus: 'loading' }
    case 'companies/loadMoreSuccess':
      return {
        ...state,
        companies: [...state.companies, ...action.payload.items],
        page: action.payload.page,
        hasMore: action.payload.hasMore,
        loadMoreStatus: 'idle',
      }
    default:
      return state
  }
}

interface CompaniesActions {
  loadMore: () => Promise<void>
}

const StateContext = createContext<CompaniesState | undefined>(undefined)
const DispatchContext = createContext<Dispatch<CompaniesAction> | undefined>(undefined)
const ActionsContext = createContext<CompaniesActions | undefined>(undefined)

function buildServerQuery(filter: CompanyFilter, page: number, limit: number): CompanyListQuery {
  const query: CompanyListQuery = { page, limit }
  if (filter.keyword.trim()) query.keyword = filter.keyword.trim()
  if (filter.industry) query.industry = filter.industry
  if (filter.region) query.region = filter.region
  if (filter.size) query.size = filter.size
  return query
}

function computeHasMore(page: number, limit: number, fetchedCount: number, total: number): boolean {
  return page * limit < total && fetchedCount > 0
}

export function CompaniesProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState)
  const { isAuthenticated } = useUserState()
  const stateRef = useRef(state)
  stateRef.current = state

  useEffect(() => {
    if (!isAuthenticated) {
      dispatch({
        type: 'companies/loadSuccess',
        payload: { items: [], total: 0, page: 1, hasMore: false },
      })
      return
    }
    const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'
    let cancelled = false
    dispatch({ type: 'companies/loadStart' })

    const query = buildServerQuery(state.filter, 1, PAGE_LIMIT)
    fetchCompanies(apiUrl, query).then((result) => {
      if (cancelled) return
      if (result.ok) {
        dispatch({
          type: 'companies/loadSuccess',
          payload: {
            items: result.data.items,
            total: result.data.total,
            page: 1,
            hasMore: computeHasMore(1, PAGE_LIMIT, result.data.items.length, result.data.total),
          },
        })
      } else if (isDemoFallbackEnabled()) {
        const demo = getDemoCompanies()
        dispatch({
          type: 'companies/loadSuccess',
          payload: { items: demo, total: demo.length, page: 1, hasMore: false },
        })
      } else if (result.message === 'unauthenticated') {
        dispatch({
          type: 'companies/loadSuccess',
          payload: { items: [], total: 0, page: 1, hasMore: false },
        })
      } else {
        dispatch({ type: 'companies/loadError', payload: result.message })
      }
    })
    return () => {
      cancelled = true
    }
  }, [isAuthenticated, state.filter])

  const loadMore = useCallback(async () => {
    const current = stateRef.current
    if (current.loadMoreStatus === 'loading' || !current.hasMore) return
    if (current.status !== 'ready') return

    const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'
    const nextPage = current.page + 1
    dispatch({ type: 'companies/loadMoreStart' })

    const query = buildServerQuery(current.filter, nextPage, current.limit)
    const result = await fetchCompanies(apiUrl, query)

    if (!result.ok) return

    dispatch({
      type: 'companies/loadMoreSuccess',
      payload: {
        items: result.data.items,
        page: nextPage,
        hasMore: computeHasMore(
          nextPage,
          current.limit,
          result.data.items.length,
          result.data.total,
        ),
      },
    })
  }, [])

  const actions = useMemo<CompaniesActions>(() => ({ loadMore }), [loadMore])

  return (
    <StateContext.Provider value={state}>
      <DispatchContext.Provider value={dispatch}>
        <ActionsContext.Provider value={actions}>{children}</ActionsContext.Provider>
      </DispatchContext.Provider>
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

export function useCompaniesActions() {
  const ctx = useContext(ActionsContext)
  if (!ctx) throw new Error('useCompaniesActions must be used within CompaniesProvider')
  return ctx
}

export function useCompaniesFiltered() {
  const { companies } = useCompaniesState()
  return companies
}

export function useFavoriteCompanies() {
  const { companies, favorites } = useCompaniesState()
  return useMemo(
    () => companies.filter((company) => favorites.includes(company.id)),
    [companies, favorites],
  )
}
