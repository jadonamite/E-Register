import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { verifySessionToken, SESSION_COOKIE } from '@/lib/auth'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Verify the signed session (tampered/forged cookies fail here).
  const session = await verifySessionToken(
    request.cookies.get(SESSION_COOKIE)?.value
  )

  const denied = () => NextResponse.redirect(new URL('/', request.url))

  // Exec + Admin require a leadership session. The attendance page (/pfcc) is
  // open to guests read-only; marking is gated at the API by a marker session.
  if (
    (pathname.startsWith('/exec') || pathname.startsWith('/admin')) &&
    session?.kind !== 'exec'
  ) {
    return denied()
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/exec/:path*', '/admin/:path*'],
}
