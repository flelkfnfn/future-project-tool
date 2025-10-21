'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useSupabase } from '@/components/supabase-provider'
import type { User, Session, AuthChangeEvent } from '@supabase/supabase-js'

const Header = () => {
  const router = useRouter()
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
    <header className="bg-gray-800 text-white p-4">
      <div className="container mx-auto flex justify-between items-center">
        <Link href="/" className="text-xl font-bold">
          誘몃옒?ы쉶蹂?붿＜ ?꾨줈?앺듃
        </Link>
        <nav className="flex items-center space-x-4">
          <ul className="flex space-x-4">
            <li>
              <Link href="/projects" className="hover:text-gray-300">프로젝트</Link>
            </li>
            <li>
              <Link href="/notices" className="hover:text-gray-300">공지사항</Link>
            </li>
            <li>
              <Link href="/ideas" className="hover:text-gray-300">아이디어 모음</Link>
            </li>
            <li>
              <Link href="/calendar" className="hover:text-gray-300">캘린더</Link>
            </li>
            <li>
              <Link href="/files" className="hover:text-gray-300">파일 공유</Link>
            </li>
          </ul>
          <div className="ml-4">
            {user ? (
              <div className="flex items-center space-x-2">
                <span className="text-sm">{user.email}</span>
                <button
                  onClick={handleLogout}
                  className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 text-sm"
                >
                  濡쒓렇?꾩썐
                </button>
              </div>
            ) : (
              <Link href="/login" className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 text-sm">
                濡쒓렇??/ ?뚯썝媛??              </Link>
            )}
          </div>
        </nav>
      </div>
    </header>
  )
}

export default Header


