'use client'

import { useEffect, useMemo, useState } from 'react'
import ChatSidebar from '@/components/ChatSidebar'
import AddLauncher from '@/components/AddLauncher'
import AddModal from '@/components/AddModal'

export default function AppShell({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])

  const [chatOpen, setChatOpen] = useState<boolean>(true)
  const [addOpen, setAddOpen] = useState<boolean>(false)
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
    // 紐⑤뱺 ?뱀뀡 ?숈씪 鍮꾩쑉 ?ъ슜: 1:4:1 (?щ갚:蹂몃Ц:梨꾪똿)
    return 'grid grid-cols-6 gap-4 w-full'
  }, [])

  if (!mounted) {
    return <main className="w-full p-4 overflow-x-hidden"></main>
  }

  return (
    <main className="w-full p-4 overflow-x-hidden">
      <div className={gridCls}>
        <div className="col-span-1 hidden lg:block" />
        <div className={'col-span-4 min-w-0'}>
          {children}
        </div>
        <div className="col-span-1 hidden lg:block" />
      </div>
      {/* Fixed chat overlay aligned to right side */}
      {chatOpen && !addOpen && (
        <div className="fixed right-4 top-16 bottom-4 hidden lg:block z-30">
          <div className="h-full w-80">
            <ChatSidebar open={chatOpen} onToggle={() => setChatOpen((v) => !v)} />
          </div>
        </div>
      )}
      {!chatOpen && !addOpen && (
        <button
          type="button"
          onClick={() => setChatOpen(true)}
          className="fixed right-4 bottom-4 z-40 w-12 h-12 rounded-full bg-blue-600 text-white shadow hover:bg-blue-700 hidden lg:flex items-center justify-center"
          aria-label="채팅 열기"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-6 h-6">
            <path d="M18 10c0 3.866-3.582 7-8 7-1.102 0-2.147-.187-3.095-.525-.226-.081-.477-.07-.692.037L3.3 17.4a.75.75 0 01-1.05-.836l.616-2.463a.75.75 0 00-.18-.705A6.97 6.97 0 012 10c0-3.866 3.582-7 8-7s8 3.134 8 7z" />
          </svg>
        </button>
      )}
      {!chatOpen && !addOpen && (
        <div className="fixed right-4 bottom-20 z-40 hidden lg:flex">
          <AddLauncher onOpen={() => setAddOpen(true)} />
        </div>
      )}
      {addOpen && (
        <AddModal onClose={() => setAddOpen(false)} />
      )}
    </main>
  )
}

