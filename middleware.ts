import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = await createClient()

  await supabase.auth.getSession()

  // Redirect unauthenticated users from protected routes
  const { data: { session } } = await supabase.auth.getSession();
  const protectedRoutes = ['/projects', '/notices', '/ideas', '/calendar', '/files'];

  if (!session && protectedRoutes.some(route => request.nextUrl.pathname.startsWith(route))) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = '/login';
    redirectUrl.searchParams.set(`redirectedFrom`, request.nextUrl.pathname);
    return NextResponse.redirect(redirectUrl);
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - /login (login page itself)
     * - /auth/callback (supabase auth callback)
     * - Any files in the /public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|login|auth/callback|.*\..*).*) ',
  ],
}
