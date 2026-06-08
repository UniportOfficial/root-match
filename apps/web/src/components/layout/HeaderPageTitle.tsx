'use client'

import { usePathname } from 'next/navigation'
import { resolveTitleForPath } from '@/lib/page-titles'
import { cn } from '@/lib/utils'

interface HeaderPageTitleProps {
  className?: string
}

export function HeaderPageTitle({ className }: HeaderPageTitleProps) {
  const pathname = usePathname()
  const title = resolveTitleForPath(pathname)

  return (
    <h1
      className={cn(
        'text-kr-keep min-w-0 truncate text-rm-body-d font-bold text-foreground',
        className,
      )}
    >
      {title}
    </h1>
  )
}
