"use server"

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { hashPassword, verifyPassword } from '@/lib/auth/local'
import { sign } from '@/lib/auth/jwt'

const TABLE = 'local_users'

export async function localSignIn(formData: FormData) {
  const username = String(formData.get('username') ?? '').trim()
  const password = String(formData.get('password') ?? '')
  if (!username || !password) redirect('/login?error=아이디와 비밀번호를 입력하세요')

  const supabase = await createClient()
  const { data, error } = await supabase
    .from(TABLE)
    .select('id, username, salt, password_hash, role')
    .eq('username', username)
    .maybeSingle()

  if (error || !data) redirect('/login?error=아이디 또는 비밀번호가 올바르지 않습니다')
  const valid = verifyPassword(password, data.salt, data.password_hash)
  if (!valid) redirect('/login?error=아이디 또는 비밀번호가 올바르지 않습니다')

  const token = sign({ uid: data.id, username: data.username, role: data.role }, process.env.APP_SECRET || 'dev-secret')
  const jar = await cookies()
  jar.set('local_session', token, { httpOnly: true, sameSite: 'lax', path: '/', maxAge: 60 * 60 * 24 * 7 })
  redirect('/')
}

export async function localSignOut() {
  const jar = await cookies()
  jar.set('local_session', '', { path: '/', expires: new Date(0) })
  redirect('/login')
}

