'use client'

import {
  createContext,
  useContext,
  useEffect,
  useReducer,
  type Dispatch,
  type ReactNode,
} from 'react'
import type { FactoryRecommendation, QuoteRequestDraft } from '@rootmatching/shared'

const MATCHING_RESULTS_KEY = 'rm:matchingResults'
const SELECTED_FACTORY_KEY = 'rm:selectedFactory'
const STALE_AFTER_MS = 60 * 60 * 1000

export interface MatchingResultsPayload {
  results: FactoryRecommendation[]
  request: QuoteRequestDraft
  submittedAt: number
}

interface WorkflowContract {
  transactionId: string
  projectName: string
  factoryName: string
  amount: string
  dueDate: string
}

interface WorkflowReview {
  transactionId: string
  rating: number
  content: string
  submittedAt: string
}

interface WorkflowState {
  hydrated: boolean
  matchingResults: MatchingResultsPayload | null
  selectedFactory: FactoryRecommendation | null
  contract: WorkflowContract | null
  paymentCompleted: boolean
  inspectionApproved: boolean
  review: WorkflowReview | null
}

type WorkflowAction =
  | {
      type: 'workflow/hydrated'
      payload: {
        matchingResults: MatchingResultsPayload | null
        selectedFactory: FactoryRecommendation | null
      }
    }
  | { type: 'workflow/setMatchingResults'; payload: MatchingResultsPayload | null }
  | { type: 'workflow/setSelectedFactory'; payload: FactoryRecommendation | null }
  | { type: 'workflow/setContract'; payload: WorkflowContract | null }
  | { type: 'workflow/completePayment' }
  | { type: 'workflow/approveInspection' }
  | { type: 'workflow/submitReview'; payload: WorkflowReview }

const initialState: WorkflowState = {
  hydrated: false,
  matchingResults: null,
  selectedFactory: null,
  contract: null,
  paymentCompleted: false,
  inspectionApproved: false,
  review: null,
}

function reducer(state: WorkflowState, action: WorkflowAction): WorkflowState {
  switch (action.type) {
    case 'workflow/hydrated':
      return {
        ...state,
        hydrated: true,
        matchingResults: action.payload.matchingResults,
        selectedFactory: action.payload.selectedFactory,
      }
    case 'workflow/setMatchingResults':
      return { ...state, matchingResults: action.payload }
    case 'workflow/setSelectedFactory':
      return { ...state, selectedFactory: action.payload }
    case 'workflow/setContract':
      return { ...state, contract: action.payload }
    case 'workflow/completePayment':
      return { ...state, paymentCompleted: true }
    case 'workflow/approveInspection':
      return { ...state, inspectionApproved: true }
    case 'workflow/submitReview':
      return { ...state, review: action.payload }
    default:
      return state
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === 'string')
}

function isFactoryRecommendation(value: unknown): value is FactoryRecommendation {
  if (!isRecord(value)) return false

  return (
    typeof value.id === 'string' &&
    typeof value.name === 'string' &&
    typeof value.location === 'string' &&
    isStringArray(value.processes) &&
    typeof value.trustScore === 'number' &&
    typeof value.deliveryRate === 'number' &&
    typeof value.reorderRate === 'number' &&
    typeof value.estimateMin === 'number' &&
    typeof value.estimateMax === 'number' &&
    typeof value.aiReason === 'string' &&
    typeof value.qualityScore === 'number' &&
    typeof value.deliveryScore === 'number' &&
    typeof value.priceCompetitiveness === 'number'
  )
}

function isQuoteRequestDraft(value: unknown): value is QuoteRequestDraft {
  if (!isRecord(value)) return false

  return (
    typeof value.projectName === 'string' &&
    typeof value.processType === 'string' &&
    typeof value.productItem === 'string' &&
    typeof value.estimatedQuantity === 'string' &&
    typeof value.desiredDeadline === 'string' &&
    typeof value.budgetRange === 'string' &&
    typeof value.detailRequirements === 'string'
  )
}

function isMatchingResultsPayload(value: unknown): value is MatchingResultsPayload {
  if (!isRecord(value)) return false

  return (
    Array.isArray(value.results) &&
    value.results.every(isFactoryRecommendation) &&
    isQuoteRequestDraft(value.request) &&
    typeof value.submittedAt === 'number'
  )
}

function readMatchingResults(): MatchingResultsPayload | null {
  try {
    const raw = sessionStorage.getItem(MATCHING_RESULTS_KEY)
    if (!raw) return null
    const parsed: unknown = JSON.parse(raw)
    if (!isMatchingResultsPayload(parsed)) return null
    if (Date.now() - parsed.submittedAt > STALE_AFTER_MS) return null
    return parsed
  } catch (error) {
    console.error('Failed to hydrate matching results from sessionStorage', error)
    return null
  }
}

function readSelectedFactory(): FactoryRecommendation | null {
  try {
    const raw = sessionStorage.getItem(SELECTED_FACTORY_KEY)
    if (!raw) return null
    const parsed: unknown = JSON.parse(raw)
    return isFactoryRecommendation(parsed) ? parsed : null
  } catch (error) {
    console.error('Failed to hydrate selected factory from sessionStorage', error)
    return null
  }
}

const StateContext = createContext<WorkflowState | undefined>(undefined)
const DispatchContext = createContext<Dispatch<WorkflowAction> | undefined>(undefined)

export function WorkflowProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState)

  useEffect(() => {
    dispatch({
      type: 'workflow/hydrated',
      payload: {
        matchingResults: readMatchingResults(),
        selectedFactory: readSelectedFactory(),
      },
    })
  }, [])

  useEffect(() => {
    if (!state.hydrated) return
    try {
      if (state.matchingResults) {
        sessionStorage.setItem(MATCHING_RESULTS_KEY, JSON.stringify(state.matchingResults))
      } else {
        sessionStorage.removeItem(MATCHING_RESULTS_KEY)
      }
    } catch (error) {
      console.error('Failed to persist matching results to sessionStorage', error)
    }
  }, [state.hydrated, state.matchingResults])

  useEffect(() => {
    if (!state.hydrated) return
    try {
      if (state.selectedFactory) {
        sessionStorage.setItem(SELECTED_FACTORY_KEY, JSON.stringify(state.selectedFactory))
      } else {
        sessionStorage.removeItem(SELECTED_FACTORY_KEY)
      }
    } catch (error) {
      console.error('Failed to persist selected factory to sessionStorage', error)
    }
  }, [state.hydrated, state.selectedFactory])

  return (
    <StateContext.Provider value={state}>
      <DispatchContext.Provider value={dispatch}>{children}</DispatchContext.Provider>
    </StateContext.Provider>
  )
}

export function useWorkflowState() {
  const ctx = useContext(StateContext)
  if (!ctx) throw new Error('useWorkflowState must be used within WorkflowProvider')
  return ctx
}

export function useWorkflowDispatch() {
  const ctx = useContext(DispatchContext)
  if (!ctx) throw new Error('useWorkflowDispatch must be used within WorkflowProvider')
  return ctx
}
