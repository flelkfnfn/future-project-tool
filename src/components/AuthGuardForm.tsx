'use client'

import { useEffect, useState } from 'react'
import { useSupabase } from '@/components/supabase-provider'

type Props = React.FormHTMLAttributes<HTMLFormElement> & {
  confirmMessage?: string
}

export default function AuthGuardForm({ children, onSubmit, confirmMessage, ...rest }: Props) {
  const { supabase } = useSupabase()
  const [authed, setAuthed] = useState<boolean>(false)
  const [pending, setPending] = useState<boolean>(false)

  useEffect(() => {
    let mounted = true
    const hasLocal = () => typeof document !== 'undefined' && document.cookie.includes('local_session_present=1')
    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return
      setAuthed(!!data.session || hasLocal())
    })
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      setAuthed(!!s || hasLocal())
    })
    return () => {
      sub.subscription.unsubscribe()
      mounted = false
    }
  }, [supabase])

  const handleSubmit: React.FormEventHandler<HTMLFormElement> = (e) => {
    if (confirmMessage) {
      const ok = typeof window !== 'undefined' ? window.confirm(confirmMessage) : true
      if (!ok) {
        e.preventDefault()
        return
      }
    }
    if (!authed) {
      e.preventDefault()
      alert('로그인이 필요합니다.')
      return
    }
    setPending(true)
    // Fallback: 혹시 revalidate만으로 리렌더가 지연될 때 대비해 자동 해제
    try { setTimeout(() => setPending(false), 2500) } catch {}
    onSubmit?.(e)
  }

  const formProps = { ...rest, className: `${rest.className ?? ''} relative` }

  return (
    <form {...formProps} onSubmit={handleSubmit}>
      {children}
      {pending && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/60 transition-opacity duration-200 pointer-events-auto">
          <div className="h-6 w-6 rounded-full border-4 border-blue-500 border-t-transparent animate-spin" />
        </div>
      )}
    </form>
  )
}
