import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const protectedRoutes = ['/projects', '/notices', '/ideas', '/calendar', '/files']
  const isProtected = protectedRoutes.some((route) => request.nextUrl.pathname.startsWith(route))

  // Check Supabase auth cookies (supports default sb-<ref>-auth-token format)
  const hasAuthCookie = request.cookies.getAll().some((c) =>
    c.name === 'sb-access-token' || (c.name.startsWith('sb-') && c.name.endsWith('-auth-token'))
  )

  if (!hasAuthCookie && isProtected) {
    const redirectUrl = request.nextUrl.clone()
    redirectUrl.pathname = '/login'
    redirectUrl.searchParams.set('redirectedFrom', request.nextUrl.pathname)
    return NextResponse.redirect(redirectUrl)
  }

  return response
}

export const config = {
  matcher: [
    // Exclude Next internals, assets, and login page
    '/((?!_next/static|_next/image|favicon.ico|login|.*\\..*).*)',
  ],
}
