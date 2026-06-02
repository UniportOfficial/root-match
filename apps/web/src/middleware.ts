import { NextResponse, type NextRequest } from 'next/server'
import { AUTH_COOKIE_NAME } from '@/lib/auth-cookie'

const PUBLIC_ROUTES = new Set<string>(['/', '/login', '/role-select'])

function isPublic(pathname: string): boolean {
  if (PUBLIC_ROUTES.has(pathname)) return true
  return false
}

export function middleware(req: NextRequest): NextResponse {
  const { pathname, search } = req.nextUrl

  if (isPublic(pathname)) {
    return NextResponse.next()
  }

  const isAuthenticated = req.cookies.has(AUTH_COOKIE_NAME)
  if (!isAuthenticated) {
    const loginUrl = req.nextUrl.clone()
    loginUrl.pathname = '/login'
    loginUrl.searchParams.set('redirectTo', pathname + (search ?? ''))
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
