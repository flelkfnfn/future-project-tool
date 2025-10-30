'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useSupabase } from '@/components/supabase-provider'
import type { User, Session, AuthChangeEvent } from '@supabase/supabase-js'
import { localSignOut } from '@/app/login/localActions'
import Dock from '@/components/Dock'
import { LuWorkflow, LuFolderKanban, LuMegaphone, LuLightbulb, LuCalendarDays, LuFolderOpen } from 'react-icons/lu'

const nav = [
  { href: '/projects', label: '프로젝트' },
  { href: '/notices', label: '공지사항' },
  { href: '/ideas', label: '아이디어' },
  { href: '/calendar', label: '캘린더' },
  { href: '/files', label: '파일 공유' },
]

const Header = () => {
  const router = useRouter()
  const pathname = usePathname()
  const { supabase, session } = useSupabase()
  const [user, setUser] = useState<User | null>(session?.user ?? null)
  const [localAuthed, setLocalAuthed] = useState(false)
  const [accountLabel, setAccountLabel] = useState<string | null>(session?.user?.email ?? null)

  useEffect(() => {
    let mounted = true
    ;(async () => {
      const res = await supabase.auth.getUser()
      if (mounted) setUser(res.data.user ?? null)
      if (mounted) {
        if (res.data.user?.email) {
          setAccountLabel(res.data.user.email)
        } else if (typeof document !== 'undefined' && document.cookie.includes('local_session_present=1')) {
          fetch('/api/me', { cache: 'no-store' })
            .then(r => r.json())
            .then(j => {
              const p = j?.principal
              const label = (p && (p.username || p.email)) || null
              setAccountLabel(label)
            })
            .catch(() => {})
        }
      }
    })()
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event: AuthChangeEvent, s: Session | null) => {
      if (mounted) setUser(s?.user ?? null)
    })
    setLocalAuthed(typeof document !== 'undefined' && document.cookie.includes('local_session_present=1'))
    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [supabase])

  useEffect(() => {
    const hasLocal = typeof document !== 'undefined' && document.cookie.includes('local_session_present=1')
    setLocalAuthed(hasLocal)
    if (!user?.email && hasLocal) {
      fetch('/api/me', { cache: 'no-store' })
        .then(r => r.json())
        .then(j => {
          const p = j?.principal
          const label = (p && (p.username || p.email)) || null
          setAccountLabel(label)
        })
        .catch(() => {})
    } else if (user?.email) {
      setAccountLabel(user.email)
    }
  }, [pathname])

  useEffect(() => {
    const onFocus = () => {
      const hasLocal = typeof document !== 'undefined' && document.cookie.includes('local_session_present=1')
      setLocalAuthed(hasLocal)
      if (!user?.email && hasLocal) {
        fetch('/api/me', { cache: 'no-store' })
          .then(r => r.json())
          .then(j => {
            const p = j?.principal
            const label = (p && (p.username || p.email)) || null
            setAccountLabel(label)
          })
          .catch(() => {})
      } else if (user?.email) {
        setAccountLabel(user.email)
      }
    }
    if (typeof window !== 'undefined') {
      window.addEventListener('focus', onFocus)
    }
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('focus', onFocus)
      }
    }
  }, [])

  const handleLogout: () => Promise<void> = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const authed = !!user || localAuthed

  return (
    <header className="sticky top-0 z-50 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-b dark:border-gray-700">
      <div className="container mx-auto px-4 relative h-18.5">
        {/* Vertically-centered title and actions */}
        <div className="h-full flex items-center justify-between">
          <Link href="/" className="text-xl font-bold">미래·사회변화주도 프로젝트</Link>
          <div>
            {authed ? (
              <div className="flex items-center gap-2">
                {accountLabel && (
                  <Link href="/profile" className="px-2 py-1 text-sm rounded border dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">{accountLabel}</Link>
                )}
                <form action={localSignOut}>
                  <button
                    type="submit"
                    onClick={handleLogout}
                    className="bg-rose-500 text-white px-3 py-1 rounded hover:bg-rose-600 text-sm"
                  >
                    로그아웃
                  </button>
                </form>
              </div>
            ) : (
              <Link href="/login" className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 text-sm">로그인 / 회원가입</Link>
            )}
          </div>
        </div>

        {/* Centered dock at bottom within header (no global CSS edits) */}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2">
          <Dock
            panelHeight={58}
            dockHeight={72}
            baseItemSize={40}
            magnification={44}
            distance={160}
            items={nav.map((item) => ({
              icon: (() => {
                const map: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
                  '/projects': LuWorkflow,
                  '/notices': LuMegaphone,
                  '/ideas': LuLightbulb,
                  '/calendar': LuCalendarDays,
                  '/files': LuFolderOpen,
                }
                const Cmp = map[item.href] ?? LuWorkflow
                return <Cmp size={24} aria-hidden className={pathname?.startsWith(item.href) ? 'text-blue-300' : 'text-white'} />
              })(),
              label: item.label,
              onClick: () => router.push(item.href),
              className: pathname?.startsWith(item.href) ? 'ring-2 ring-blue-400' : ''
            }))}
          />
        </div>
      </div>
    </header>
  )
}

export default Header

