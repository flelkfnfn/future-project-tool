import { createServerClient } from '@supabase/ssr'
import { cookies, headers } from 'next/headers'

type CookieGet = (name: string) => string | undefined
type CookieSet = (name: string, value: string, options?: Record<string, unknown>) => void
type CookieRemove = (name: string, options?: Record<string, unknown>) => void

export async function createClient() {
  let getCookie: CookieGet
  let setCookie: CookieSet
  let removeCookie: CookieRemove

  try {
    const store = await cookies()
    getCookie = (name) => store.get(name)?.value
    setCookie = (name, value, options) => {
      try { (store as unknown as { set: CookieSet }).set(name, value, options) } catch {}
    }
    removeCookie = (name, options) => {
      try { (store as unknown as { set: CookieSet }).set(name, '', { ...(options || {}), expires: new Date(0) }) } catch {}
    }
  } catch {
    const hdrs = await headers()
    getCookie = (name) => {
      const cookieHeader = hdrs.get('cookie') || ''
      const parts = cookieHeader.split(';')
      for (const part of parts) {
        const [k, ...rest] = part.trim().split('=')
        if (k === name) return decodeURIComponent(rest.join('='))
      }
      return undefined
    }
    setCookie = () => {}
    removeCookie = () => {}
  }

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    ({
      cookies: {
        get: getCookie,
        set: setCookie,
        remove: removeCookie,
      },
    } as unknown as Parameters<typeof createServerClient>[2])
  )
}
