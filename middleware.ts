import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // Mock role - your backend peer will eventually provide this via JWT/Cookie
  const userRole = request.cookies.get('user-role')?.value 

  const { pathname } = request.nextUrl

  // Protect the PFCC route
  if (pathname.startsWith('/pfcc') && userRole !== 'PFCC') {
    return NextResponse.redirect(new URL('/auth/login', request.url))
  }

  // Protect the EXEC route
  if (pathname.startsWith('/exec') && userRole !== 'EXEC') {
    return NextResponse.redirect(new URL('/auth/login', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/pfcc/:path*', '/exec/:path*'],
}