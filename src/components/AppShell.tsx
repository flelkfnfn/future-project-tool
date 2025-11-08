"use client";

import { useEffect, useMemo, useState } from "react";
import { ensurePushEnabled, disablePush } from "@/lib/notifications/client";
import { toast } from "sonner";
import { LuBell, LuBellOff } from "react-icons/lu";
import dynamic from "next/dynamic";
import AddLauncher from "@/components/AddLauncher";
import ActiveUsersDisplay from "./ActiveUsersDisplay";

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
  // Keep panel container mounted during close animation
  const [panelVisible, setPanelVisible] = useState<boolean>(true);
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
  const [pushStatus, setPushStatus] = useState<
    "unknown" | "enabled" | "disabled" | "denied" | "unsupported"
  >("unknown");
  const [enablingPush, setEnablingPush] = useState<boolean>(false);
  const [disablingPush, setDisablingPush] = useState<boolean>(false);
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
  // Orchestrate slide-out before collapsing width to 0
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null;
    if (chatOpen) {
      setPanelVisible(true);
    } else {
      timer = setTimeout(() => setPanelVisible(false), 450);
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [chatOpen]);
  // Evaluate current push availability/subscription
  useEffect(() => {
    const evalStatus = async () => {
      try {
        if (
          typeof window === "undefined" ||
          !("serviceWorker" in navigator) ||
          typeof Notification === "undefined"
        ) {
          setPushStatus("unsupported");
          return;
        }
        const perm = Notification.permission;
        const reg = await navigator.serviceWorker.getRegistration();
        const sub = reg ? await reg.pushManager.getSubscription() : null;
        if (perm === "denied") {
          setPushStatus("denied");
        } else if (perm === "granted" && sub) {
          setPushStatus("enabled");
        } else {
          setPushStatus("disabled");
        }
      } catch {
        setPushStatus("unsupported");
      }
    };
    evalStatus();
  }, []);
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
      {/* Chat Sidebar */}
      <div
        className={`fixed right-4 top-16 bottom-4 hidden lg:block z-51 ${
          panelVisible ? "w-80" : "w-0"
        } ${
          chatOpen && !addOpen ? "pointer-events-auto" : "pointer-events-none"
        }`}
      >
        <div
          className={
            panelVisible
              ? "h-full w-80 overflow-visible"
              : "h-full w-0 overflow-x-hidden overflow-y-visible"
          }
        >
          <ChatSidebar
            open={chatOpen && !addOpen}
            onToggle={() => setChatOpen((v) => !v)}
            showToggle={panelVisible && !addOpen}
            onAdd={() => setAddOpen(true)}
            onCreateRoom={() => setCreateRoomOpen(true)}
            onManageRoom={setManageRoom}
          />
        </div>
      </div>
      {/* Floating Action Buttons */}
      {!panelVisible && !addOpen && (
        <div className="fixed right-4 bottom-16 z-40 flex flex-col items-center gap-2 pointer-events-auto">
          <AddLauncher onOpen={() => setAddOpen(true)} />
          <button
            type="button"
            onClick={() => setChatOpen(true)}
            className="w-12 h-12 rounded-full bg-blue-600 text-white shadow hover:bg-blue-700 flex items-center justify-center"
            aria-label="채팅 열기"
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
        </div>
      )}
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
      {/* Push toggle & Active Users List: top-left */}
      <div className="fixed left-4 top-24 z-50 flex flex-col gap-4">
        <button
          type="button"
          aria-label={pushStatus === "enabled" ? "알림 끄기" : "알림 켜기"}
          onClick={async () => {
            if (pushStatus === "unsupported") {
              toast.error("이 브라우저에서는 알림을 지원하지 않습니다.");
              return;
            }
            if (pushStatus === "enabled") {
              try {
                setDisablingPush(true);
                const ok = await disablePush();
                if (ok) {
                  setPushStatus("disabled");
                  toast.success("알림을 껐습니다");
                } else {
                  toast.error("알림을 끌 수 없습니다");
                }
              } finally {
                setDisablingPush(false);
              }
              return;
            }
            // disabled/unknown/denied -> try enable
            if (pushStatus === "denied") {
              toast.error(
                "브라우저 알림이 차단되어 있습니다. 사이트 권한에서 허용해주세요."
              );
              return;
            }
            try {
              setEnablingPush(true);
              const ok = await ensurePushEnabled();
              if (ok) {
                setPushStatus("enabled");
                toast.success("알림을 켰습니다");
              } else {
                const perm =
                  typeof Notification !== "undefined"
                    ? Notification.permission
                    : "default";
                setPushStatus(perm === "denied" ? "denied" : "disabled");
                toast.error("알림을 켤 수 없습니다");
              }
            } finally {
              setEnablingPush(false);
            }
          }}
          className={`w-10 h-10 rounded-full flex items-center justify-center shadow-md border border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-gray-800/80 backdrop-blur transition-colors ${
            pushStatus === "enabled"
              ? "hover:bg-emerald-50 dark:hover:bg-emerald-900/20"
              : "hover:bg-gray-50 dark:hover:bg-gray-700/60"
          }`}
          disabled={enablingPush || disablingPush}
        >
          {pushStatus === "enabled" ? (
            <LuBell className="w-5 h-5 text-emerald-600" />
          ) : (
            <LuBellOff className="w-5 h-5 text-gray-500 dark:text-gray-300" />
          )}
        </button>
        <ActiveUsersDisplay />
      </div>
    </main>
  );
}
