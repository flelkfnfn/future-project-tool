"use server"

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'

export async function signIn(formData: FormData) {
  const email = String(formData.get('email') ?? '').trim().toLowerCase()
  const password = String(formData.get('password') ?? '')
  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) {
    redirect(`/login?error=${encodeURIComponent(error.message)}`)
  }
  redirect('/')
}

export async function signUp(formData: FormData) {
  const email = String(formData.get('email') ?? '').trim().toLowerCase()
  const password = String(formData.get('password') ?? '')
  const supabase = await createClient()

  // If service role key is available, create and confirm the user via admin API
  if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
    const admin = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    const { data: created, error: adminErr } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    })
    if (adminErr) {
      const msg = adminErr.message || ''
      if (msg.toLowerCase().includes('already') && msg.toLowerCase().includes('registered')) {
        // Existing user: try to sign in with provided password
        const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })
        if (signInError) {
          redirect(`/login?error=${encodeURIComponent('이미 가입된 이메일입니다. 비밀번호로 로그인하거나 비밀번호를 재설정해 주세요.')}`)
        }
        redirect('/')
      }
      redirect(`/login?error=${encodeURIComponent(msg)}`)
    }
    // Created and confirmed: sign in immediately
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })
    if (signInError) {
      redirect(`/login?error=${encodeURIComponent(signInError.message)}`)
    }
    redirect('/')
  }

  // Fallback: anon sign up (may require email confirmation)
  const { error } = await supabase.auth.signUp({ email, password })
  if (error) {
    const msg = error.message || ''
    if (msg.toLowerCase().includes('already') && msg.toLowerCase().includes('registered')) {
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })
      if (signInError) {
        redirect(`/login?error=${encodeURIComponent('이미 가입된 이메일입니다. 비밀번호로 로그인하거나 비밀번호를 재설정해 주세요.')}`)
      }
      redirect('/')
    }
    redirect(`/login?error=${encodeURIComponent(msg)}`)
  }
  redirect(`/login?message=${encodeURIComponent('회원가입 완료. 이메일 인증 후 로그인하세요.')}`)
}
