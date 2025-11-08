"use client";

import { useSupabase } from "@/components/supabase-provider";
import { useEffect, useState } from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";

export default function ActiveUsers() {
  const { supabase } = useSupabase();
  const [activeUsers, setActiveUsers] = useState<
    { label: string; presence_key: string }[]
  >([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [userLabel, setUserLabel] = useState<string | undefined>(undefined);

  // Resolve Supabase user once and on auth changes
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const ures = await supabase.auth.getUser();
        if (!mounted) return;
        setUserId(ures.data.user?.id ?? null);
        setUserLabel(ures.data.user?.email ?? undefined);
      } catch {}
    })();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_e, s) => {
      setUserId(s?.user?.id ?? null);
      setUserLabel(s?.user?.email ?? undefined);
    });
    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [supabase]);

  // Subscribe presence when user available
  useEffect(() => {
    let channel: RealtimeChannel | null = null;
    if (supabase && userId) {
      channel = supabase.channel("online-users", {
        config: {
          presence: { key: userId },
        },
      });

      channel.on("presence", { event: "sync" }, () => {
        const state = channel!.presenceState<{
          label?: string;
          email?: string;
          username?: string;
        }>();
        const users = Object.keys(state).map((presence_key) => {
          const first = (state[presence_key] ?? [])[0];
          const display =
            first?.label || first?.email || first?.username || presence_key;
          return { label: display, presence_key };
        });
        setActiveUsers(users);
      });

      channel.subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          try {
            await channel!.track({
              label: userLabel ?? undefined,
              online_at: new Date().toISOString(),
            });
          } catch (e) {
            console.error("Presence track failed", e);
          }
        } else {
          console.warn("Presence subscribe status:", status);
        }
      });
    }

    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, [supabase, userId]);

  return (
    <div className="p-3 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-gray-800/80 backdrop-blur">
      <h3 className="text-xs font-bold text-gray-600 dark:text-gray-400 mb-2">
        현재 동 중인 사용자
      </h3>
      {userId && activeUsers.length > 0 ? (
        <ul className="space-y-1.5">
          {activeUsers.map((user) => (
            <li
              key={user.presence_key}
              className="flex items-center gap-2 text-xs text-gray-800 dark:text-gray-200"
            >
              <span className="w-2 h-2 rounded-full bg-green-500" />
              <span>{user.label}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-xs text-gray-500 dark:text-gray-400">
          {userId
            ? "현재 동 중인 사용자가 없습니다."
            : "로그인 후 사용 가능합니다."}
        </p>
      )}
    </div>
  );
}
