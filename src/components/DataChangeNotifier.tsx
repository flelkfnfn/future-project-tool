"use client";

import { useCallback, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useSupabase } from "@/components/supabase-provider";
import type { RealtimeChannel } from "@supabase/supabase-js";

type WatchTarget = {
  table: string;
  label: string;
};

type ChangeKind = "added" | "removed";

export type DataChangeDetail = { label: string; type: ChangeKind };

export const DATA_CHANGE_EVENT = "app:data-change";

export function emitLocalDataChange(detail: DataChangeDetail) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent<DataChangeDetail>(DATA_CHANGE_EVENT, { detail }));
}

const WATCH_LIST: WatchTarget[] = [
  { table: "ideas", label: "아이디어" },
  { table: "notices", label: "공지" },
  { table: "projects", label: "프로젝트" },
  { table: "calendar_events", label: "캘린더" },
];

export default function DataChangeNotifier() {
  const { supabase } = useSupabase();
  const router = useRouter();
  const broadcastChannelRef = useRef<RealtimeChannel | null>(null);

  const showToast = useCallback(
    (label: string, type: ChangeKind) => {
      const summary =
        type === "added"
          ? `새 ${label}가 추가되었습니다.`
          : `${label}가 삭제되었습니다.`;
      toast.info(summary, {
        description: "변경 사항을 확인하려면 새로고침하세요.",
        action: {
          label: "새로고침",
          onClick: () => router.refresh(),
        },
        duration: 8000,
      });
    },
    [router]
  );

  useEffect(() => {
    if (!supabase) return;

    const channels = WATCH_LIST.map(({ table, label }) => {
      return supabase
        .channel(`change-watch-${table}`)
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table },
          (payload) => {
            if (payload.eventType !== "INSERT" && payload.eventType !== "DELETE") return;
            const change: ChangeKind = payload.eventType === "INSERT" ? "added" : "removed";
            showToast(label, change);
          }
        )
        .subscribe();
    });

    return () => {
      channels.forEach((channel) => {
        try {
          supabase.removeChannel(channel);
        } catch {
          /* noop */
        }
      });
    };
  }, [supabase, showToast]);

  useEffect(() => {
    if (!supabase) return;
    const broadcastChannel = supabase
      .channel("data-change-feed", { config: { broadcast: { self: false } } })
      .on("broadcast", { event: "data-change" }, (payload) => {
        const detail = payload.payload as DataChangeDetail | undefined;
        if (!detail) return;
        showToast(detail.label, detail.type);
      })
      .subscribe();
    broadcastChannelRef.current = broadcastChannel;

    const handler = (event: Event) => {
      const detail = (event as CustomEvent<DataChangeDetail>).detail;
      if (!detail) return;
      if (broadcastChannelRef.current) {
        broadcastChannelRef.current.send({
          type: "broadcast",
          event: "data-change",
          payload: detail,
        });
      }
      showToast(detail.label, detail.type);
    };
    window.addEventListener(DATA_CHANGE_EVENT, handler as EventListener);
    return () => {
      window.removeEventListener(DATA_CHANGE_EVENT, handler as EventListener);
      if (broadcastChannelRef.current) {
        try {
          supabase.removeChannel(broadcastChannelRef.current);
        } catch {
          /* noop */
        } finally {
          broadcastChannelRef.current = null;
        }
      }
    };
  }, [supabase, showToast]);

  return null;
}
