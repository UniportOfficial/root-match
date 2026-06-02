'use client'

import {
  createContext,
  useContext,
  useMemo,
  useReducer,
  type Dispatch,
  type ReactNode,
} from 'react'
import type { Message } from '@rootmatching/shared'
import { mockMessages } from '@/data/messages'

interface MessagesState {
  messages: Message[]
}

type MessagesAction =
  | { type: 'messages/markAsRead'; payload: { id: string } }
  | { type: 'messages/markAllAsRead' }
  | { type: 'messages/sendMessage'; payload: Message }
  | { type: 'messages/deleteMessage'; payload: { id: string } }
  | { type: 'messages/addReply'; payload: { parentId: string; message: Message } }

const initialState: MessagesState = {
  messages: mockMessages,
}

function reducer(state: MessagesState, action: MessagesAction): MessagesState {
  switch (action.type) {
    case 'messages/markAsRead':
      return {
        messages: state.messages.map((message) =>
          message.id === action.payload.id ? { ...message, isRead: true } : message,
        ),
      }
    case 'messages/markAllAsRead':
      return { messages: state.messages.map((message) => ({ ...message, isRead: true })) }
    case 'messages/sendMessage':
      return { messages: [action.payload, ...state.messages] }
    case 'messages/deleteMessage':
      return { messages: state.messages.filter((message) => message.id !== action.payload.id) }
    case 'messages/addReply':
      return { messages: [action.payload.message, ...state.messages] }
    default:
      return state
  }
}

const StateContext = createContext<MessagesState | undefined>(undefined)
const DispatchContext = createContext<Dispatch<MessagesAction> | undefined>(undefined)

export function MessagesProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState)
  return (
    <StateContext.Provider value={state}>
      <DispatchContext.Provider value={dispatch}>{children}</DispatchContext.Provider>
    </StateContext.Provider>
  )
}

export function useMessagesState() {
  const ctx = useContext(StateContext)
  if (!ctx) throw new Error('useMessagesState must be used within MessagesProvider')
  return ctx
}

export function useMessagesDispatch() {
  const ctx = useContext(DispatchContext)
  if (!ctx) throw new Error('useMessagesDispatch must be used within MessagesProvider')
  return ctx
}

export function useMessagesUnreadCount() {
  const { messages } = useMessagesState()
  return useMemo(() => messages.filter((message) => !message.isRead).length, [messages])
}

export function useSortedMessages() {
  const { messages } = useMessagesState()
  return useMemo(
    () => [...messages].sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt)),
    [messages],
  )
}
