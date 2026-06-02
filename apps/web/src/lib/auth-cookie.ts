export const AUTH_COOKIE_NAME = 'rm-auth'
const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24

export function setAuthCookie(): void {
  if (typeof document === 'undefined') return
  document.cookie = `${AUTH_COOKIE_NAME}=1; path=/; max-age=${COOKIE_MAX_AGE_SECONDS}; samesite=lax`
}

export function clearAuthCookie(): void {
  if (typeof document === 'undefined') return
  document.cookie = `${AUTH_COOKIE_NAME}=; path=/; max-age=0; samesite=lax`
}
