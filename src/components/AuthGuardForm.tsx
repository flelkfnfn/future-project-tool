'use client'

import { useEffect, useState } from 'react'
import { useSupabase } from '@/components/supabase-provider'

type Props = React.FormHTMLAttributes<HTMLFormElement>

export default function AuthGuardForm({ children, onSubmit, ...rest }: Props) {
  const { supabase } = useSupabase()
  const [authed, setAuthed] = useState<boolean>(false)

  useEffect(() => {
    let mounted = true
    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return
      const hasLocal = typeof document !== 'undefined' && document.cookie.includes('local_session_present=1')
      setAuthed(!!data.session || hasLocal)
    })
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      const hasLocal = typeof document !== 'undefined' && document.cookie.includes('local_session_present=1')
      setAuthed(!!s || hasLocal)
    })
    return () => {
      sub.subscription.unsubscribe()
      mounted = false
    }
  }, [supabase])

  const handleSubmit: React.FormEventHandler<HTMLFormElement> = (e) => {
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

