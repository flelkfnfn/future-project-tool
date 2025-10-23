'use client'

import { useEffect, useState } from 'react'
import { useSupabase } from '@/components/supabase-provider'

export default function SupabaseOnly({ children, fallback }: { children: React.ReactNode; fallback?: React.ReactNode }) {
  const { supabase } = useSupabase()
  const [supaAuthed, setSupaAuthed] = useState<boolean>(false)

  useEffect(() => {
    let mounted = true
    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return
      setSupaAuthed(!!data.session)
    })
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      setSupaAuthed(!!s)
    })
    return () => {
      sub.subscription.unsubscribe()
      mounted = false
    }
  }, [supabase])

  if (!supaAuthed) return <>{fallback ?? null}</>
  return <>{children}</>
}

