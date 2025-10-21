"use server"

import { cookies } from 'next/headers'
import { verify } from '@/lib/auth/jwt'
import { createClient } from '@/lib/supabase/server'

export type AuthPrincipal =
  | { source: 'supabase'; id: string; email: string | null; role: 'admin' | 'member' }
  | { source: 'local'; id: string; username: string; role: 'admin' | 'member' }

export async function getAuth(): Promise<{ authenticated: boolean; principal?: AuthPrincipal }> {
  // Supabase session (admin email)
  try {
    const supabase = await createClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (session?.user) {
      const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL || null
      const role = session.user.email && adminEmail && session.user.email === adminEmail ? 'admin' : 'member'
      return {
        authenticated: true,
        principal: { source: 'supabase', id: session.user.id, email: session.user.email ?? null, role },
      }
    }
  } catch {}

  // Local JWT session
  try {
    const jar = await cookies()
    const token = jar.get('local_session')?.value
    if (token) {
      const secret = process.env.APP_SECRET || 'dev-secret'
      const v = verify(token, secret)
      if (v.valid && v.payload && v.payload.username) {
        return {
          authenticated: true,
          principal: {
            source: 'local',
            id: String(v.payload.uid ?? v.payload.username),
            username: String(v.payload.username),
            role: (v.payload.role as 'admin' | 'member') || 'member',
          },
        }
      }
    }
  } catch {}

  return { authenticated: false }
}

export async function requireAuth() {
  const a = await getAuth()
  if (!a.authenticated || !a.principal) {
    throw new Error('AUTH_REQUIRED')
  }
  return a.principal
}

