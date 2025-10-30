'use client'

import { Suspense, useEffect, useRef, useState } from 'react'
import { useFormStatus } from 'react-dom'
import { useSearchParams } from 'next/navigation'
import { localSignIn, localSignUp } from './localActions'

function LoginInner() {
  const searchParams = useSearchParams()
  const error = searchParams.get('error')
  const message = searchParams.get('message')

  const [signInPwVisible, setSignInPwVisible] = useState(false)
  const [signUpPwVisible, setSignUpPwVisible] = useState(false)
  const [signInCaps, setSignInCaps] = useState(false)
  const [signUpCaps, setSignUpCaps] = useState(false)

  const handleCaps =
    (setter: (v: boolean) => void) =>
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      try {
        const on = e.getModifierState?.('CapsLock') ?? false
        setter(on)
      } catch {
        setter(false)
      }
    }

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
                <div className="relative">
                  <input
                    type={signInPwVisible ? 'text' : 'password'}
                    id="password"
                    name="password"
                    onKeyUp={handleCaps(setSignInCaps)}
                    onKeyDown={handleCaps(setSignInCaps)}
                    className="mt-1 block w-full px-3 py-2 pr-12 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setSignInPwVisible((v: boolean) => !v)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-xs px-2 py-1 rounded text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-700"
                  >{signInPwVisible ? 'Hide' : 'Show'}</button>
                </div>
                {signInCaps && <p className="mt-1 text-xs text-amber-600">Caps Lock is ON</p>}
              </div>
              <button type="submit" className="w-full py-2 px-4 bg-blue-600 text-white rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">로그인</button>
              <FormPendingController />
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
                <div className="relative">
                  <input
                    type={signUpPwVisible ? 'text' : 'password'}
                    id="new_password"
                    name="password"
                    onKeyUp={handleCaps(setSignUpCaps)}
                    onKeyDown={handleCaps(setSignUpCaps)}
                    className="mt-1 block w-full px-3 py-2 pr-12 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setSignUpPwVisible((v: boolean) => !v)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-xs px-2 py-1 rounded text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-700"
                  >{signUpPwVisible ? 'Hide' : 'Show'}</button>
                </div>
                {signUpCaps && <p className="mt-1 text-xs text-amber-600">Caps Lock is ON</p>}
              </div>
              <div>
                <label htmlFor="gmail" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Gmail</label>
                <input type="email" id="gmail" name="gmail" className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100" placeholder="example@gmail.com" required />
              </div>
              <button type="submit" className="w-full py-2 px-4 bg-gray-700 text-white rounded-md shadow-sm hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500">회원가입</button>
              <FormPendingController />
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

function FormPendingController() {
  const { pending } = useFormStatus()
  const ref = useRef<HTMLDivElement | null>(null)
  useEffect(() => {
    const form = ref.current?.closest('form') as HTMLFormElement | null
    if (!form) return
    const btn = form.querySelector('button[type="submit"]') as HTMLButtonElement | null
    if (btn) btn.disabled = pending
  }, [pending])
  return (
    <div ref={ref} className="mt-2 h-4">
      {pending ? (
        <span className="inline-block align-middle w-4 h-4 border-2 border-gray-400 dark:border-gray-600 border-t-transparent rounded-full animate-spin" aria-hidden="true" />
      ) : null}
    </div>
  )
}
