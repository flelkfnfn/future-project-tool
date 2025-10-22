'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useSupabase } from '@/components/supabase-provider'
import type { Database } from '@/lib/supabase/database.types'
import AddLauncher from '@/components/AddLauncher'

type ChatMsg = {
  id: string
  text: string
  user: string
  ts: number
}

export default function ChatSidebar({ open = true, onToggle, showToggle = true, onAdd }: { open?: boolean; onToggle?: () => void; showToggle?: boolean; onAdd?: () => void }) {
  const { supabase, session } = useSupabase()
  const [messages, setMessages] = useState<ChatMsg[]>([])
  const [input, setInput] = useState('')
  const chanRef = useRef<ReturnType<typeof supabase.channel> | null>(null)
  const listRef = useRef<HTMLDivElement | null>(null)
  const persist = true

  const [username, setUsername] = useState<string>('guest')
  useEffect(() => {
    // Supabase auth user uses email
    if (session?.user?.email) {
      setUsername(session.user.email)
      return
    }
    // Fetch local principal username from server
    let active = true
    fetch('/api/me', { cache: 'no-store' })
      .then((r) => r.json())
      .then((j) => {
        if (!active) return
        const name = j?.principal?.username || j?.principal?.email || 'guest'
        setUsername(String(name))
      })
      .catch(() => {})
    return () => { active = false }
  }, [session])

  const authed = useMemo(() => {
    if (session?.user) return true
    if (typeof document !== 'undefined' && document.cookie.includes('local_session_present=1')) return true
    return false
  }, [session])

  useEffect(() => {
    if (!authed) {
      setMessages([])
      return
    }
    // Load messages (DB when enabled; otherwise local cache only)
    ;(async () => {
      if (persist) {
        try {
          const { data, error } = await supabase
            .from('chat_messages')
            .select('id, text, user, ts')
            .order('ts', { ascending: true })
            .limit(200)
          if (!error && data) {
            setMessages(data as ChatMsg[])
            try { localStorage.setItem('global_chat_cache', JSON.stringify(data)) } catch {}
            return
          }
        } catch {}
      }
      try {
        const raw = localStorage.getItem('global_chat_cache')
        if (raw) setMessages(JSON.parse(raw))
      } catch {}
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
  }, [supabase, authed, persist])

  const send = async () => {
    const text = input.trim()
    if (!text) return
    const msg: ChatMsg = { id: crypto.randomUUID(), text, user: username, ts: Date.now() }
    chanRef.current?.send({ type: 'broadcast', event: 'message', payload: msg })
    // Persist to DB (optional)
    if (persist) {
      try {
        const row: Database['public']['Tables']['chat_messages']['Insert'] = { id: msg.id, text: msg.text, user: msg.user, ts: msg.ts }
        // @ts-expect-error: 커스텀 Database 타입 확장으로 테이블 매핑을 느슨하게 허용
        await supabase.from('chat_messages').insert(row)
      } catch {}
    }
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
      <div className="sticky top-16 h-[calc(100vh-6rem)] relative overflow-visible">
        <div className={`absolute inset-0 flex flex-col border rounded-md bg-white transition-transform duration-300 pointer-events-auto min-w-0 ${open ? 'translate-x-0' : 'translate-x-full'}`}>
          <div className="px-3 py-2 border-b font-semibold flex items-center justify-between">
            <span>채팅창</span>
          </div>
          {authed ? (
            <>
              <div ref={listRef} className="flex-1 overflow-auto p-2 space-y-2 text-sm min-w-0">
                {messages.map((m) => (
                  <div key={m.id} className="rounded bg-gray-50 p-2">
                    <div className="text-gray-600 text-xs">{m.user} · {new Date(m.ts).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false })}</div>
                    <div className="text-gray-900 whitespace-pre-wrap break-words">{m.text}</div>
                  </div>
                ))}
              </div>
              <div className="p-2 border-t flex gap-2">
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={onKeyDown}
                  placeholder="메시지를 입력하세요..."
                  className="border rounded px-2 py-1 text-sm flex-1 min-w-0 w-full"
                />
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center p-4 text-sm text-gray-600">
              채팅창을 열려면 로그인하세요.
            </div>
          )}
          {showToggle && (
          <button
            type="button"
            onClick={onToggle}
            className="absolute left-0 -translate-x-full bottom-3 z-20 w-12 h-12 rounded-full bg-blue-600 text-white shadow hover:bg-blue-700 flex items-center justify-center pointer-events-auto"
            aria-label={open ? '채팅 닫기' : '채팅 열기'}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-6 h-6">
              <path d="M18 10c0 3.866-3.582 7-8 7-1.102 0-2.147-.187-3.095-.525-.226-.081-.477-.07-.692.037L3.3 17.4a.75.75 0 01-1.05-.836l.616-2.463a.75.75 0 00-.18-.705A6.97 6.97 0 012 10c0-3.866 3.582-7 8-7s8 3.134 8 7z" />
            </svg>
          </button>
          )}
          {showToggle && (
            <div className="absolute left-0 -translate-x-full bottom-20 z-20 pointer-events-auto">
              <AddLauncher onOpen={onAdd ?? (() => {})} />
            </div>
          )}
        </div>
      </div>
    </aside>
  )
}








