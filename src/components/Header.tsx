'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useSupabase } from '@/components/supabase-provider'
import type { User, Session, AuthChangeEvent } from '@supabase/supabase-js'

const nav = [
  { href: '/projects', label: '프로젝트' },
  { href: '/notices', label: '공지사항' },
  { href: '/ideas', label: '아이디어 모음' },
  { href: '/calendar', label: '캘린더' },
  { href: '/files', label: '파일 공유' },
]

const Header = () => {
  const router = useRouter()
  const pathname = usePathname()
  const { supabase, session } = useSupabase()
  const [user, setUser] = useState<User | null>(session?.user ?? null)

  useEffect(() => {
    let mounted = true
    ;(async () => {
      const res = await supabase.auth.getUser()
      if (mounted) setUser(res.data.user ?? null)
    })()
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event: AuthChangeEvent, s: Session | null) => {
      if (mounted) setUser(s?.user ?? null)
    })
    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [supabase])

  const handleLogout: () => Promise<void> = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <header className="bg-white text-gray-900 border-b">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        <Link href="/" className="text-xl font-bold">
          미래변화주도 프로젝트
        </Link>
        <nav className="flex items-center gap-4">
          <ul className="flex gap-2">
            {nav.map((item) => {
              const active = pathname?.startsWith(item.href)
              const cls = active
                ? 'px-3 py-1 rounded-md bg-blue-50 text-blue-700 font-semibold'
                : 'px-3 py-1 rounded-md text-gray-700 hover:bg-gray-100'
              return (
                <li key={item.href}>
                  <Link href={item.href} className={cls}>{item.label}</Link>
                </li>
              )
            })}
          </ul>
          <div className="ml-2">
            {user ? (
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">{user.email}</span>
                <button
                  onClick={handleLogout}
                  className="bg-rose-500 text-white px-3 py-1 rounded hover:bg-rose-600 text-sm"
                >
                  로그아웃
                </button>
              </div>
            ) : (
              <Link href="/login" className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 text-sm">
                로그인 / 회원가입
              </Link>
            )}
          </div>
        </nav>
      </div>
    </header>
  )
}

export default Header
