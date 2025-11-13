"use client";

import { useEffect, useRef } from "react";

function readAuthSnapshot() {
  if (typeof document === "undefined") {
    return { local: false, supabase: false };
  }
  const cookie = document.cookie || "";
  return {
    local: cookie.includes("local_session_present=1"),
    supabase:
      cookie.includes("sb-access-token") ||
      cookie.includes("supabase-auth-token") ||
      cookie.includes("sb-refresh-token"),
  };
}

export default function AuthRefreshWatcher() {
  const reloadingRef = useRef(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    let last = readAuthSnapshot();
    const timer = window.setInterval(() => {
      const next = readAuthSnapshot();
      const changed =
        next.local !== last.local || next.supabase !== last.supabase;
      if (!reloadingRef.current && changed) {
        reloadingRef.current = true;
        window.location.reload();
        return;
      }
      last = next;
    }, 1000);

    return () => window.clearInterval(timer);
  }, []);

  return null;
}

