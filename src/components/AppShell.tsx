"use client";

import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import AddLauncher from "@/components/AddLauncher";
import ActiveUsersDisplay from "./ActiveUsersDisplay";
import DataChangeNotifier from "./DataChangeNotifier";
import Link from "next/link";
import { LuSettings } from "react-icons/lu";

// Lazy-load heavier client components to reduce initial JS/hydration
const ChatSidebar = dynamic(() => import("@/components/ChatSidebar"), {
  ssr: false,
});
const AddModal = dynamic(() => import("@/components/AddModal"), { ssr: false });
const CreateChatRoomModal = dynamic(
  () => import("@/components/CreateChatRoomModal"),
  { ssr: false }
);
const ManageChatRoomModal = dynamic(
  () => import("@/components/ManageChatRoomModal"),
  { ssr: false }
);
const AddMembersModal = dynamic(() => import("@/components/AddMembersModal"), {
  ssr: false,
});
export default function AppShell({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);
  const [chatOpen, setChatOpen] = useState<boolean>(true);
  const [addOpen, setAddOpen] = useState<boolean>(false);
  const [createRoomOpen, setCreateRoomOpen] = useState<boolean>(false);
  const [manageRoom, setManageRoom] = useState<{
    id: number;
    name: string;
  } | null>(null);
  const [addMembersRoom, setAddMembersRoom] = useState<{
    id: number;
    name: string;
  } | null>(null);

  useEffect(() => {
    try {
      const v = localStorage.getItem("chat_open");
      if (v != null) setChatOpen(v === "1");
    } catch {}
  }, []);
  useEffect(() => {
    try {
      localStorage.setItem("chat_open", chatOpen ? "1" : "0");
    } catch {}
  }, [chatOpen]);

  const gridCls = useMemo(() => {
    return "grid grid-cols-6 gap-4 w-full";
  }, []);
  if (!mounted) {
    return <main className="w-full p-4 overflow-x-hidden"></main>;
  }
  const openAddMembersModal = () => {
    if (manageRoom) {
      setAddMembersRoom(manageRoom);
      setManageRoom(null);
    }
  };
  return (
    <main className="w-full p-4 overflow-x-hidden">
      <div className={gridCls}>
        <div className="col-span-1 hidden lg:block" />
        <div className={"col-span-4 min-w-0"}>{children}</div>
        <div className="col-span-1 hidden lg:block" />
      </div>

      {/* Chat Sidebar Container */}
      <div
        className={`fixed top-20 bottom-4 w-80 z-51 transition-[right] duration-300 ease-in-out hidden lg:block`}
        style={{ right: chatOpen ? '1rem' : '-20rem' }} // 1rem for right-4, -20rem for w-80
      >
        <ChatSidebar
          onCreateRoom={() => setCreateRoomOpen(true)}
          onManageRoom={setManageRoom}
        />
      </div>

      {/* Floating Right Buttons (Chat Toggle, Add) Container */}
      <div
        className={`fixed bottom-4 z-52 flex flex-col-reverse items-center gap-2 transition-[right] duration-300 ease-in-out`}
        style={{ right: chatOpen ? '22rem' : '1rem' }} // 1rem for right-4, 20rem for w-80, 1rem for gap
      >
        <button
          type="button"
          onClick={() => setChatOpen(v => !v)}
          className="w-12 h-12 rounded-full bg-blue-600 text-white shadow hover:bg-blue-700 flex items-center justify-center"
          aria-label={chatOpen ? "채팅 닫기" : "채팅 열기"}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            className="w-6 h-6"
          >
            <path
              d="M18 10c0 3.866-3.582 7-8 7-1.102 0-2.147-.187-3.095-.525-.226-.081-.477-.07-.692.037L3.3 17.4a.75.75 0
01-1.05-.836l.616-2.463a.75.75 0 00-.18-.705A6.97 6.97 0 012 10c0-3.866 3.582-7 8-7s8 3.134 8 7z"
            />
          </svg>
        </button>
        <AddLauncher onOpen={() => setAddOpen(true)} />
      </div>

      {/* Floating Settings Button */}
      <div className="fixed left-4 bottom-4 z-40 flex flex-col items-center gap-2 pointer-events-auto">
        <Link href="/settings" aria-label="설정" className="w-12 h-12 rounded-full bg-gray-600 text-white shadow hover:bg-gray-700 flex items-center justify-center">
          <LuSettings className="w-6 h-6" />
        </Link>
      </div>

      {/* Modals */}
      {addOpen && <AddModal onClose={() => setAddOpen(false)} />}
      {createRoomOpen && (
        <CreateChatRoomModal onClose={() => setCreateRoomOpen(false)} />
      )}
      {manageRoom && (
        <ManageChatRoomModal
          roomId={manageRoom.id}
          roomName={manageRoom.name}
          onClose={() => setManageRoom(null)}
          onAddMembers={openAddMembersModal}
        />
      )}
      {addMembersRoom && (
        <AddMembersModal
          roomId={addMembersRoom.id}
          roomName={addMembersRoom.name}
          onClose={() => setAddMembersRoom(null)}
        />
      )}
      {/* Active Users List: top-left */}
      <div className="fixed left-4 top-24 z-50 flex flex-col gap-4">
        <ActiveUsersDisplay />
      </div>
      <DataChangeNotifier />
    </main>
  );
}
