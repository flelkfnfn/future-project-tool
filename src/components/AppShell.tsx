'use client'

import { useEffect, useMemo, useState } from 'react'
import { usePathname } from 'next/navigation'
import ChatSidebar from '@/components/ChatSidebar'

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isCalendar = pathname?.startsWith('/calendar')

  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])

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
    // 1:4:1 (left spacer : body : right chat column)
    return 'grid grid-cols-6 gap-4 w-full'
  }, [isCalendar])

  if (!mounted) {
    return <main className="w-full p-4 overflow-x-hidden"></main>
  }

  return (
    <main className="w-full p-4 overflow-x-hidden">
      <div className={gridCls}>
        {isCalendar ? (
          <div className="min-w-0">{children}</div>
        ) : (
          <>
            <div className="col-span-1 hidden lg:block" />
            <div className={'col-span-4 min-w-0'}>
              {children}
            </div>
            <div className="col-span-1 hidden lg:block">
              <ChatSidebar open={chatOpen} onToggle={() => setChatOpen((v) => !v)} />
            </div>
          </>
        )}
      </div>
      {isCalendar && (
        <div className="fixed right-4 bottom-4 top-16 w-80 hidden lg:block z-30">
          <div className="h-full">
            <ChatSidebar open={chatOpen} onToggle={() => setChatOpen((v) => !v)} />
          </div>
        </div>
      )}
    </main>
  )
}
