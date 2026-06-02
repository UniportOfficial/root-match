'use client'

import {
  createContext,
  useContext,
  useMemo,
  useReducer,
  type Dispatch,
  type ReactNode,
} from 'react'
import type { Company, CompanyFilter } from '@rootmatching/shared'
import { mockCompanies } from '@/data/companies'

interface CompaniesState {
  companies: Company[]
  filter: CompanyFilter
  favorites: string[]
}

type CompaniesAction =
  | { type: 'companies/setFilter'; payload: Partial<CompanyFilter> }
  | { type: 'companies/clearFilter' }
  | { type: 'companies/toggleFavorite'; payload: string }
  | { type: 'companies/updateCompany'; payload: Company }

const emptyFilter: CompanyFilter = { keyword: '', industry: '', region: '', size: '' }

const initialState: CompaniesState = {
  companies: mockCompanies,
  filter: emptyFilter,
  favorites: [],
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
    default:
      return state
  }
}

const StateContext = createContext<CompaniesState | undefined>(undefined)
const DispatchContext = createContext<Dispatch<CompaniesAction> | undefined>(undefined)

export function CompaniesProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState)
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
