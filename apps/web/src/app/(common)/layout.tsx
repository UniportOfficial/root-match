import type { ReactNode } from 'react'
import { AppLayout } from '@/components/layout/AppLayout'

export default function CommonGroupLayout({ children }: { children: ReactNode }) {
  return <AppLayout>{children}</AppLayout>
}
