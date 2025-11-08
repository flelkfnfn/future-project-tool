"use client";

import { useSupabase } from "@/components/supabase-provider";
import { useEffect, useRef, useState } from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";

export default function ActiveUsersDisplay() {
  const { supabase, session } = useSupabase();
  const [activeUsers, setActiveUsers] = useState<
    { email: string; presence_key: string }[]
  >([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | undefined>(undefined);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const currentKeyRef = useRef<string | null>(null);

  // Resolve user locally to avoid relying solely on provider session timing
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const ures = await supabase.auth.getUser();
        if (mounted) {
          console.log('[ActiveUsers] getUser result', ures.data.user);
          setUserId(ures.data.user?.id ?? null);
          setUserEmail(ures.data.user?.email ?? undefined);
          if (!ures.data.user) {
            try {
              const res = await fetch('/api/me', { credentials: 'include', cache: 'no-store' });
              const j = await res.json();
              const p = j && j.principal;
              if (p && p.id && mounted) {
                setUserId(String(p.id));
                const lbl = p.username || p.email || undefined;
                setUserEmail(lbl);
                console.log('[ActiveUsers] fallback principal', p);
              }
            } catch {}
          }
        }
      } catch (e) {
        console.error("getUser failed", e);
      }
    })();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_e, s) => {
      setUserId(s?.user?.id ?? null);
      setUserEmail(s?.user?.email ?? undefined);
    });
    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [supabase]);

  useEffect(() => {
    if (!supabase) return;
    const effectiveUserId = (session && session.user && session.user.id) ? session.user.id : userId;
    console.log('[ActiveUsers] effectiveUserId', effectiveUserId, 'session?', !!session);
    if (!effectiveUserId) {
      if (channelRef.current) {
        try { supabase.removeChannel(channelRef.current); } catch {}
        channelRef.current = null;
        currentKeyRef.current = null;
      }
      return;
    }
    // If the channel exists with a different key, recreate
    if (channelRef.current && currentKeyRef.current !== effectiveUserId) {
      try { supabase.removeChannel(channelRef.current); } catch {}
      channelRef.current = null;
      currentKeyRef.current = null;
    }
    if (channelRef.current) return; // already created for current key

    const channel = supabase.channel("online-users", {
      config: {
        presence: {
          key: effectiveUserId,
        },
      },
    });

    channel.on("presence", { event: "sync" }, () => {
      const newState = channel.presenceState<{ email?: string }>();
      const users = Object.keys(newState).map((presence_key) => {
        const pres = newState[presence_key] as unknown as { email?: string }[];
        const first = pres?.[0];
        const display = first?.email || presence_key;
        return { email: display, presence_key };
      });
      setActiveUsers(users);
    });

    channel.subscribe(async (status) => {
      if (status === "SUBSCRIBED") {
        console.log("Presence SUBSCRIBED for key", effectiveUserId);
        try {
          const effectiveEmail = session?.user?.email ?? userEmail;
          await channel.track({
            email: effectiveEmail ?? undefined,
            online_at: new Date().toISOString(),
          });
        } catch (e) {
          console.error("Presence track failed", e);
        }
      } else {
        console.error("Presence subscribe status:", status);
      }
    });
    channelRef.current = channel;
    currentKeyRef.current = effectiveUserId;
  }, [supabase, session, userId]);

  // Update presence payload label without recreating channel
  useEffect(() => {
    const ch = channelRef.current;
    if (!ch) return;
    (async () => {
      try {
        const effectiveEmail = session?.user?.email ?? userEmail;
        await ch.track({ email: effectiveEmail ?? undefined, online_at: new Date().toISOString() });
      } catch {}
    })();
  }, [session, userEmail]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (channelRef.current) {
        try { supabase.removeChannel(channelRef.current); } catch {}
        channelRef.current = null;
      }
    };
  }, [supabase]);

  return (
    <div className="p-3 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-gray-800/80 backdrop-blur">
      <h3 className="text-xs font-bold text-gray-600 dark:text-gray-400 mb-2">
        활동 중인 사용자
      </h3>
      {(session?.user?.id ?? userId) ? (
        activeUsers.length > 0 ? (
          <ul className="space-y-1.5">
            {activeUsers.map((user) => (
              <li
                key={user.presence_key}
                className="flex items-center gap-2 text-xs text-gray-800 dark:text-gray-200"
              >
                <span className="w-2 h-2 rounded-full bg-green-500" />
                <span>{user.email}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-xs text-gray-500 dark:text-gray-400">
            현재 활동 중인 사용자가 없습니다.
          </p>
        )
      ) : (
        <p className="text-xs text-gray-500 dark:text-gray-400">
          로그인이 필요합니다.
        </p>
      )}
    </div>
  );
}
