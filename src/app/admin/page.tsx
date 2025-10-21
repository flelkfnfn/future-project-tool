export const runtime = 'nodejs'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { hashPassword } from '@/lib/auth/local'

async function createLocalUser(formData: FormData) {
  'use server'
  const username = String(formData.get('username') ?? '').trim()
  const password = String(formData.get('password') ?? '')
  if (!username || !password) redirect(`/admin?error=${encodeURIComponent('아이디와 비밀번호를 입력하세요')}`)

  // 관리자 확인: getUser()로 인증된 사용자 조회
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL
  if (!user?.email || !adminEmail || user.email !== adminEmail) {
    redirect(`/login?error=${encodeURIComponent('관리자만 가능합니다')}`)
  }

  try {
    const { salt, hash } = hashPassword(password)
    const svc = createServiceClient()

    // 이미 존재하면 비밀번호 업데이트, 없으면 생성
    const { data: existing, error: selErr } = await svc
      .from('local_users')
      .select('id, role')
      .eq('username', username)
      .maybeSingle()

    if (selErr) redirect(`/admin?error=${encodeURIComponent(selErr.message)}`)

    if (existing) {
      const { error: upErr } = await svc
        .from('local_users')
        .update({ password_hash: hash, salt })
        .eq('id', existing.id)
      if (upErr) redirect(`/admin?error=${encodeURIComponent(upErr.message)}`)
      redirect(`/admin?message=${encodeURIComponent('비밀번호가 변경되었습니다')}`)
    } else {
      const { error: insErr } = await svc
        .from('local_users')
        .insert({ username, password_hash: hash, salt, role: 'member' })
      if (insErr) redirect(`/admin?error=${encodeURIComponent(insErr.message)}`)
      redirect(`/admin?message=${encodeURIComponent('생성되었습니다')}`)
    }
  } catch (e: any) {
    // rethrow Next redirect errors
    if (e && typeof e === 'object' && 'digest' in e) {
      const d = (e as any).digest
      if (typeof d === 'string' && d.startsWith('NEXT_REDIRECT')) throw e
    }
    const msg = e?.message || 'Server error'
    redirect(`/admin?error=${encodeURIComponent(msg)}`)
  }
}

export default async function AdminPage({ searchParams }: { searchParams: Promise<{ error?: string; message?: string }> }) {
  const params = await searchParams
  const error = params?.error
  const message = params?.message
  return (
    <div className="max-w-md mx-auto p-4">
      <h1 className="text-xl font-bold mb-4">로컬 사용자 추가</h1>
      {(error || message) && (
        <p className={`mb-4 text-sm ${error ? 'text-red-600' : 'text-green-600'}`}>{error ?? message}</p>
      )}
      <form action={createLocalUser} className="space-y-3">
        <div>
          <label className="block text-sm">아이디</label>
          <input name="username" className="border px-2 py-1 w-full" />
        </div>
        <div>
          <label className="block text-sm">비밀번호</label>
          <input type="password" name="password" className="border px-2 py-1 w-full" />
        </div>
        <button className="bg-blue-600 text-white px-3 py-1 rounded">추가</button>
      </form>
    </div>
  )
}
