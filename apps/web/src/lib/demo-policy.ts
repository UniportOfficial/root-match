export function isDemoFallbackEnabled(): boolean {
  return process.env.NEXT_PUBLIC_DEMO_MODE === 'true'
}

export function isDemoModeSearch(searchParams: URLSearchParams): boolean {
  if (isDemoFallbackEnabled()) return true
  if (process.env.NODE_ENV === 'production') return false
  return searchParams.get('demo') === 'true'
}
