'use client'

import {
  createContext,
  useContext,
  useMemo,
  useReducer,
  type Dispatch,
  type ReactNode,
} from 'react'
import type { Notification } from '@rootmatching/shared'
import { mockNotifications } from '@/data/notifications'

interface NotificationsState {
  notifications: Notification[]
}

type NotificationsAction =
  | { type: 'notifications/markAsRead'; payload: { id: string } }
  | { type: 'notifications/markAllAsRead' }
  | { type: 'notifications/add'; payload: Notification }

const initialState: NotificationsState = {
  notifications: mockNotifications,
}

function reducer(state: NotificationsState, action: NotificationsAction): NotificationsState {
  switch (action.type) {
    case 'notifications/markAsRead':
      return {
        notifications: state.notifications.map((notification) =>
          notification.id === action.payload.id ? { ...notification, isRead: true } : notification,
        ),
      }
    case 'notifications/markAllAsRead':
      return {
        notifications: state.notifications.map((notification) => ({
          ...notification,
          isRead: true,
        })),
      }
    case 'notifications/add':
      return { notifications: [action.payload, ...state.notifications] }
    default:
      return state
  }
}

const StateContext = createContext<NotificationsState | undefined>(undefined)
const DispatchContext = createContext<Dispatch<NotificationsAction> | undefined>(undefined)

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState)
  return (
    <StateContext.Provider value={state}>
      <DispatchContext.Provider value={dispatch}>{children}</DispatchContext.Provider>
    </StateContext.Provider>
  )
}

export function useNotificationsState() {
  const ctx = useContext(StateContext)
  if (!ctx) throw new Error('useNotificationsState must be used within NotificationsProvider')
  return ctx
}

export function useNotificationsDispatch() {
  const ctx = useContext(DispatchContext)
  if (!ctx) throw new Error('useNotificationsDispatch must be used within NotificationsProvider')
  return ctx
}

export function useNotificationsUnreadCount() {
  const { notifications } = useNotificationsState()
  return useMemo(
    () => notifications.filter((notification) => !notification.isRead).length,
    [notifications],
  )
}

export function useSortedNotifications() {
  const { notifications } = useNotificationsState()
  return useMemo(
    () => [...notifications].sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt)),
    [notifications],
  )
}
