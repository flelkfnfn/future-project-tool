'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useSupabase } from '@/components/supabase-provider'
import type { Database } from '@/lib/supabase/database.types'

type ChatMsg = {
  id: string
  text: string
  user: string
  ts: number
}

export default function ChatSidebar({ open = true, onToggle }: { open?: boolean; onToggle?: () => void }) {
  const { supabase, session } = useSupabase()
  const [messages, setMessages] = useState<ChatMsg[]>([])
  const [input, setInput] = useState('')
  const chanRef = useRef<ReturnType<typeof supabase.channel> | null>(null)
  const listRef = useRef<HTMLDivElement | null>(null)

  const username = useMemo(() => {
    if (session?.user?.email) return session.user.email
    if (typeof document !== 'undefined' && document.cookie.includes('local_session_present=1')) {
      // Derive a simple local username
      return 'local-user'
    }
    return 'guest'
  }, [session])

  useEffect(() => {
    // Load persisted messages from DB (best effort), fallback to localStorage
    (async () => {
      try {
        const { data, error } = await supabase
          .from('chat_messages')
          .select('id, text, user, ts')
          .order('ts', { ascending: true })
          .limit(200)
        if (!error && data) {
          setMessages(data as ChatMsg[])
          try { localStorage.setItem('global_chat_cache', JSON.stringify(data)) } catch {}
        } else {
          const raw = localStorage.getItem('global_chat_cache')
          if (raw) setMessages(JSON.parse(raw))
        }
      } catch {
        try {
          const raw = localStorage.getItem('global_chat_cache')
          if (raw) setMessages(JSON.parse(raw))
        } catch {}
      }
    })()
    const chan = supabase.channel('global-chat', { config: { broadcast: { self: true } } })
    chan.on('broadcast', { event: 'message' }, (payload) => {
      const msg = payload.payload as ChatMsg
      setMessages((prev) => {
        const next = [...prev, msg].slice(-200)
        try { localStorage.setItem('global_chat_cache', JSON.stringify(next)) } catch {}
        return next
      })
      // Auto scroll
      listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' })
    })
    chan.subscribe()
    chanRef.current = chan
    return () => { chan.unsubscribe(); chanRef.current = null }
  }, [supabase])

  const send = async () => {
    const text = input.trim()
    if (!text) return
    const msg: ChatMsg = { id: crypto.randomUUID(), text, user: username, ts: Date.now() }
    chanRef.current?.send({ type: 'broadcast', event: 'message', payload: msg })
    // Persist to DB (best-effort)
    try {
      const row: Database['public']['Tables']['chat_messages']['Insert'] = { id: msg.id, text: msg.text, user: msg.user, ts: msg.ts }
      await (supabase as any).from('chat_messages').insert(row)
    } catch {}
    setInput('')
  }

  const onKeyDown: React.KeyboardEventHandler<HTMLInputElement> = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      send()
    }
  }

  return (
    <aside className="h-full">
      <div className={`relative sticky top-16 h-[calc(100vh-6rem)] flex flex-col border rounded-md bg-white transition-transform duration-300 ${open ? 'translate-x-0' : 'translate-x-full'}`} aria-hidden={!open}>
        <div className="px-3 py-2 border-b font-semibold">채팅</div>
        <div ref={listRef} className="flex-1 overflow-auto p-2 space-y-2 text-sm">
          {messages.map((m) => (
            <div key={m.id} className="rounded bg-gray-50 p-2">
              <div className="text-gray-600 text-xs">{m.user} · {new Date(m.ts).toLocaleTimeString()}</div>
              <div className="text-gray-900 whitespace-pre-wrap break-words">{m.text}</div>
            </div>
          ))}
        </div>
        <div className="p-2 border-t flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="메시지 입력 (Enter로 전송)"
            className="border rounded px-2 py-1 text-sm flex-1"
          />
        </div>
        <button
          type="button"
          onClick={onToggle}
          className="absolute -left-12 bottom-3 rounded-full bg-blue-600 text-white px-3 py-1 text-xs shadow hover:bg-blue-700"
        >
          {open ? '닫기' : '열기'}
        </button>
      </div>
    </aside>
  )
}
