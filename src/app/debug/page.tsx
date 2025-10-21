'use client'

import { useEffect, useState } from 'react'
import { useSupabase } from '@/components/supabase-provider'

export default function DebugAuthPage() {
  const { supabase } = useSupabase()
  const [state, setState] = useState<any>(null)

  useEffect(() => {
    let mounted = true
    ;(async () => {
      const s = await supabase.auth.getSession()
      if (mounted) setState(s.data)
    })()
    const sub = supabase.auth.onAuthStateChange((_e, s) => {
      setState({ session: s })
    })
    return () => {
      mounted = false
      sub.data.subscription.unsubscribe()
    }
  }, [supabase])

  return (
    <pre className="p-4 text-sm bg-gray-100 rounded overflow-x-auto">
      {JSON.stringify(state, null, 2)}
    </pre>
  )
}

