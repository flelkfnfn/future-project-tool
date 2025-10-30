export const runtime = 'nodejs'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createServiceClient } from '@/lib/supabase/service'
import { hashPassword } from '@/lib/auth/local'
import { getAuth } from '@/lib/auth/session'

async function createLocalUser(formData: FormData) {
  'use server'
  const username = String(formData.get('username') ?? '').trim()
  const password = String(formData.get('password') ?? '')
  if (!username || !password) redirect(`/admin?error=${encodeURIComponent('아이디와 비밀번호를 입력하세요')}`)

  // removed email-based admin check
  const auth = await getAuth()
  const p1 = auth.principal
  const isLocalAdmin = !!(auth.authenticated && p1 && p1.source === 'local' && p1.username === 'admin')
  if (!isLocalAdmin) {
    redirect(`/login?error=${encodeURIComponent('관리자만 접근 가능합니다')}`)
  }

  try {
    const { salt, hash } = hashPassword(password)
    const svc = createServiceClient()

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
  } catch (e: unknown) {
    // rethrow Next redirect errors
    if (typeof e === 'object' && e !== null && 'digest' in e) {
      const d = (e as { digest?: unknown }).digest
      if (typeof d === 'string' && d.startsWith('NEXT_REDIRECT')) throw e
    }
    let msg = 'Server error'
    if (typeof e === 'object' && e !== null && 'message' in e) {
      const m = (e as { message?: unknown }).message
      if (typeof m === 'string') msg = m
    }
    redirect(`/admin?error=${encodeURIComponent(msg)}`)
  }
}

// Admin actions for managing local_users
async function addLocalUser(formData: FormData) {
  'use server'
  const auth = await getAuth()
  const p = auth.principal
  const isAdmin = !!(auth.authenticated && p && p.source === 'local' && p.username === 'admin')
  if (!isAdmin) return
  const username = String(formData.get('username') ?? '').trim()
  const password = String(formData.get('password') ?? '')
  const gmail = String(formData.get('gmail') ?? '').trim()
  if (!username || !password || !gmail) return
  const svc = createServiceClient()
  const { data: existing } = await svc.from('local_users').select('id').eq('username', username).maybeSingle()
  if (existing) return
  const { data: existingEmail } = await svc.from('local_users').select('id').eq('gmail', gmail).maybeSingle()
  if (existingEmail) return
  const { salt, hash } = hashPassword(password)
  await svc.from('local_users').insert({ username, password_hash: hash, salt, role: 'member', gmail })
  revalidatePath('/admin')
}

async function deleteLocalUser(formData: FormData) {
  'use server'
  const auth = await getAuth()
  const p = auth.principal
  const isAdmin = !!(auth.authenticated && p && p.source === 'local' && p.username === 'admin')
  if (!isAdmin) return
  const id = String(formData.get('id') ?? '').trim()
  if (!id) return
  const svc = createServiceClient()
  const { data: row } = await svc.from('local_users').select('username').eq('id', id).maybeSingle()
  if (row && row.username === 'admin') return
  await svc.from('local_users').delete().eq('id', id)
  revalidatePath('/admin')
}

export default async function AdminPage({ searchParams }: { searchParams: Promise<{ error?: string; message?: string }> }) {
  const auth = await getAuth()
  const p = auth.principal
  const isAdmin = !!(auth.authenticated && p && p.source === 'local' && p.username === 'admin')
  if (isAdmin) {
    const svc = createServiceClient()
    const { data: users } = await svc.from('local_users').select('id, username, role').order('username')
    return (
      <div className="max-w-2xl mx-auto p-4 space-y-6">
        <div>
          <h2 className="text-lg font-semibold mb-2">local_users</h2>
          <div className="border rounded">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100">
                  <th className="text-left p-2">id</th>
                  <th className="text-left p-2">username</th>
                  <th className="text-left p-2">role</th>
                  <th className="text-left p-2">actions</th>
                </tr>
              </thead>
              <tbody>
                {(users ?? []).map((u: any) => (
                  <tr key={u.id} className="border-t">
                    <td className="p-2 align-top">{u.id}</td>
                    <td className="p-2 align-top">{u.username}</td>
                    <td className="p-2 align-top">{u.role}</td>
                    <td className="p-2 align-top">
                      <form action={deleteLocalUser}>
                        <input type="hidden" name="id" value={u.id} />
                        <button className="px-2 py-1 rounded bg-red-600 text-white" disabled={u.username === 'admin'}>Delete</button>
                      </form>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div>
          <h2 className="text-lg font-semibold mb-2">add user</h2>
          <form action={addLocalUser} className="flex gap-2 items-end">
            <label className="flex flex-col text-sm">
              <span>username</span>
              <input name="username" className="border px-2 py-1 rounded" />
            </label>
            <label className="flex flex-col text-sm">
              <span>password</span>
              <input type="password" name="password" className="border px-2 py-1 rounded" />
            </label>
            <label className="flex flex-col text-sm">
              <span>gmail</span>
              <input name="gmail" className="border px-2 py-1 rounded" />
            </label>
            <button className="px-3 py-1 rounded bg-blue-600 text-white">Add</button>
          </form>
        </div>
      </div>
    )
  }
  return <div className="p-4"><p className="text-red-600">관리자만 접근 가능합니다.</p></div>
  if (!isAdmin) {
    redirect(`/login?error=${encodeURIComponent('관리자만 접근 가능합니다')}`)
  }
  const params = await searchParams
  const error = params?.error
  const message = params?.message
  return (
    <div className="max-w-md mx-auto p-4">
      <h1 className="text-xl font-bold mb-4">로컬 사용자 관리</h1>
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
