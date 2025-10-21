import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  // Allow read-only access for unauthenticated users
  return NextResponse.next({
    request: { headers: request.headers },
  })
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)'],
}
