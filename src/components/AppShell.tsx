'use client'

import { useEffect, useMemo, useState } from 'react'
import { usePathname } from 'next/navigation'
import ChatSidebar from '@/components/ChatSidebar'

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isCalendar = pathname?.startsWith('/calendar')

  const [chatOpen, setChatOpen] = useState<boolean>(true)
  useEffect(() => {
    try {
      const v = localStorage.getItem('chat_open')
      if (v != null) setChatOpen(v === '1')
    } catch {}
  }, [])
  useEffect(() => {
    try { localStorage.setItem('chat_open', chatOpen ? '1' : '0') } catch {}
  }, [chatOpen])

  const gridCls = useMemo(() => {
    if (isCalendar) return 'grid grid-cols-1 w-full'
    // 1:6:1 (left spacer : body : right chat)
    return 'grid grid-cols-8 gap-4 w-full'
  }, [isCalendar])

  return (
    <main className="w-full p-4">
      <div className={gridCls}>
        {isCalendar ? null : <div className="col-span-1 hidden lg:block" />}
        <div className={isCalendar ? 'col-span-1' : 'col-span-6 min-w-0'}>
          {children}
        </div>
        {isCalendar ? null : (
          <div className="col-span-1 hidden lg:block">
            <ChatSidebar open={chatOpen} onToggle={() => setChatOpen((v) => !v)} />
          </div>
        )}
      </div>
      {!isCalendar && (
        <button
          type="button"
          onClick={() => setChatOpen((v) => !v)}
          className="fixed bottom-4 right-4 z-50 rounded-full bg-blue-600 text-white px-4 py-2 shadow-lg hover:bg-blue-700 transition"
          aria-label={chatOpen ? '채팅 닫기' : '채팅 열기'}
        >
          {chatOpen ? '채팅 닫기' : '채팅 열기'}
        </button>
      )}
    </main>
  )
}
