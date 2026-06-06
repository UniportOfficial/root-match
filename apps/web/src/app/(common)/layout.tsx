import type { ReactNode } from 'react'
import { AppLayout } from '@/components/layout/AppLayout'
import { requireSession } from '@/lib/auth-server'

export default async function CommonGroupLayout({ children }: { children: ReactNode }) {
  await requireSession()
  return <AppLayout>{children}</AppLayout>
}
