'use client'

import { useEffect, useState } from 'react'
import { useSupabase } from '@/components/supabase-provider'

type Props = React.FormHTMLAttributes<HTMLFormElement> & {
  confirmMessage?: string
}

export default function AuthGuardForm({ children, onSubmit, confirmMessage, ...rest }: Props) {
  const { supabase } = useSupabase()
  const [authed, setAuthed] = useState<boolean>(false)

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
    onSubmit?.(e)
  }

  return (
    <form {...rest} onSubmit={handleSubmit}>
      {children}
    </form>
  )
}
