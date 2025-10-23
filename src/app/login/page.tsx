'use client'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { localSignIn, localSignUp } from './localActions'

function LoginInner() {
  const searchParams = useSearchParams()
  const error = searchParams.get('error')
  const message = searchParams.get('message')

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="p-8 bg-white dark:bg-gray-800 rounded-lg shadow-md w-full max-w-md space-y-8">
        <h1 className="text-3xl font-bold text-center text-gray-900 dark:text-gray-100">로그인 / 회원가입</h1>
        {(error || message) && (
          <div className={`p-4 rounded-md text-sm ${error ? 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-300' : 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-300'}`}>
            {error ?? message}
          </div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <section>
            <h2 className="font-semibold text-lg mb-4 text-gray-800 dark:text-gray-200">로그인</h2>
            <form action={localSignIn} className="space-y-4">
              <div>
                <label htmlFor="username" className="block text-sm font-medium text-gray-700 dark:text-gray-300">아이디</label>
                <input id="username" name="username" className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100" required />
              </div>
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">비밀번호</label>
                <input type="password" id="password" name="password" className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100" required />
              </div>
              <button type="submit" className="w-full py-2 px-4 bg-blue-600 text-white rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">로그인</button>
            </form>
          </section>

          <section>
            <h2 className="font-semibold text-lg mb-4 text-gray-800 dark:text-gray-200">회원가입</h2>
            <form action={localSignUp} className="space-y-4">
              <div>
                <label htmlFor="new_username" className="block text-sm font-medium text-gray-700 dark:text-gray-300">아이디</label>
                <input id="new_username" name="username" className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100" required />
              </div>
              <div>
                <label htmlFor="new_password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">비밀번호</label>
                <input type="password" id="new_password" name="password" className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100" required />
              </div>
              <div>
                <label htmlFor="gmail" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Gmail</label>
                <input type="email" id="gmail" name="gmail" className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100" placeholder="example@gmail.com" required />
              </div>
              <button type="submit" className="w-full py-2 px-4 bg-gray-700 text-white rounded-md shadow-sm hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500">회원가입</button>
            </form>
          </section>
        </div>
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
