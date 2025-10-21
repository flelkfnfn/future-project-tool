"use server"

import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { hashPassword } from '@/lib/auth/local'

export async function createLocalUser(formData: FormData) {
  const username = String(formData.get('username') ?? '').trim()
  const password = String(formData.get('password') ?? '')
  if (!username || !password) redirect('/admin?error=아이디와 비밀번호를 입력하세요')

  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL
  if (!session?.user?.email || !adminEmail || session.user.email !== adminEmail) {
    redirect('/login?error=관리자만 가능합니다')
  }

  const { salt, hash } = hashPassword(password)
  const { error } = await supabase.from('local_users').insert({ username, password_hash: hash, salt, role: 'member' })
  if (error) redirect(`/admin?error=${encodeURIComponent(error.message)}`)
  redirect('/admin?message=생성되었습니다')
}

