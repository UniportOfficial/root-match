import type { ReactNode } from 'react'
import { AppLayout } from '@/components/layout/AppLayout'
import { requireAccountType } from '@/lib/auth-server'

export default async function ClientGroupLayout({ children }: { children: ReactNode }) {
  await requireAccountType('client')
  return <AppLayout>{children}</AppLayout>
}
