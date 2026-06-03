import { NextResponse, type NextRequest } from 'next/server'
import { getSessionCookie } from 'better-auth/cookies'

const PUBLIC_ROUTES = new Set<string>(['/', '/login', '/role-select'])

// Optimistic-redirect pattern per Better Auth docs `integrations/next.mdx:155-177,299-326`.
// `getSessionCookie()` only checks cookie presence — it does NOT validate the session.
// Real authorization happens in Server Components, API routes, and the NestJS
// BetterAuthGuard (apps/api/src/auth/better-auth.guard.ts). Full session validation
// in middleware requires Node-runtime middleware (`runtime: 'nodejs'`), stable in
// Next.js 16 — deferred until then.
// Role-based path partitioning (factory/* vs client/*) is also deferred — session
// roles are not visible to edge middleware without a DB hit; W2-5 will move that
// logic into Server Components where `authClient.getSession()` is cheap.
export function middleware(req: NextRequest): NextResponse {
  const { pathname, search } = req.nextUrl
  if (PUBLIC_ROUTES.has(pathname)) return NextResponse.next()

  const sessionCookie = getSessionCookie(req)
  if (!sessionCookie) {
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
