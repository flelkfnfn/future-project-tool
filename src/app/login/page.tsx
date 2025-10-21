'use client'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { localSignIn, localSignUp } from './localActions'

function LoginInner() {
  const searchParams = useSearchParams()
  const error = searchParams.get('error')
  const message = searchParams.get('message')

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
      <div className="p-8 bg-white rounded border w-full max-w-md space-y-6">
        <h1 className="text-2xl font-bold text-center">로그인 / 회원가입</h1>
        {(error || message) && (
          <p className={`mb-2 text-sm ${error ? 'text-rose-600' : 'text-green-600'}`}>
            {error ?? message}
          </p>
        )}
        <section>
          <h2 className="font-semibold mb-2">로그인 (아이디/비밀번호)</h2>
          <form action={localSignIn} className="space-y-4">
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700">아이디</label>
              <input id="username" name="username" className="mt-1 block w-full px-3 py-2 border rounded-md" required />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">비밀번호</label>
              <input type="password" id="password" name="password" className="mt-1 block w-full px-3 py-2 border rounded-md" required />
            </div>
            <button type="submit" className="w-full py-2 bg-blue-600 text-white rounded">로그인</button>
          </form>
        </section>

        <section>
          <h2 className="font-semibold mb-2">회원가입 (아이디/비밀번호/Gmail)</h2>
          <form action={localSignUp} className="space-y-4">
            <div>
              <label htmlFor="new_username" className="block text-sm font-medium text-gray-700">아이디</label>
              <input id="new_username" name="username" className="mt-1 block w-full px-3 py-2 border rounded-md" required />
            </div>
            <div>
              <label htmlFor="new_password" className="block text-sm font-medium text-gray-700">비밀번호</label>
              <input type="password" id="new_password" name="password" className="mt-1 block w-full px-3 py-2 border rounded-md" required />
            </div>
            <div>
              <label htmlFor="gmail" className="block text-sm font-medium text-gray-700">Gmail</label>
              <input type="email" id="gmail" name="gmail" className="mt-1 block w-full px-3 py-2 border rounded-md" placeholder="example@gmail.com" required />
            </div>
            <button type="submit" className="w-full py-2 bg-gray-700 text-white rounded">회원가입</button>
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
