import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/lib/supabase/database.types'

// Minimal cookie helpers so the browser client can read
// the server-set Supabase auth cookies (SSR cohesion).
function getCookie(name: string): string | undefined {
  if (typeof document === 'undefined') return undefined
  const match = document.cookie
    .split('; ')
    .find((row) => row.startsWith(`${name}=`))
  return match?.slice(name.length + 1)
}

function setCookie(name: string, value: string, options?: Record<string, unknown>) {
  if (typeof document === 'undefined') return
  const opts = options || {}
  let cookie = `${name}=${value}; Path=/; SameSite=Lax`
  const anyOpts = opts as { maxAge?: number; expires?: Date; domain?: string; secure?: boolean }
  if (anyOpts.maxAge) cookie += `; Max-Age=${anyOpts.maxAge}`
  if (anyOpts.expires) cookie += `; Expires=${anyOpts.expires.toUTCString()}`
  if (anyOpts.domain) cookie += `; Domain=${anyOpts.domain}`
  if (anyOpts.secure) cookie += `; Secure`
  document.cookie = cookie
}

function removeCookie(name: string, options?: Record<string, unknown>) {
  setCookie(name, '', { ...(options || {}), expires: new Date(0) })
}

export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: getCookie,
        set: setCookie,
        remove: removeCookie,
      },
    }
  )
}
