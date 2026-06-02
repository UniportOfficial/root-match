import { NextResponse, type NextRequest } from 'next/server'
import { AUTH_COOKIE_NAME, ROLE_COOKIE_NAME } from '@/lib/auth-cookie'

const PUBLIC_ROUTES = new Set<string>(['/', '/login', '/role-select'])

const FACTORY_ONLY_PREFIXES = ['/factory/']
const CLIENT_ONLY_PREFIXES = ['/request', '/matching', '/contract', '/transaction/', '/requests']

function isPublic(pathname: string): boolean {
  return PUBLIC_ROUTES.has(pathname)
}

function startsWithAny(pathname: string, prefixes: readonly string[]): boolean {
  return prefixes.some((prefix) => pathname === prefix || pathname.startsWith(prefix))
}

function redirectTo(req: NextRequest, target: string): NextResponse {
  const url = req.nextUrl.clone()
  url.pathname = target
  url.search = ''
  return NextResponse.redirect(url)
}

export function middleware(req: NextRequest): NextResponse {
  const { pathname, search } = req.nextUrl

  if (isPublic(pathname)) {
    return NextResponse.next()
  }

  const hasAuth = req.cookies.has(AUTH_COOKIE_NAME)
  if (!hasAuth) {
    const loginUrl = req.nextUrl.clone()
    loginUrl.pathname = '/login'
    loginUrl.searchParams.set('redirectTo', pathname + (search ?? ''))
    return NextResponse.redirect(loginUrl)
  }

  const role = req.cookies.get(ROLE_COOKIE_NAME)?.value
  const isFactoryOnly = startsWithAny(pathname, FACTORY_ONLY_PREFIXES)
  const isClientOnly = startsWithAny(pathname, CLIENT_ONLY_PREFIXES)

  if (isFactoryOnly || isClientOnly) {
    if (role !== 'client' && role !== 'factory') {
      // Role-scoped route reached without a role cookie — force role selection.
      return redirectTo(req, '/role-select')
    }
    if (role === 'client' && isFactoryOnly) {
      return redirectTo(req, '/dashboard')
    }
    if (role === 'factory' && isClientOnly) {
      return redirectTo(req, '/dashboard')
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
