import type { ReactNode } from 'react'
import { AppLayout } from '@/components/layout/AppLayout'
import { requireAccountType } from '@/lib/auth-server'

export default async function FactoryGroupLayout({ children }: { children: ReactNode }) {
  await requireAccountType('factory')
  return <AppLayout>{children}</AppLayout>
}
