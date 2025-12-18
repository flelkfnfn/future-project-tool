"use client";

import { LuPlus, LuEllipsisVertical, LuSend, LuInfo } from "react-icons/lu";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  useCallback,
  useId,
  useLayoutEffect,
} from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { useSupabase } from "@/components/supabase-provider";
import { fetchMeCached } from "@/lib/api/meClient";
import MotionAwareSpinner from "@/components/ui/MotionAwareSpinner";
import { toast } from "sonner";

const makeId = (text: string, user: string, ts: number) =>
  `${ts}:${user}:${text}`;

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
};

type ChatMessagePayload = {
  id: string;
  text: string;
  username: string;
  ts: number;
  room_id: number | null;
};

const MESSAGE_LIMIT = 200;
const CONTEXT_HISTORY_LIMIT = 12;
const TEXTAREA_MAX_HEIGHT_PX = 180;
const STICK_TO_BOTTOM_THRESHOLD_PX = 32;

export default function ChatSidebar({
  onCreateRoom,
  onManageRoom,
}: {
  onCreateRoom?: () => void;
  onManageRoom?: (room: { id: number; name: string }) => void;
}) {
  const { supabase, session } = useSupabase();
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const messageIdsRef = useRef<Set<string>>(new Set());
  const [input, setInput] = useState("");
  const [pending, setPending] = useState(false);
  const [aiHelpPinned, setAiHelpPinned] = useState(false);
  const aiHelpTooltipId = useId();
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [selectedRoomId, setSelectedRoomId] = useState<number | null>(null);
  const selectedRoomIdRef = useRef<number | null>(null);
  useEffect(() => {
    selectedRoomIdRef.current = selectedRoomId;
  }, [selectedRoomId]);
  const [unread, setUnread] = useState<Record<string, number>>({}); // 'general' or room id string
  const bcastRef = useRef<RealtimeChannel | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const scrollToBottom = useCallback((smooth: boolean = true) => {
    const el = listRef.current;
    if (!el) return;
    if (smooth) {
      el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
    } else {
      el.scrollTop = el.scrollHeight;
    }
  }, []);

  const [username, setUsername] = useState<string>("guest");

  useEffect(() => {
    if (session?.user?.email) {
      setUsername(session.user.email);
      return;
    }

    let active = true;
    fetchMeCached()
      .then((j) => {
        if (active) {
          setUsername(
            String(j?.principal?.username || j?.principal?.email || "guest")
          );
        }
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [session]);

  const authed = useMemo(() => {
    if (session?.user) return true;
    if (
      typeof document !== "undefined" &&
      document.cookie.includes("local_session_present=1")
    ) {
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
        const res = await fetch("/api/chat/rooms");
        const data = await res.json();
        if (data.ok) {
          setRooms(data.rooms);
        }
      } catch (e) {
        console.error("Failed to fetch rooms", e);
      }
    };
    fetchRooms();
  }, [authed, supabase]);

  // Fetch messages only when auth/selectedRoom changes (avoid refetch on rooms change)
  useEffect(() => {
    if (!authed) {
      setMessages([]);
      messageIdsRef.current.clear();
      return;
    }
    (async () => {
      // Clear messages when room changes
      setMessages([]);
      messageIdsRef.current.clear();
      try {
        const url =
          selectedRoomId != null
            ? `/api/chat/messages?roomId=${selectedRoomId}`
            : "/api/chat/messages";
        const res = await fetch(url, {
          cache: "no-store",
          credentials: "include",
        });
        const j = await res.json();
        if (j?.ok && Array.isArray(j.data)) {
          const mapped: ChatMsg[] = (
            j.data as Array<{
              text: string;
              user?: string;
              ts: number;
              room_id?: number | null;
            }>
          ).map((r) => ({
            id: makeId(r.text, r.user ?? "user", r.ts),
            text: r.text,
            user: r.user ?? "user",
            ts: r.ts,
            room_id: r.room_id,
          }));
          const deduped = dedupe(mapped);
          setMessages(deduped);
          messageIdsRef.current = new Set(deduped.map((m) => m.id));
          const key =
            selectedRoomId == null ? "general" : String(selectedRoomId);
          setUnread((prev) => ({ ...prev, [key]: 0 }));
        }
      } catch {}
    })();
  }, [authed, selectedRoomId]);

  const appendMessage = useCallback((msg: ChatMsg) => {
    setMessages((prev) => {
      if (messageIdsRef.current.has(msg.id)) {
        return prev;
      }
      let next = [...prev, msg];
      messageIdsRef.current.add(msg.id);
      if (next.length > MESSAGE_LIMIT) {
        const overflow = next.length - MESSAGE_LIMIT;
        const removed = next.slice(0, overflow);
        for (const r of removed) {
          messageIdsRef.current.delete(r.id);
        }
        next = next.slice(overflow);
      }
      return next;
    });
  }, []);

  const broadcastLocalMessage = useCallback((msg: ChatMsg) => {
    bcastRef.current?.send({
      type: "broadcast",
      event: "message",
      payload: msg,
    });
  }, []);

  const persistMessage = useCallback(async (msg: ChatMsg) => {
    try {
      const fd = new FormData();
      fd.append("text", msg.text);
      fd.append("ts", String(msg.ts));
      if (msg.room_id != null) {
        fd.append("room_id", String(msg.room_id));
      }
      const res = await fetch("/api/chat/messages", {
        method: "POST",
        body: fd,
        credentials: "include",
      });
      const j = await res.json().catch(() => ({}));
      return res.ok && j?.ok !== false;
    } catch (error) {
      console.error("persistMessage error:", error);
      return false;
    }
  }, []);

  const retrySend = useCallback(
    async (msg: ChatMsg) => {
      const ok = await persistMessage(msg);
      if (ok) {
        toast.success("메시지를 다시 보냈어요.");
      } else {
        toast.error("다시 보내기에 실패했어요.");
      }
    },
    [persistMessage]
  );

  const handleSendFailure = useCallback(
    (msg: ChatMsg) => {
      broadcastLocalMessage(msg);
      toast.error("메시지를 전송하지 못했어요.", {
        description: "네트워크 상태를 확인한 뒤 다시 시도해 주세요.",
        action: {
          label: "재시도",
          onClick: () => retrySend(msg),
        },
      });
    },
    [broadcastLocalMessage, retrySend]
  );

  // Subscribe to realtime channels; depend on rooms, keep latest selectedRoomId via ref to avoid resubscribing on selection change
  useEffect(() => {
    if (!authed) return;

    const messageHandler = ({
      payload: r,
    }: {
      payload: ChatMessagePayload;
    }) => {
      const incoming: ChatMsg = {
        id: makeId(r.text, r.username, r.ts),
        text: r.text,
        user: r.username,
        ts: r.ts,
        room_id: r.room_id,
      };
      const currentRoomId = selectedRoomIdRef.current;
      if (
        (currentRoomId == null && incoming.room_id == null) ||
        (currentRoomId != null && incoming.room_id === currentRoomId)
      ) {
        appendMessage(incoming);
        listRef.current?.scrollTo({
          top: listRef.current.scrollHeight,
          behavior: "smooth",
        });
      } else {
        const key =
          incoming.room_id == null ? "general" : String(incoming.room_id);
        setUnread((prev) => ({ ...prev, [key]: (prev[key] ?? 0) + 1 }));
      }
    };

    const channels = rooms.map((room) => {
      const channel = supabase.channel(`room-${room.id}`);
      channel.on("broadcast", { event: "new-message" }, messageHandler);
      channel.subscribe();
      return channel;
    });

    const publicChannel = supabase.channel("public-room");
    publicChannel.on("broadcast", { event: "new-message" }, messageHandler);
    publicChannel.subscribe();

    return () => {
      channels.forEach((channel) => channel.unsubscribe());
      publicChannel.unsubscribe();
    };
  }, [supabase, authed, rooms, appendMessage]);

  // Keep scrolled to bottom on room change, new messages, or panel opening
  useEffect(() => {
    // Jump to bottom when room changes
    scrollToBottom(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedRoomId]);

  useEffect(() => {
    // Smooth scroll on new messages or when panel opens
    scrollToBottom(true);
  }, [messages, scrollToBottom]);

  const resizeTextarea = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;

    const listEl = listRef.current;
    const shouldStickToBottom =
      !!listEl &&
      listEl.scrollHeight - listEl.scrollTop - listEl.clientHeight <
        STICK_TO_BOTTOM_THRESHOLD_PX;

    el.style.height = "auto";
    const nextHeight = Math.min(el.scrollHeight, TEXTAREA_MAX_HEIGHT_PX);
    el.style.height = `${nextHeight}px`;
    el.style.overflowY =
      el.scrollHeight > TEXTAREA_MAX_HEIGHT_PX ? "auto" : "hidden";

    if (shouldStickToBottom) {
      scrollToBottom(false);
    }
  }, [scrollToBottom]);

  useLayoutEffect(() => {
    resizeTextarea();
  }, [input, resizeTextarea]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.addEventListener("resize", resizeTextarea);
    return () => window.removeEventListener("resize", resizeTextarea);
  }, [resizeTextarea]);

  const buildAiContextHistory = useCallback(() => {
    const isSameRoom = (roomId: number | null | undefined) => {
      if (selectedRoomId === null) {
        return roomId === null || typeof roomId === "undefined";
      }
      return roomId === selectedRoomId;
    };

    const relevantMessages = messages.filter((m) => isSameRoom(m.room_id));
    const limited = relevantMessages.slice(-CONTEXT_HISTORY_LIMIT);

    return limited
      .map((m) => ({
        user: m.user,
        text: m.text.trim(),
      }))
      .filter((entry) => entry.text.length > 0);
  }, [messages, selectedRoomId]);

  const send = async () => {
    if (pending) return;

    const text = input.trim();

    if (!text) return;

    // Handle AI command separately
    const isContextAwareCommand = text.startsWith("/aicon ");
    const isAiCommand = isContextAwareCommand || text.startsWith("/ai ");

    if (isAiCommand) {
      setPending(true);

      setInput("AI가 답변을 생성중입니다..."); // Placeholder text

      try {
        const commandPrefix = isContextAwareCommand ? "/aicon " : "/ai ";
        const prompt = text.substring(commandPrefix.length).trim();

        if (!prompt) {
          toast.error("AI에게 질문할 내용을 입력해 주세요.");

          setInput(text); // Restore original text

          return;
        }

        const bodyPayload: {
          prompt: string;
          history?: Array<{ user: string; text: string }>;
        } = { prompt };

        if (isContextAwareCommand) {
          const history = buildAiContextHistory();
          if (history.length > 0) {
            bodyPayload.history = history;
          }
        }

        const aiRes = await fetch("/api/ai/help", {
          method: "POST",

          headers: { "Content-Type": "application/json" },

          body: JSON.stringify(bodyPayload),
        });

        const result = await aiRes.json();

        if (!aiRes.ok || !result.ok) {
          const errorDetails =
            result.details || "자세한 내용을 보려면 서버 로그를 확인하세요.";

          toast.error("AI 응답을 가져오는 데 실패했습니다.", {
            description: errorDetails,
          });

          setInput(text); // Restore original text on failure
        } else {
          setInput(result.text); // Replace input with AI response
        }
      } finally {
        setPending(false);
      }

      return; // Stop further execution for AI commands
    }

    // Regular message sending logic

    setPending(true);

    const now = Date.now();

    const msg: ChatMsg = {
      id: makeId(text, username, now),

      text,

      user: username,

      ts: now,

      room_id: selectedRoomId,
    };

    appendMessage(msg);

    scrollToBottom(true);

    setInput(""); // Clear input after sending

    try {
      const ok = await persistMessage(msg);

      if (!ok) {
        handleSendFailure(msg);
      }
    } finally {
      // setInput is already cleared, setPending is the only thing left

      setPending(false);
    }
  };

  const onKeyDown: React.KeyboardEventHandler<HTMLTextAreaElement> = (e) => {
    if (pending) return;
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  const selectedRoom = useMemo(
    () => (selectedRoomId ? rooms.find((r) => r.id === selectedRoomId) : null),
    [rooms, selectedRoomId]
  );

  return (
    <div className="h-full w-full flex flex-col border dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 min-w-0">
      <div className="p-2 pr-4 border-b dark:border-gray-700 flex items-center gap-2 overflow-x-auto">
        <div className="relative">
          <button
            onClick={() => setSelectedRoomId(null)}
            className={`h-10 w-10 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold ${
              selectedRoomId === null
                ? "bg-blue-600 text-white"
                : "bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200"
            }`}
          >
            일반
          </button>
          {(unread["general"] ?? 0) > 0 && (
            <span className="absolute top-0 right-0 transform translate-x-1/2 -translate-y-1/2 min-w-[18px] h-[18px] px-1 rounded-full bg-red-600 text-white text-[10px] flex items-center justify-center">
              {Math.min(99, unread["general"] ?? 0)}
            </span>
          )}
        </div>
        {rooms.map((room) => (
          <div className="relative" key={room.id}>
            <button
              onClick={() => setSelectedRoomId(room.id)}
              className={`h-10 w-10 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold truncate p-1 ${
                selectedRoomId === room.id
                  ? "bg-blue-600 text-white"
                  : "bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200"
              }`}
              title={room.name}
            >
              {room.name}
            </button>
            {(unread[String(room.id)] ?? 0) > 0 && (
              <span className="absolute top-0 right-0 transform translate-x-1/2 -translate-y-1/2 min-w-[18px] h-[18px] px-1 rounded-full bg-red-600 text-white text-[10px] flex items-center justify-center">
                {Math.min(99, unread[String(room.id)] ?? 0)}
              </span>
            )}
          </div>
        ))}
        <button
          onClick={onCreateRoom}
          className="h-10 w-10 rounded-full flex-shrink-0 flex items-center justify-center bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600"
        >
          <LuPlus className="h-6 w-6" />
        </button>
      </div>

      <div className="px-3 py-2 border-b dark:border-gray-700 font-semibold flex items-center justify-between text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800">
        <span>{selectedRoom?.name ?? "일반 채팅"}</span>
        {selectedRoom && onManageRoom && (
          <button
            onClick={() => onManageRoom(selectedRoom)}
            className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
          >
            <LuEllipsisVertical className="h-5 w-5" />
          </button>
        )}
      </div>

      {authed ? (
        <>
          <div
            ref={listRef}
            className="flex-1 overflow-auto p-3 space-y-2 text-sm min-w-0 bg-white dark:bg-gray-800 overscroll-contain"
          >
            <div className="space-y-2">
              {renderWithDayHeaders(messages).map((item, idx, arr) => {
                // 날짜 헤더
                if ("header" in item) {
                  return (
                    <div
                      key={`h-${item.key}`}
                      className="sticky -top-3 z-20 flex items-center justify-center py-1 bg-white dark:bg-gray-800"
                    >
                      <span className="px-2 py-0.5 text-xs rounded-full bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200">
                        {item.label}
                      </span>
                    </div>
                  );
                }

                // 메시지 렌더링
                const prev = arr[idx - 1];
                const isFirstOfRun =
                  !prev || "header" in prev || prev.m.user !== item.m.user;
                const isSelf = item.m.user === username; // 본인 메시지 식별

                // 말풍선 색상
                const bubbleClass =
                  item.m.user === "admin"
                    ? "bg-amber-200 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-700 text-amber-900 dark:text-amber-100"
                    : isSelf
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100";

                // 행 정렬: 본인 메시지 오른쪽, 상대 메시지 왼쪽
                const rowJustify = isSelf ? "justify-end" : "justify-start";

                // 시간 라벨 공통
                const timeLabel = (
                  <div
                    className={`mb-[2px] text-[10px] ${
                      isSelf
                        ? "text-blue-300"
                        : "text-gray-500 dark:text-gray-400"
                    }`}
                  >
                    {new Date(item.m.ts).toLocaleTimeString("ko-KR", {
                      hour: "2-digit",
                      minute: "2-digit",
                      hour12: false,
                    })}
                  </div>
                );

                return (
                  <div key={item.m.id} className={`flex ${rowJustify}`}>
                    <div className="max-w-[80%] flex flex-col">
                      {/* 동일 ID 연속에서 첫 말풍선 위에만 ID 표시 (ID는 말풍선 밖 윗줄) */}
                      {isFirstOfRun && (
                        <div
                          className={`mb-1 text-[11px] ${
                            isSelf
                              ? "text-blue-400 text-right pr-1"
                              : "text-gray-600 dark:text-gray-400 text-left pl-1"
                          }`}
                        >
                          {item.m.user}
                        </div>
                      )}

                      {/* 말풍선 + 시간: 본인은 [시간, 말풍선], 상대는 [말풍선, 시간] */}
                      <div className={`flex items-end gap-2 ${rowJustify}`}>
                        {isSelf ? (
                          <>
                            {/* 본인: 시간(왼쪽 외부) -> 말풍선(오른쪽) */}
                            {timeLabel}
                            <div
                              className={`rounded-2xl px-3 py-2 shadow-sm ${bubbleClass}`}
                            >
                              <div className="whitespace-pre-wrap break-words">
                                {linkify(item.m.text)}
                              </div>
                            </div>
                          </>
                        ) : (
                          <>
                            {/* 상대: 말풍선(왼쪽) -> 시간(오른쪽 외부) */}
                            <div
                              className={`rounded-2xl px-3 py-2 shadow-sm ${bubbleClass}`}
                            >
                              <div className="whitespace-pre-wrap break-words">
                                {linkify(item.m.text)}
                              </div>
                            </div>
                            {timeLabel}
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="p-2 border-t dark:border-gray-700">
            <div className="relative flex flex-col gap-2">
              {pending && (
                <div
                  className="absolute inset-0 z-10 rounded-md bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200/70 dark:border-gray-700/70 flex items-center justify-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-200"
                  aria-live="polite"
                >
                  <MotionAwareSpinner
                    className="inline-block w-4 h-4 border-2 border-blue-300 dark:border-blue-400 border-t-transparent rounded-full"
                    label="메시지 보내는 중"
                  />
                  <span>메시지 보내는 중...</span>
                </div>
              )}
              <div className="flex gap-2 items-start">
                <div className="relative flex-1 min-w-0">
                  <textarea
                    ref={textareaRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={onKeyDown}
                    placeholder="메시지를 입력하세요..."
                    className="border dark:border-gray-600 rounded-md px-3 py-2 pr-12 text-sm w-full bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:ring-blue-500 focus:border-blue-500 resize-none overflow-hidden"
                    disabled={pending}
                    aria-busy={pending}
                    rows={1} // Start with 1 row
                  />
                  <div
                    className={`absolute top-2 left-3 right-3 flex justify-end text-xs pointer-events-none ${
                      input.length > 0 ? "hidden" : ""
                    }`}
                  >
                    <button
                      type="button"
                      className="inline-flex items-center justify-center w-7 h-5 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 pointer-events-auto"
                      onClick={() => setAiHelpPinned((prev) => !prev)}
                      aria-describedby={
                        aiHelpPinned ? aiHelpTooltipId : undefined
                      }
                      aria-expanded={aiHelpPinned}
                      aria-pressed={aiHelpPinned}
                    >
                      <LuInfo className="h-4 w-4" />
                    </button>
                    {aiHelpPinned && (
                      <div
                        id={aiHelpTooltipId}
                        role="tooltip"
                        className="absolute bottom-full right-0 mb-2 w-72 rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-100 shadow-lg p-3 z-20"
                        style={{
                          maxWidth: "min(16rem)",
                        }}
                      >
                        <p className="text-xs font-semibold text-gray-900 dark:text-gray-100">
                          AI 명령어
                        </p>
                        <ul className="mt-2 space-y-1 text-xs leading-relaxed">
                          <li className="flex items-center gap-2">
                            <code className="font-mono text-[11px] px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800">
                              /ai [질문]
                            </code>
                            <span>빠른 초안 요청</span>
                          </li>
                          <li className="flex items-center gap-2">
                            <code className="font-mono text-[11px] px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800">
                              /aicon [질문]
                            </code>
                            <span>채팅 맥락과 함께 질문</span>
                          </li>
                        </ul>
                        <p className="mt-3 text-[11px] text-gray-500 dark:text-gray-300">
                          아이콘을 다시 누르면 도움말이 닫힙니다.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={send}
                  disabled={pending || !input.trim()}
                  className="inline-flex items-center gap-2 h-9 px-3 rounded-md border border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-100 hover:bg-gray-200 dark:hover:bg-gray-600 disabled:cursor-not-allowed disabled:opacity-70 transition-colors"
                >
                  {pending ? (
                    <MotionAwareSpinner
                      className="inline-block w-4 h-4 border-2 border-blue-300 dark:border-blue-400 border-t-transparent rounded-full"
                      label="메시지 보내는 중"
                    />
                  ) : (
                    <>
                      <LuSend className="h-4 w-4" />
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="flex-1 flex items-center justify-center p-4 text-sm text-gray-600 dark:text-gray-400">
          로그인 후 채팅을 이용하실 수 있습니다.
        </div>
      )}
    </div>
  );
}

function linkify(text: string) {
  if (!text) return [text];
  const urlRegex =
    /(\b(https?|ftp|file):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/gi;
  const nodes = [];
  let lastIndex = 0;
  let match;

  while ((match = urlRegex.exec(text)) !== null) {
    // Add the text before the link
    if (match.index > lastIndex) {
      nodes.push(text.substring(lastIndex, match.index));
    }
    // Add the link
    nodes.push(
      <a
        key={match.index}
        href={match[0]}
        target="_blank"
        rel="noopener noreferrer"
        className="text-blue-400 hover:underline"
        onClick={(e) => e.stopPropagation()}
      >
        {match[0]}
      </a>
    );
    lastIndex = urlRegex.lastIndex;
  }

  // Add the remaining text
  if (lastIndex < text.length) {
    nodes.push(text.substring(lastIndex));
  }

  return nodes.length > 0 ? nodes : [text];
}

function renderWithDayHeaders(
  list: ChatMsg[]
): Array<{ header: true; key: string; label: string } | { m: ChatMsg }> {
  const out: Array<
    { header: true; key: string; label: string } | { m: ChatMsg }
  > = [];
  let lastDay: string | null = null;
  const now = new Date();
  const todayKey = `${now.getFullYear()}-${
    now.getMonth() + 1
  }-${now.getDate()}`;
  const y = new Date(now.getTime() - 86400000);
  const yKey = `${y.getFullYear()}-${y.getMonth() + 1}-${y.getDate()}`;
  const sorted = [...list].sort((a, b) => a.ts - b.ts);
  for (const m of sorted) {
    const d = new Date(m.ts);
    const key = `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
    if (lastDay !== key) {
      lastDay = key;
      const label =
        key === todayKey
          ? "오늘"
          : key === yKey
          ? "어제"
          : d.toLocaleDateString("ko-KR", {
              year: "numeric",
              month: "2-digit",
              day: "2-digit",
            });
      out.push({ header: true, key, label });
    }
    out.push({ m });
  }
  return out;
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
