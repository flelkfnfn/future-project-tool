import { createServerClient } from '@supabase/ssr'
import { cookies, headers } from 'next/headers'

export async function createClient() {
  let getCookie: (name: string) => string | undefined
  let setCookie: (name: string, value: string, options?: any) => void
  let removeCookie: (name: string, options?: any) => void

  try {
    const store: any = await (cookies() as any)
    getCookie = (name: string) => store.get(name)?.value
    setCookie = (name: string, value: string, options?: any) => {
      try { store.set(name, value, options) } catch {}
    }
    removeCookie = (name: string, options?: any) => {
      try { store.set(name, '', { ...(options || {}), expires: new Date(0) }) } catch {}
    }
  } catch {
    const hdrs: any = await (headers() as any)
    getCookie = (name: string) => {
      const cookieHeader: string = hdrs.get('cookie') || ''
      const parts: string[] = cookieHeader.split(';')
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
    } as any)
  )
}
