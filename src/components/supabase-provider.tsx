"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { createContext, useContext, useEffect, useState } from "react";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Session } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";

type SupabaseContext = {
  supabase: SupabaseClient<Database>;
  session: Session | null; // Add session to context
};

const Context = createContext<SupabaseContext | undefined>(undefined);

export default function SupabaseProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [supabase] = useState(() => createClient());
  const [session, setSession] = useState<Session | null>(null); // State to hold session

  useEffect(() => {
    let isMounted = true;
    let handledInitialSession = false;

    // Fetch initial session
    supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
      if (!isMounted) return;
      setSession(initialSession);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, nextSession) => {
      if (!isMounted) return;
      setSession(nextSession);

      // Skip the synthetic INITIAL_SESSION event that fires on mount
      if (!handledInitialSession && event === "INITIAL_SESSION") {
        handledInitialSession = true;
        return;
      }
      handledInitialSession = true;

      if (event === "SIGNED_IN" || event === "SIGNED_OUT" || event === "USER_UPDATED") {
        router.refresh();
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [router, supabase]);

  return (
    <Context.Provider value={{ supabase, session }}>
      {children}
    </Context.Provider>
  );
}

export const useSupabase = () => {
  const context = useContext(Context);

  if (context === undefined) {
    throw new Error("useSupabase must be used inside SupabaseProvider");
  }

  return context;
};
