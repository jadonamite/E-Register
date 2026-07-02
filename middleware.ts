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

  // Protect PFCC route — requires a valid PFCC session.
  if (pathname.startsWith('/pfcc') && session?.role !== 'PFCC') {
    return denied()
  }

  // Protect Exec route — requires a valid EXEC session.
  if (pathname.startsWith('/exec') && session?.role !== 'EXEC') {
    return denied()
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/pfcc/:path*', '/exec/:path*'],
}
