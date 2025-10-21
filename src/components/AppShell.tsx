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
    // 1:4:1 (left spacer : body : right chat column)
    return 'grid grid-cols-6 gap-4 w-full'
  }, [])

  return (
    <main className="w-full p-4 overflow-x-hidden">
      <div className={gridCls}>
        <div className="col-span-1 hidden lg:block" />
        <div className={'col-span-4 min-w-0'}>
          {children}
        </div>
        <div className="col-span-1 hidden lg:block">
          <ChatSidebar open={chatOpen} onToggle={() => setChatOpen((v) => !v)} />
        </div>
      </div>
    </main>
  )
}
