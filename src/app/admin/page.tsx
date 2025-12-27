export const runtime = 'nodejs'

import { revalidatePath } from 'next/cache'
import { createServiceClient } from '@/lib/supabase/service'
import { hashPassword } from '@/lib/auth/local'
import { getAuth } from '@/lib/auth/session'
import NotFoundAdmin from '@/components/NotFoundAdmin'

const normalizeRole = (raw: unknown) => {
  const val = typeof raw === 'string' ? raw.trim() : ''
  if (val === 'admin' || val === 'member') return val
  return ''
}


// Admin actions for managing local_users
async function addLocalUser(formData: FormData) {
  'use server'
  const auth = await getAuth()
  const p = auth.principal
  const isAdmin = !!(auth.authenticated && p && p.role === 'admin')
  if (!isAdmin) return
  const username = String(formData.get('username') ?? '').trim()
  const password = String(formData.get('password') ?? '')
  const gmail = String(formData.get('gmail') ?? '').trim()
  const role = normalizeRole(formData.get('role'))
  if (!username || !password || !gmail) return
  const svc = createServiceClient()
  const { data: existing } = await svc.from('local_users').select('id').eq('username', username).maybeSingle()
  if (existing) return
  const { data: existingEmail } = await svc.from('local_users').select('id').eq('gmail', gmail).maybeSingle()
  if (existingEmail) return
  const { salt, hash } = hashPassword(password)
  await svc.from('local_users').insert({ username, password_hash: hash, salt, role, gmail })
  revalidatePath('/admin')
}

async function deleteLocalUser(formData: FormData) {
  'use server'
  const auth = await getAuth()
  const p = auth.principal
  const isAdmin = !!(auth.authenticated && p && p.role === 'admin')
  if (!isAdmin) return
  const id = String(formData.get('id') ?? '').trim()
  if (!id) return
  const svc = createServiceClient()
  const { data: row } = await svc.from('local_users').select('username').eq('id', id).maybeSingle()
  if (row && row.username === 'admin') return
  await svc.from('local_users').delete().eq('id', id)
  revalidatePath('/admin')
}

async function updateLocalUserRole(formData: FormData) {
  'use server'
  const auth = await getAuth()
  const p = auth.principal
  const isAdmin = !!(auth.authenticated && p && p.role === 'admin')
  if (!isAdmin) return
  const id = String(formData.get('id') ?? '').trim()
  const role = normalizeRole(formData.get('role'))
  if (!id) return
  const svc = createServiceClient()
  await svc.from('local_users').update({ role }).eq('id', id)
  revalidatePath('/admin')
}

interface LocalUser {
  id: number
  username: string
  role: string
}

export default async function AdminPage() {
  const auth = await getAuth()
  const p = auth.principal
  const isAdmin = !!(auth.authenticated && p && p.role === 'admin')
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
                {(users ?? []).map((u: LocalUser) => (
                  <tr key={u.id} className="border-t">
                    <td className="p-2 align-top">{u.id}</td>
                    <td className="p-2 align-top">{u.username}</td>
                    <td className="p-2 align-top">
                      <form action={updateLocalUserRole} className="flex items-center gap-2">
                        <input type="hidden" name="id" value={u.id} />
                        <select
                          name="role"
                          defaultValue={u.role ?? ''}
                          className="border px-2 py-1 rounded"
                        >
                          <option value="">(blank)</option>
                          <option value="member">member</option>
                          <option value="admin">admin</option>
                        </select>
                        <button className="px-2 py-1 rounded bg-gray-700 text-white">Update</button>
                      </form>
                    </td>
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
            <label className="flex flex-col text-sm">
              <span>role</span>
              <select name="role" defaultValue="" className="border px-2 py-1 rounded">
                <option value="">(blank)</option>
                <option value="member">member</option>
                <option value="admin">admin</option>
              </select>
            </label>
            <button className="px-3 py-1 rounded bg-blue-600 text-white">Add</button>
          </form>
        </div>
      </div>
    )
  }
  return <NotFoundAdmin />
}
