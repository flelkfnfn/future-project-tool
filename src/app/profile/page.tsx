export const runtime = 'nodejs'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { getAuth } from '@/lib/auth/session'
import { createServiceClient } from '@/lib/supabase/service'
import { hashPassword, verifyPassword } from '@/lib/auth/local'
import { sign } from '@/lib/auth/jwt'

async function updateProfile(formData: FormData) {
  'use server'
  const auth = await getAuth()
  if (!auth.authenticated) redirect('/login')
  const p = auth.principal
  if (!p || p.source !== 'local') redirect('/profile?error=' + encodeURIComponent('UNSUPPORTED'))
  
  const currentPassword = String(formData.get('current_password') ?? '')
  const newUsername = String(formData.get('username') ?? '').trim()
  const newEmail = String(formData.get('email') ?? '').trim()
  
  if (!currentPassword) redirect('/profile?error=' + encodeURIComponent('PASSWORD_REQUIRED'))
  if (!newUsername) redirect('/profile?error=' + encodeURIComponent('USERNAME_REQUIRED'))

  const svc = createServiceClient()
  
  // 1. Verify password
  const { data: user, error: fetchError } = await svc.from('local_users').select('password_hash, salt, username, gmail, role').eq('username', p.username).single()

  if (fetchError || !user) {
    redirect('/profile?error=' + encodeURIComponent(fetchError?.message || 'USER_NOT_FOUND'))
    return
  }

  const isPasswordCorrect = verifyPassword(currentPassword, user.salt, user.password_hash)
  if (!isPasswordCorrect) {
    redirect('/profile?error=' + encodeURIComponent('INVALID_PASSWORD'))
    return
  }

  const updates: Record<string, string | null> = {}
  let usernameChanged = false

  // 2. Check username change
  if (newUsername !== user.username) {
    // Check duplication
    const { data: duplicate } = await svc.from('local_users').select('id').eq('username', newUsername).maybeSingle()
    if (duplicate) {
      redirect('/profile?error=' + encodeURIComponent('USERNAME_TAKEN'))
      return
    }
    updates.username = newUsername
    usernameChanged = true
  }

  // 3. Check email change
  if (newEmail !== (user.gmail || '')) {
    updates.gmail = newEmail || null
  }

  if (Object.keys(updates).length === 0) {
    redirect('/profile?message=' + encodeURIComponent('NO_CHANGES'))
    return
  }

  // 4. Update DB
  const { error: updateError } = await svc.from('local_users').update(updates).eq('username', p.username)
  
  if (updateError) {
    redirect('/profile?error=' + encodeURIComponent(updateError.message))
    return
  }

  // 5. Update Session if username changed
  if (usernameChanged) {
    const jar = await cookies()
    const secret = process.env.APP_SECRET || 'dev-secret'
    // Re-sign token with new username
    // Assuming role is kept or fetched. Using user.role from DB.
    const token = sign({ username: newUsername, role: user.role, uid: p.id }, secret)
    jar.set('local_session', token, { httpOnly: true, path: '/', secure: process.env.NODE_ENV === 'production', sameSite: 'lax' })
  }

  redirect('/profile?message=' + encodeURIComponent('PROFILE_UPDATED'))
}

