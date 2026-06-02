import type { ReactNode } from 'react'
import { AppLayout } from '@/components/layout/AppLayout'

export default function ClientGroupLayout({ children }: { children: ReactNode }) {
  return <AppLayout>{children}</AppLayout>
}
