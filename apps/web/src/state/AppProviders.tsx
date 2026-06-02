'use client'

import type { ReactNode } from 'react'
import { CompaniesProvider } from '@/state/CompaniesContext'
import { MessagesProvider } from '@/state/MessagesContext'
import { NotificationsProvider } from '@/state/NotificationsContext'
import { UserProvider } from '@/state/UserContext'
import { WorkflowProvider } from '@/state/WorkflowContext'

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <UserProvider>
      <CompaniesProvider>
        <MessagesProvider>
          <NotificationsProvider>
            <WorkflowProvider>{children}</WorkflowProvider>
          </NotificationsProvider>
        </MessagesProvider>
      </CompaniesProvider>
    </UserProvider>
  )
}
