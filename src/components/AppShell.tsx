'use client'

import { useEffect, useMemo, useState } from 'react'
import ChatSidebar from '@/components/ChatSidebar'
import AddLauncher from '@/components/AddLauncher'
import AddModal from '@/components/AddModal'
import CreateChatRoomModal from '@/components/CreateChatRoomModal'
import ManageChatRoomModal from '@/components/ManageChatRoomModal'
import AddMembersModal from '@/components/AddMembersModal'

export default function AppShell({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])

  const [chatOpen, setChatOpen] = useState<boolean>(true)
  // Keep panel container mounted during close animation
  const [panelVisible, setPanelVisible] = useState<boolean>(true)
  const [addOpen, setAddOpen] = useState<boolean>(false)
  const [createRoomOpen, setCreateRoomOpen] = useState<boolean>(false)
  const [manageRoom, setManageRoom] = useState<{ id: number; name: string } | null>(null)
  const [addMembersRoom, setAddMembersRoom] = useState<{ id: number; name: string } | null>(null)

  useEffect(() => {
    try {
      const v = localStorage.getItem('chat_open')
      if (v != null) setChatOpen(v === '1')
    } catch {}
  }, [])
  useEffect(() => {
    try { localStorage.setItem('chat_open', chatOpen ? '1' : '0') } catch {}
  }, [chatOpen])

  // Orchestrate slide-out before collapsing width to 0
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null
    if (chatOpen) {
      setPanelVisible(true)
    } else {
      timer = setTimeout(() => setPanelVisible(false), 450)
    }
    return () => { if (timer) clearTimeout(timer) }
  }, [chatOpen])

  const gridCls = useMemo(() => {
    return 'grid grid-cols-6 gap-4 w-full'
  }, [])

  if (!mounted) {
    return <main className="w-full p-4 overflow-x-hidden"></main>
  }

  const openAddMembersModal = () => {
    if (manageRoom) {
      setAddMembersRoom(manageRoom)
      setManageRoom(null)
    }
  }

  return (
    <main className="w-full p-4 overflow-x-hidden">
      <div className={gridCls}>
        <div className="col-span-1 hidden lg:block" />
        <div className={"col-span-4 min-w-0"}>{children}</div>
        <div className="col-span-1 hidden lg:block" />
      </div>

      {/* 1) �׻� ����Ʈ: ChatSidebar�� ���?�����ϰ�, open prop�� �ٲ� */}
      <div className={`fixed right-4 top-16 bottom-4 hidden lg:block z-30 ${panelVisible ? 'w-80' : 'w-0'} ${(chatOpen && !addOpen) ? 'pointer-events-auto' : 'pointer-events-none'}`}>
        <div className={
            panelVisible ? "h-full w-80 overflow-visible"
                         : "h-full w-0 overflow-x-hidden overflow-y-visible"}>
          <ChatSidebar
            open={chatOpen && !addOpen}             // �� addOpen�� �� ���� ���·� �����̵� �ƿ�
            onToggle={() => setChatOpen((v) => !v)} // �� �� �����?transform ��ȯ�� ����
            showToggle={panelVisible && !addOpen}
            onAdd={() => setAddOpen(true)}
            onCreateRoom={() => setCreateRoomOpen(true)}
            onManageRoom={setManageRoom}
          />
        </div>
      </div>

      {/* 2) ���� ������ ���� ǥ�õǴ� �÷��� ��ư�� ���� */}
      {!panelVisible && !addOpen && (
        <div className="fixed right-4 bottom-16 z-40 flex flex-col items-center gap-2 pointer-events-auto">
          <AddLauncher onOpen={() => setAddOpen(true)} />
          <button
            type="button"
            onClick={() => setChatOpen(true)}
            className="w-12 h-12 rounded-full bg-blue-600 text-white shadow hover:bg-blue-700 flex items-center justify-center"
            aria-label="채팅 열기"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-6 h-6">
              <path d="M18 10c0 3.866-3.582 7-8 7-1.102 0-2.147-.187-3.095-.525-.226-.081-.477-.07-.692.037L3.3 17.4a.75.75 0 01-1.05-.836l.616-2.463a.75.75 0 00-.18-.705A6.97 6.97 0 012 10c0-3.866 3.582-7 8-7s8 3.134 8 7z" />
            </svg>
          </button>
        </div>
      )}

      {addOpen && <AddModal onClose={() => setAddOpen(false)} />}
      {createRoomOpen && <CreateChatRoomModal onClose={() => setCreateRoomOpen(false)} />}
      {manageRoom && <ManageChatRoomModal roomId={manageRoom.id} roomName={manageRoom.name} onClose={() => setManageRoom(null)} onAddMembers={openAddMembersModal} />}
      {addMembersRoom && <AddMembersModal roomId={addMembersRoom.id} roomName={addMembersRoom.name} onClose={() => setAddMembersRoom(null)} />}
    </main>
  );

}
