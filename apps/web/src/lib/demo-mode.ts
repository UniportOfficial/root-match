'use client'

import { useEffect, useMemo, useState } from 'react'
import { isDemoModeSearch } from '@/lib/demo-policy'

/**
 * URL `?demo=true`는 production 빌드에서는 무시되고, env `NEXT_PUBLIC_DEMO_MODE=true`만 honor한다.
 * 개발/스테이징/테스트에서는 URL 파라미터도 허용되어 demo UX 검증이 가능하다.
 */
export function isDemoModeBySearch(searchParams: URLSearchParams): boolean {
  return isDemoModeSearch(searchParams)
}

export function useDemoMode(): boolean {
  const [search, setSearch] = useState('')

  useEffect(() => {
    setSearch(window.location.search)
  }, [])

  return useMemo(() => isDemoModeBySearch(new URLSearchParams(search)), [search])
}