async function changePassword(formData: FormData) {
  'use server'
  const auth = await getAuth()
  if (!auth.authenticated) redirect('/login')
  const p = auth.principal
  const currentPassword = String(formData.get('current_password') ?? '')
  const newPassword = String(formData.get('new_password') ?? '')
  if (!currentPassword || !newPassword) redirect('/profile?error=' + encodeURIComponent('PASSWORD_REQUIRED'))
  if (!p || p.source !== 'local') redirect('/profile?error=' + encodeURIComponent('UNSUPPORTED'))
  if (p.username === 'admin') redirect('/profile?error=' + encodeURIComponent('FORBIDDEN'))
  
  const svc = createServiceClient()
  
  const { data: user, error: fetchError } = await svc.from('local_users').select('password_hash, salt').eq('username', p.username).single()

  if (fetchError || !user) {
    redirect('/profile?error=' + encodeURIComponent(fetchError?.message || 'USER_NOT_FOUND'))
    return
  }

  const isPasswordCorrect = verifyPassword(currentPassword, user.salt, user.password_hash)
  if (!isPasswordCorrect) {
    redirect('/profile?error=' + encodeURIComponent('INVALID_CURRENT_PASSWORD'))
    return
  }

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
  
  // Default values
  let currentUsername = ''
  let currentEmail = ''
  
  if (p?.source === 'local') {
    currentUsername = p.username
    try {
      const svc = createServiceClient()
      const { data } = await svc.from('local_users').select('gmail').eq('username', p.username).maybeSingle()
      currentEmail = data?.gmail ?? ''
    } catch {}
  } else if (p?.email) {
    currentEmail = p.email
    currentUsername = p.id // Supabase users might not have a simple username
  }

  const isLocal = p?.source === 'local'

  return (
    <div className="max-w-lg mx-auto p-4 space-y-8 animate-fade-in-up">
      <h1 className="text-2xl font-bold">프로필 설정</h1>
      {(error || message) && (
        <div className={`p-3 rounded-lg text-sm ${error ? 'bg-red-50 text-red-600 border border-red-200' : 'bg-green-50 text-green-600 border border-green-200'}`}>
          {error ?? message}
        </div>
      )}

      {/* 기본 정보 수정 (로컬 계정만 가능) */}
      {isLocal ? (
        <div className="border border-gray-200 rounded-xl p-6 bg-white shadow-sm space-y-4 dark:bg-gray-800 dark:border-gray-700">
            <h2 className="font-semibold text-lg border-b pb-2 mb-4 dark:border-gray-700">기본 정보 수정</h2>
            <form action={updateProfile} className="flex flex-col gap-4">
            <label className="flex flex-col text-sm gap-1">
                <span className="font-medium text-gray-700 dark:text-gray-300">ID (사용자명)</span>
                <input 
                type="text" 
                name="username" 
                defaultValue={currentUsername}
                className="border border-gray-300 px-3 py-2 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none dark:bg-gray-700 dark:border-gray-600" 
                required 
                />
            </label>
            <label className="flex flex-col text-sm gap-1">
                <span className="font-medium text-gray-700 dark:text-gray-300">이메일</span>
                <input 
                type="email" 
                name="email" 
                defaultValue={currentEmail}
                className="border border-gray-300 px-3 py-2 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none dark:bg-gray-700 dark:border-gray-600" 
                />
            </label>
            
            <div className="pt-2">
                <label className="flex flex-col text-sm gap-1">
                <span className="font-medium text-gray-700 dark:text-gray-300">변경 확인을 위한 현재 비밀번호</span>
                <input 
                    type="password" 
                    name="current_password" 
                    placeholder="현재 비밀번호를 입력하세요"
                    autoComplete="current-password" 
                    className="border border-gray-300 px-3 py-2 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none dark:bg-gray-700 dark:border-gray-600" 
                    required 
                />
                </label>
            </div>

            <button className="mt-2 px-4 py-2 rounded-lg bg-indigo-600 text-white font-medium hover:bg-indigo-700 transition-colors self-end">
                정보 수정 저장
            </button>
            </form>
        </div>
      ) : (
        <div className="border border-gray-200 rounded-xl p-6 bg-gray-50 shadow-sm dark:bg-gray-800 dark:border-gray-700">
             <h2 className="font-semibold text-lg border-b pb-2 mb-4 dark:border-gray-700">기본 정보</h2>
             <div className="space-y-4">
                <div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">계정 유형</div>
                    <div className="font-medium">외부 연동 계정 (Google 등)</div>
                </div>
                <div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">Email</div>
                    <div className="font-medium">{currentEmail}</div>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                    외부 계정의 정보는 해당 서비스 제공업체에서 관리됩니다.
                </p>
             </div>
        </div>
      )}

      {/* 비밀번호 변경 */}
      {isLocal && (
        <div className="border border-gray-200 rounded-xl p-6 bg-white shadow-sm space-y-4 dark:bg-gray-800 dark:border-gray-700">
          <h2 className="font-semibold text-lg border-b pb-2 mb-4 dark:border-gray-700">비밀번호 변경</h2>
          <form action={changePassword} className="flex flex-col gap-4">
            <label className="flex flex-col text-sm gap-1">
              <span className="font-medium text-gray-700 dark:text-gray-300">현재 비밀번호</span>
              <input type="password" name="current_password" autoComplete="current-password" className="border border-gray-300 px-3 py-2 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none dark:bg-gray-700 dark:border-gray-600" required />
            </label>
            <label className="flex flex-col text-sm gap-1">
              <span className="font-medium text-gray-700 dark:text-gray-300">새 비밀번호</span>
              <input type="password" name="new_password" autoComplete="new-password" className="border border-gray-300 px-3 py-2 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none dark:bg-gray-700 dark:border-gray-600" required />
            </label>
            <button className="mt-2 px-4 py-2 rounded-lg bg-gray-600 text-white font-medium hover:bg-gray-700 transition-colors self-end">비밀번호 변경</button>
          </form>
        </div>
      )}

      {/* 계정 삭제 */}
      {isLocal && (
        <div className="border border-red-200 rounded-xl p-6 bg-red-50/50 shadow-sm space-y-4 dark:bg-red-900/10 dark:border-red-800">
          <h2 className="font-semibold text-lg text-red-600 border-b border-red-200 pb-2 mb-4 dark:border-red-800">계정 삭제 (Danger Zone)</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            계정을 삭제하면 모든 데이터가 영구적으로 삭제되며 복구할 수 없습니다.
          </p>
          <form action={deleteAccount} className="space-y-4">                                                                                   
            <label className="flex flex-col text-sm gap-1">                                                                                           
              <span className="font-medium text-gray-700 dark:text-gray-300">삭제를 확인하려면 <span className="font-bold text-red-600">DELETE</span>를 입력하세요.</span>                                                                                               
              <input name="confirm" className="border border-gray-300 px-3 py-2 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none dark:bg-gray-700 dark:border-gray-600" placeholder="DELETE" />                                                
            </label>                                                                                                                            
            <button className="px-4 py-2 rounded-lg bg-red-600 text-white font-medium hover:bg-red-700 transition-colors">계정 영구 삭제</button>                                                      
          </form>
        </div>
      )}
    </div>
  )
}