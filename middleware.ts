import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // 1. Get the Role from the cookie
  const userRole = request.cookies.get('user-role')?.value 
  const { pathname } = request.nextUrl

  // 2. Protect PFCC Route
  // If they are going to /pfcc but their role is NOT 'PFCC'... kick them out.
  if (pathname.startsWith('/pfcc') && userRole !== 'PFCC') {
    return NextResponse.redirect(new URL('/', request.url)) // CHANGED: /auth/login -> /
  }

  // 3. Protect Exec Route
  if (pathname.startsWith('/exec') && userRole !== 'EXEC') {
    return NextResponse.redirect(new URL('/', request.url)) // CHANGED: /auth/login -> /
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/pfcc/:path*', '/exec/:path*'],
}