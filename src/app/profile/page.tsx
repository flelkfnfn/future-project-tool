export const runtime = 'nodejs'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { getAuth } from '@/lib/auth/session'
import { createServiceClient } from '@/lib/supabase/service'
import { hashPassword } from '@/lib/auth/local'

async function changePassword(formData: FormData) {
  'use server'
  const auth = await getAuth()
  if (!auth.authenticated) redirect('/login')
  const p = auth.principal
  const newPassword = String(formData.get('new_password') ?? '')
  if (!newPassword) redirect('/profile?error=' + encodeURIComponent('PASSWORD_REQUIRED'))
  if (!p || p.source !== 'local') redirect('/profile?error=' + encodeURIComponent('UNSUPPORTED'))
  if (p.username === 'admin') redirect('/profile?error=' + encodeURIComponent('FORBIDDEN'))
  const svc = createServiceClient()
  const { salt, hash } = hashPassword(newPassword)
  const { error } = await svc.from('local_users').update({ password_hash: hash, salt }).eq('username', p.username)
  if (error) redirect('/profile?error=' + encodeURIComponent(error.message))
  redirect('/profile?message=' + encodeURIComponent('PASSWORD_UPDATED'))
}

async function deleteAccount(formData: FormData) {
  'use server'
  const auth = await getAuth()
  if (!auth.authenticated) redirect('/login')
  const p = auth.principal
  const confirm = String(formData.get('confirm') ?? '')
  if (confirm !== 'DELETE') redirect('/profile?error=' + encodeURIComponent('CONFIRMATION_REQUIRED'))
  if (!p || p.source !== 'local') redirect('/profile?error=' + encodeURIComponent('UNSUPPORTED'))
  if (p.username === 'admin') redirect('/profile?error=' + encodeURIComponent('FORBIDDEN'))
  const svc = createServiceClient()
  const { error } = await svc.from('local_users').delete().eq('username', p.username)
  if (error) redirect('/profile?error=' + encodeURIComponent(error.message))
  const jar = await cookies()
  jar.set('local_session', '', { path: '/', expires: new Date(0) })
  jar.set('local_session_present', '', { path: '/', expires: new Date(0) })
  redirect('/login')
}

export default async function ProfilePage({ searchParams }: { searchParams: Promise<{ error?: string; message?: string }> }) {
  const auth = await getAuth()
  if (!auth.authenticated) redirect('/login')
  const p = auth.principal
  const params = await searchParams
  const error = params?.error
  const message = params?.message
  const idLabel = p?.source === 'local' ? p.username : (p?.email ?? '')
  let emailLabel: string | null = null
  if (p?.source === 'local') {
    try {
      const svc = createServiceClient()
      const { data } = await svc.from('local_users').select('gmail').eq('username', p.username).maybeSingle()
      emailLabel = data?.gmail ?? null
    } catch {}
  } else if (p?.email) {
    emailLabel = p.email
  }
  return (
    <div className="max-w-lg mx-auto p-4 space-y-6">
      <h1 className="text-xl font-bold">프로필</h1>
      {(error || message) && (
        <p className={`text-sm ${error ? 'text-red-600' : 'text-green-600'}`}>{error ?? message}</p>
      )}
      <div className="border rounded p-3">
        <div className="text-sm text-gray-600">ID</div>
        <div className="text-lg">{idLabel}</div>
        {emailLabel && (
          <div className="mt-2">
            <div className="text-sm text-gray-600">Email</div>
            <div className="text-lg break-all">{emailLabel}</div>
          </div>
        )}
      </div>
      <div className="border rounded p-3 space-y-3">
        <h2 className="font-semibold">비밀번호 변경</h2>
        <form action={changePassword} className="flex gap-2 items-end">
          <label className="flex flex-col text-sm">
            <span>새 비밀번호</span>
            <input type="password" name="new_password" className="border px-2 py-1 rounded" required />
          </label>
          <button className="px-3 py-1 rounded bg-blue-600 text-white">변경</button>
        </form>
        {p?.source !== 'local' && (
          <p className="text-xs text-gray-500">비밀번호 변경은 로컬 계정에서만 가능합니다.</p>
        )}
      </div>
      <div className="border rounded p-3 space-y-3">
        <h2 className="font-semibold">Danger Zone</h2>
        <form action={deleteAccount} className="space-y-2">                                                                                   
          <label className="flex flex-col text-sm">                                                                                           
            <span>삭제를 위해 "DELETE"를 입력하세요.</span>                                                                                               
            <input name="confirm" className="border px-2 py-1 rounded" placeholder="DELETE" />                                                
          </label>                                                                                                                            
          <button className="px-3 py-1 rounded bg-red-600 text-white">계정 삭제</button>                                                      
        </form>
        {p?.source !== 'local' && (
          <p className="text-xs text-gray-500">계정 삭제는 로컬 계정에서만 가능합니다.</p>
        )}
      </div>
      <p className="text-xs text-gray-500">ID, 이메일 변경을 하려면 계정을 삭제한 후 다시 가입해야 합니다.</p>
    </div>
  )
}
