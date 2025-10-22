"use client";

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
};

export default function ChatSidebar({
  open = true,
  onToggle,
  showToggle = true,
  onAdd,
}: {
  open?: boolean;
  onToggle?: () => void;
  showToggle?: boolean;
  onAdd?: () => void;
}) {
  const { supabase, session } = useSupabase();
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState("");
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

  useEffect(() => {
    if (!authed) {
      setMessages([]);
      return;
    }

    (async () => {
      // local cache 우선 로드
      try {
        const raw = localStorage.getItem("global_chat_cache");
        if (raw) {
          const list = JSON.parse(raw) as ChatMsg[];
          if (Array.isArray(list)) setMessages(list);
        }
      } catch {}

      try {
        const res = await fetch("/api/chat/messages", {
          cache: "no-store",
          credentials: "include",
        });
        const j = await res.json();
        if (j?.ok && Array.isArray(j.data)) {
          const mapped: ChatMsg[] = (j.data as Array<{ text: string; user?: string; ts: number }>).map(
            (r) => {
              const u = r.user ?? "user";
              const t = r.ts;
              const x = r.text;
              return { id: makeId(x, u, t), text: x, user: u, ts: t };
            },
          );
          setMessages(dedupe(mapped));
          try {
            localStorage.setItem("global_chat_cache", JSON.stringify(mapped));
          } catch {}
        }
      } catch {}
    })();

    const chan = supabase.channel("realtime:chat_message");
    chan.on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "chat_messages" },
      (payload) => {
        const r = payload.new as { id?: number | string; text?: string; username?: string; user?: string; ts?: number };
        const text = String(r.text ?? "");
        const user = String(r.user ?? "user");
        const ts = Number(r.ts ?? Date.now());
        const incoming: ChatMsg = { id: (r.id != null ? String(r.id) : makeId(text, user, ts)), text, user, ts };

        setMessages((prev) => {
          const next = dedupe([...prev, incoming]);
          try {
            localStorage.setItem("global_chat_cache", JSON.stringify(next));
          } catch {}
          return next;
        });

        listRef.current?.scrollTo({
          top: listRef.current.scrollHeight,
          behavior: "smooth",
        });
      },
    );
    chan.subscribe();
    chanRef.current = chan;

    // DB 테이블이 없는 환경을 위한 broadcast fallback
    const bcast = supabase.channel("global-chat", { config: { broadcast: { self: false } } });
    bcast.on("broadcast", { event: "message" }, (payload) => {
      const msg = payload.payload as ChatMsg;
      setMessages((prev) => {
        const next = dedupe([...prev, msg]);
        try {
          localStorage.setItem("global_chat_cache", JSON.stringify(next));
        } catch {}
        return next;
      });
      listRef.current?.scrollTo({
        top: listRef.current.scrollHeight,
        behavior: "smooth",
      });
    });
    bcast.subscribe();
    bcastRef.current = bcast;

    return () => {
      chan.unsubscribe();
      chanRef.current = null;
      bcastRef.current?.unsubscribe();
      bcastRef.current = null;
    };
  }, [supabase, authed]);

  const send = async () => {
    const text = input.trim();
    if (!text) return;

    const now = Date.now();
    const msg: ChatMsg = { id: makeId(text, username, now), text, user: username, ts: now };

    try {
      const fd = new FormData();
      fd.append("text", msg.text);
      fd.append("ts", String(msg.ts));

      const res = await fetch("/api/chat/messages", {
        method: "POST",
        body: fd,
        credentials: "include",
      });

      const j = await res.json().catch(() => ({}));
      if (res.ok && j?.ok !== false) {
        setMessages((prev) => {
          const next = dedupe([...prev, msg]);
          try {
            localStorage.setItem("global_chat_cache", JSON.stringify(next));
          } catch {}
          return next;
        });
        setInput("");
      } else {
        // Fallback: DB가 없더라도 채팅 가능하도록 broadcast 사용
        bcastRef.current?.send({ type: "broadcast", event: "message", payload: msg });
        setMessages((prev) => {
          const next = dedupe([...prev, msg]);
          try {
            localStorage.setItem("global_chat_cache", JSON.stringify(next));
          } catch {}
          return next;
        });
        setInput("");
      }
    } catch {
      // 최후의 수단으로 로컬 broadcast
      bcastRef.current?.send({ type: "broadcast", event: "message", payload: msg });
      setMessages((prev) => {
        const next = dedupe([...prev, msg]);
        try {
          localStorage.setItem("global_chat_cache", JSON.stringify(next));
        } catch {}
        return next;
      });
      setInput("");
    }
  };

  const onKeyDown: React.KeyboardEventHandler<HTMLInputElement> = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      send();
    }
  };

  return (
    <aside className="h-full">
      <div className="sticky top-16 h-[calc(100vh-6rem)] relative overflow-visible">
        <div
          className={`absolute inset-0 flex flex-col border rounded-md bg-white transition-transform duration-300 pointer-events-auto min-w-0 ${
            open ? "translate-x-0" : "translate-x-full"
          }`}
        >
          <div className="px-3 py-2 border-b font-semibold flex items-center justify-between">
            <span>채팅</span>
          </div>

          {authed ? (
            <>
              <div ref={listRef} className="flex-1 overflow-auto p-2 space-y-2 text-sm min-w-0">
                {messages.map((m) => (
                  <div key={m.id} className="rounded bg-gray-50 p-2">
                    <div className="text-gray-600 text-xs">
                      {m.user} ·{" "}
                      {new Date(m.ts).toLocaleTimeString("ko-KR", {
                        hour: "2-digit",
                        minute: "2-digit",
                        hour12: false,
                      })}
                    </div>
                    <div className="text-gray-900 whitespace-pre-wrap break-words">{m.text}</div>
                  </div>
                ))}
              </div>

              <div className="p-2 border-t flex gap-2">
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={onKeyDown}
                  placeholder="메시지 입력"
                  className="border rounded px-2 py-1 text-sm flex-1 min-w-0 w-full"
                />
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center p-4 text-sm text-gray-600">
              로그인 후 채팅을 이용하실 수 있습니다.
            </div>
          )}

          {showToggle && (
            <button
              type="button"
              onClick={onToggle}
              className="absolute left-0 -translate-x-full bottom-3 z-20 w-12 h-12 rounded-full bg-blue-600 text-white shadow hover:bg-blue-700 flex items-center justify-center pointer-events-auto"
              aria-label={open ? "채팅 닫기" : "채팅 열기"}
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
  );
}

function dedupe(list: ChatMsg[]): ChatMsg[] {
  const seen = new Set<string>();
  const out: ChatMsg[] = [];

  for (const m of list) {
    const key = m.id || makeId(m.text, m.user, m.ts);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(m);
  }

  return out.slice(-200);
}
