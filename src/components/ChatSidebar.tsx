'use client';

import { useEffect, useMemo, useRef, useState } from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { useSupabase } from "@/components/supabase-provider";
import AddLauncher from "@/components/AddLauncher";

const makeId = (text: string, user: string, ts: number) => `${ts}:${user}:${text}`;

type ChatMsg = {
  id: string;
  text: string;
  user: string;
  ts: number;
  room_id?: number | null;
};

type ChatRoom = {
  id: number;
  name: string;
}

export default function ChatSidebar({
  open = true,
  onToggle,
  showToggle = true,
  onAdd,
  onCreateRoom,
  onManageRoom,
}: {
  open?: boolean;
  onToggle?: () => void;
  showToggle?: boolean;
  onAdd?: () => void;
  onCreateRoom?: () => void;
  onManageRoom?: (room: { id: number; name: string }) => void;
}) {
  const { supabase, session } = useSupabase();
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState("");
  const [pending, setPending] = useState(false);
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [selectedRoomId, setSelectedRoomId] = useState<number | null>(null);
  const chanRef = useRef<RealtimeChannel | null>(null);
  const bcastRef = useRef<RealtimeChannel | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);
  const [username, setUsername] = useState<string>("guest");

  useEffect(() => {
    if (session?.user?.email) {
      setUsername(session.user.email);
      return;
    }

    let active = true;
    fetch("/api/me", { cache: "no-store" })
      .then((r) => r.json())
      .then((j) => {
        if (active) {
          setUsername(String(j?.principal?.username || j?.principal?.email || "guest"));
        }
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [session]);

  const authed = useMemo(() => {
    if (session?.user) return true;
    if (typeof document !== "undefined" && document.cookie.includes("local_session_present=1")) {
      return true;
    }
    return false;
  }, [session]);

  // Fetch rooms
  useEffect(() => {
    if (!authed) {
      setRooms([]);
      return;
    }
    const fetchRooms = async () => {
      try {
        const res = await fetch('/api/chat/rooms');
        const data = await res.json();
        if (data.ok) {
          setRooms(data.rooms);
        }
      } catch (e) {
        console.error('Failed to fetch rooms', e);
      }
    };
    fetchRooms();
  }, [authed, supabase]);

  // Fetch messages for the selected room
  useEffect(() => {
    if (!authed) {
      setMessages([]);
      return;
    }

    (async () => {
      // Clear messages when room changes
      setMessages([]);
      try {
        const url = selectedRoomId ? `/api/chat/messages?roomId=${selectedRoomId}` : '/api/chat/messages';
        const res = await fetch(url, {
          cache: "no-store",
          credentials: "include",
        });
        const j = await res.json();
        if (j?.ok && Array.isArray(j.data)) {
          const mapped: ChatMsg[] = (j.data as Array<{ text: string; user?: string; ts: number, room_id?: number | null }>).map((r) => {
            const u = r.user ?? "user";
            const t = r.ts;
            const x = r.text;
            return { id: makeId(x, u, t), text: x, user: u, ts: t, room_id: r.room_id };
          });
          setMessages(dedupe(mapped));
        }
      } catch {}
    })();

    // Subscribe to real-time messages for the selected room
    if (chanRef.current) {
      chanRef.current.unsubscribe();
    }

    const channelName = selectedRoomId ? `room-${selectedRoomId}` : 'realtime:chat_message';
    const chan = supabase.channel(channelName);
    chan.on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "chat_messages", filter: selectedRoomId ? `room_id=eq.${selectedRoomId}` : 'room_id=is.null' },
      (payload) => {
        const r = payload.new as { id: string; text: string; username: string; ts: number; room_id: number | null };
        const incoming: ChatMsg = {
          id: makeId(r.text, r.username, r.ts), // Use r.username to match optimistic update
          text: r.text,
          user: r.username,
          ts: r.ts,
          room_id: r.room_id,
        };

        setMessages((prev) => dedupe([...prev, incoming]));
        listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
      },
    );
    chan.subscribe();
    chanRef.current = chan;

    return () => {
      chan.unsubscribe();
      chanRef.current = null;
    };
  }, [supabase, authed, selectedRoomId]);

  const send = async () => {
    if (pending) return;
    const text = input.trim();
    if (!text) return;

    setPending(true);
    try {
      const now = Date.now();
      const msg: ChatMsg = { id: makeId(text, username, now), text, user: username, ts: now, room_id: selectedRoomId };

      const fd = new FormData();
      fd.append("text", msg.text);
      fd.append("ts", String(msg.ts));
      if (selectedRoomId != null) {
        fd.append("room_id", String(selectedRoomId));
      }

      const res = await fetch("/api/chat/messages", {
        method: "POST",
        body: fd,
        credentials: "include",
      });

      const j = await res.json().catch(() => ({}));
      if (res.ok && j?.ok !== false) {
        setMessages((prev) => {
          const next = dedupe([...prev, msg]);
          return next;
        });
      } else {
        bcastRef.current?.send({ type: "broadcast", event: "message", payload: msg });
        setMessages((prev) => {
          const next = dedupe([...prev, msg]);
          return next;
        });
      }
    } catch {
      const now = Date.now();
      const msg: ChatMsg = { id: makeId(text, username, now), text, user: username, ts: now, room_id: selectedRoomId };
      bcastRef.current?.send({ type: "broadcast", event: "message", payload: msg });
      setMessages((prev) => {
        const next = dedupe([...prev, msg]);
        return next;
      });
    } finally {
      setInput("");
      setPending(false);
    }
  };

  const onKeyDown: React.KeyboardEventHandler<HTMLInputElement> = (e) => {
    if (pending) return;
    if (e.key === "Enter") {
      e.preventDefault();
      send();
    }
  };

  // ✅ 인라인 트랜지션 + transform: 퍼지/클래스 이슈 없이 항상 슬라이드
  const panelStyle: React.CSSProperties = {
    transform: open ? "translateX(0%) translateY(0px)" : "translateX(100%) translateY(10px)",
    transition:
      "transform 420ms cubic-bezier(0.2, 0, 0, 1), box-shadow 420ms cubic-bezier(0.2, 0, 0, 1)",
    willChange: "transform",
  };

  // 살짝 어두워지는 오버레이(옵션)
  const overlayStyle: React.CSSProperties = {
    opacity: open ? 1 : 0,
    transition: "opacity 420ms cubic-bezier(0.2, 0, 0, 1)",
    background: "linear-gradient(to left, rgba(0,0,0,0.06), rgba(0,0,0,0))",
    pointerEvents: "none",
  };

  const selectedRoom = useMemo(() => selectedRoomId ? rooms.find(r => r.id === selectedRoomId) : null, [rooms, selectedRoomId]);

  return (
    <aside className="h-full">
      <div className="sticky top-16 h-[calc(100vh-6rem)] relative overflow-visible">
        <div className="absolute inset-0" style={overlayStyle} aria-hidden />
        <div
          className="absolute inset-0 flex flex-col border dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 min-w-0"
          style={panelStyle}
          aria-hidden={!open}
        >
          <div className="p-2 border-b dark:border-gray-700 flex items-center gap-2 overflow-x-auto">
            <button
              onClick={() => setSelectedRoomId(null)}
              className={`h-10 w-10 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold ${selectedRoomId === null ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200'}`}
            >
              일반
            </button>
            {rooms.map(room => (
              <button
                key={room.id}
                onClick={() => setSelectedRoomId(room.id)}
                className={`h-10 w-10 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold truncate p-1 ${selectedRoomId === room.id ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200'}`}
                title={room.name}
              >
                {room.name}
              </button>
            ))}
            <button
              onClick={onCreateRoom}
              className="h-10 w-10 rounded-full flex-shrink-0 flex items-center justify-center bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            </button>
          </div>

          <div className="px-3 py-2 border-b dark:border-gray-700 font-semibold flex items-center justify-between text-gray-900 dark:text-gray-100">
            <span>{selectedRoom?.name ?? '일반 채팅'}</span>
            {selectedRoom && onManageRoom && (
              <button onClick={() => onManageRoom(selectedRoom)} className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                </svg>
              </button>
            )}
          </div>

          {authed ? (
            <>
              <div ref={listRef} className="flex-1 overflow-auto p-2 space-y-2 text-sm min-w-0">
                {messages.map((m) => (
                  <div
                    key={m.id}
                    className={`rounded p-2 ${
                      m.user === "admin"
                        ? "bg-amber-200 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-700"
                        : "bg-gray-100 dark:bg-gray-700"
                    }`}
                  >
                    <div className="text-gray-600 dark:text-gray-400 text-xs">
                      {m.user} ·{" "}
                      {new Date(m.ts).toLocaleTimeString("ko-KR", {
                        month: "2-digit",
                        day: "2-digit",
                        hour: "2-digit",
                        minute: "2-digit",
                        hour12: false,
                      })}
                    </div>
                    <div
                      className={`whitespace-pre-wrap break-words ${
                        m.user === "admin" ? "text-amber-900 dark:text-amber-100" : "text-gray-900 dark:text-gray-100"
                      }`}
                    >
                      {m.text}
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-2 border-t dark:border-gray-700 flex gap-2">
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={onKeyDown}
                  placeholder="메시지 입력"
                  className="border dark:border-gray-600 rounded-md px-3 py-2 text-sm flex-1 min-w-0 w-full bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:ring-blue-500 focus:border-blue-500"
                  disabled={pending}
                />
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center p-4 text-sm text-gray-600 dark:text-gray-400">
              로그인 후 채팅을 이용하실 수 있습니다.
            </div>
          )}

          {showToggle && (
            <div className="absolute right-full bottom-16 z-20 flex flex-col items-center gap-2 pointer-events-auto mr-2">
              <AddLauncher onOpen={onAdd ?? (() => {})}/>
              <button
                type="button"
                onClick={onToggle}
                className="w-12 h-12 rounded-full bg-blue-600 text-white shadow hover:bg-blue-700 flex items-center justify-center"
                aria-label={open ? "채팅 닫기" : "채팅 열기"}
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-6 h-6">
                  <path d="M18 10c0 3.866-3.582 7-8 7-1.102 0-2.147-.187-3.095-.525-.226-.081-.477-.07-.692.037L3.3 17.4a.75.75 0 01-1.05-.836l.616-2.463a.75.75 0 00-.18-.705A6.97 6.97 0 012 10c0-3.866 3.582-7 8-7s8 3.134 8 7z" />
                </svg>
              </button>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}

function dedupe(list: ChatMsg[]): ChatMsg[] {
  const seen = new Set<string>();
  const out: ChatMsg[] = [];
  for (const m of list) {
    const key = makeId(m.text, m.user, m.ts);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(m);
  }
  return out.slice(-200);
}
