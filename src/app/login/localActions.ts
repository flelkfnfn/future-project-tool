"use server"

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { createServiceClient } from '@/lib/supabase/service'
import { verifyPassword } from '@/lib/auth/local'
import { sign } from '@/lib/auth/jwt'

const TABLE = 'local_users'

export async function localSignIn(formData: FormData) {
  const username = String(formData.get('username') ?? '').trim()
  const password = String(formData.get('password') ?? '')
  if (!username || !password) redirect(`/login?error=${encodeURIComponent('아이디와 비밀번호를 입력하세요')}`)

  const svc = createServiceClient()
  const { data, error } = await svc
    .from(TABLE)
    .select('id, username, salt, password_hash, role')
    .eq('username', username)
    .maybeSingle()

  if (error || !data) redirect(`/login?error=${encodeURIComponent('아이디 또는 비밀번호가 올바르지 않습니다')}`)
  const valid = verifyPassword(password, data.salt, data.password_hash)
  if (!valid) redirect(`/login?error=${encodeURIComponent('아이디 또는 비밀번호가 올바르지 않습니다')}`)

  const token = sign({ uid: data.id, username: data.username, role: data.role }, process.env.APP_SECRET || 'dev-secret')
  const jar = await cookies()
  jar.set('local_session', token, { httpOnly: true, sameSite: 'lax', path: '/', maxAge: 60 * 60 * 24 * 7 })
  jar.set('local_session_present', '1', { httpOnly: false, sameSite: 'lax', path: '/', maxAge: 60 * 60 * 24 * 7 })
  redirect('/')
}

export async function localSignOut() {
  const jar = await cookies()
  jar.set('local_session', '', { path: '/', expires: new Date(0) })
  jar.set('local_session_present', '', { path: '/', expires: new Date(0) })
  redirect('/login')
}
