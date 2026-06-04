'use client'

import { useEffect, useMemo, useState } from 'react'

export function isDemoModeBySearch(searchParams: URLSearchParams): boolean {
  return searchParams.get('demo') === 'true' || process.env.NEXT_PUBLIC_DEMO_MODE === 'true'
}

export function useDemoMode(): boolean {
  const [search, setSearch] = useState('')

  useEffect(() => {
    setSearch(window.location.search)
  }, [])

  return useMemo(() => isDemoModeBySearch(new URLSearchParams(search)), [search])
}
