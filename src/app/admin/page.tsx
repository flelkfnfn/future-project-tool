'use client'

import { useState } from 'react'
import { useSupabase } from '@/components/supabase-provider'
import { createLocalUser } from './server'

export default function AdminPage() {
  const { session } = useSupabase()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const isAdmin = session?.user?.email && process.env.NEXT_PUBLIC_ADMIN_EMAIL && session.user.email === process.env.NEXT_PUBLIC_ADMIN_EMAIL

  if (!isAdmin) {
    return <p className="p-4 text-red-600">관리자만 접근 가능합니다.</p>
  }

  return (
    <div className="max-w-md mx-auto p-4">
      <h1 className="text-xl font-bold mb-4">로컬 사용자 추가</h1>
      <form action={createLocalUser} className="space-y-3">
        <div>
          <label className="block text-sm">아이디</label>
          <input name="username" value={username} onChange={(e) => setUsername(e.target.value)} className="border px-2 py-1 w-full" />
        </div>
        <div>
          <label className="block text-sm">비밀번호</label>
          <input type="password" name="password" value={password} onChange={(e) => setPassword(e.target.value)} className="border px-2 py-1 w-full" />
        </div>
        <button className="bg-blue-600 text-white px-3 py-1 rounded">추가</button>
      </form>
    </div>
  )
}

