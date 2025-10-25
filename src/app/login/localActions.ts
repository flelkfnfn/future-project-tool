"use server"

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { createServiceClient } from '@/lib/supabase/service'
import { hashPassword, verifyPassword } from '@/lib/auth/local'
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

export async function localSignUp(formData: FormData) {
  const username = String(formData.get('username') ?? '').trim()
  const password = String(formData.get('password') ?? '')
  const gmail = String(formData.get('gmail') ?? '').trim()
  if (!username || !password || !gmail) redirect(`/login?error=${encodeURIComponent('아이디/비밀번호/Gmail을 모두 입력하세요')}`)

  const svc = createServiceClient()
  const { data: existing } = await svc.from(TABLE).select('id').eq('username', username).maybeSingle()
  if (existing) {
    redirect(`/login?error=${encodeURIComponent('이미 등록된 아이디입니다')}`)
  }

  const { data: existingEmail } = await svc.from(TABLE).select('id').eq('gmail', gmail).maybeSingle()
  if (existingEmail) {
    redirect(`/login?error=${encodeURIComponent('이미 등록된 Gmail입니다')}`)
  }

  const { salt, hash } = hashPassword(password)
  const { error: insErr } = await svc
    .from(TABLE)
    .insert({ username, password_hash: hash, salt, role: 'member', gmail })
  if (insErr) redirect(`/login?error=${encodeURIComponent(insErr.message)}`)
  redirect(`/login?message=${encodeURIComponent('회원가입이 완료되었습니다. 로그인해 주세요.')}`)
}

export async function localSignOut() {
  const jar = await cookies()
  jar.set('local_session', '', { path: '/', expires: new Date(0) })
  jar.set('local_session_present', '', { path: '/', expires: new Date(0) })
  redirect('/login')
}
