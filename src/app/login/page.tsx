'use client'

import { useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { signIn } from './actions'
import { localSignIn } from './localActions'

function LoginInner() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [userPassword, setUserPassword] = useState('')
  const searchParams = useSearchParams()
  const error = searchParams.get('error')
  const message = searchParams.get('message')

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <div className="p-8 bg-white rounded shadow-md w-full max-w-md space-y-8">
        <h1 className="text-2xl font-bold text-center">로그인</h1>
        {(error || message) && (
          <p className={`mb-4 text-sm ${error ? 'text-red-600' : 'text-green-600'}`}>
            {error ?? message}
          </p>
        )}

        <section>
          <h2 className="font-semibold mb-2">관리자 로그인 (이메일)</h2>
          <form action={signIn} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">이메일</label>
              <input type="email" id="email" name="email" className="mt-1 block w-full px-3 py-2 border rounded-md" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">비밀번호</label>
              <input type="password" id="password" name="password" className="mt-1 block w-full px-3 py-2 border rounded-md" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>
            <button type="submit" className="w-full py-2 bg-blue-600 text-white rounded">로그인</button>
          </form>
        </section>

        <section>
          <h2 className="font-semibold mb-2">사용자 로그인 (아이디)</h2>
          <form action={localSignIn} className="space-y-4">
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700">아이디</label>
              <input type="text" id="username" name="username" className="mt-1 block w-full px-3 py-2 border rounded-md" value={username} onChange={(e) => setUsername(e.target.value)} required />
            </div>
            <div>
              <label htmlFor="userPassword" className="block text-sm font-medium text-gray-700">비밀번호</label>
              <input type="password" id="userPassword" name="password" className="mt-1 block w-full px-3 py-2 border rounded-md" value={userPassword} onChange={(e) => setUserPassword(e.target.value)} required />
            </div>
            <button type="submit" className="w-full py-2 bg-gray-700 text-white rounded">로그인</button>
          </form>
        </section>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginInner />
    </Suspense>
  )
}
