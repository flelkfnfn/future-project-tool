"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useSupabase } from "@/components/supabase-provider";
import { fetchMeCached } from "@/lib/api/meClient";
import type { User, Session, AuthChangeEvent } from "@supabase/supabase-js";
import { localSignOut } from "@/app/login/localActions";
import Dock from "@/components/Dock";
import { usePageTransitionOverlay } from "@/components/PageTransitionOverlay";
import {
  LuWorkflow,
  LuFolderKanban,
  LuMegaphone,
  LuLightbulb,
  LuCalendarDays,
  LuFolderOpen,
  LuUserRound,
} from "react-icons/lu";

const nav = [
  { href: "/projects", label: "프로젝트" },
  { href: "/notices", label: "공지사항" },
  { href: "/ideas", label: "아이디어" },
  { href: "/calendar", label: "캘린더" },
  { href: "/files", label: "파일 공유" },
];

const Header = () => {
  const router = useRouter();
  const pathname = usePathname();
  const { supabase, session } = useSupabase();
  const { showOverlay } = usePageTransitionOverlay();
  const [user, setUser] = useState<User | null>(session?.user ?? null);
  const [localAuthed, setLocalAuthed] = useState(false);
  const [localAccountPresent, setLocalAccountPresent] = useState(false);
  const [accountLabel, setAccountLabel] = useState<string | null>(
    session?.user?.email ?? null
  );

  const userEmail = user?.email; // Destructure email here
  const hasLocalRole = () =>
    typeof document !== "undefined" &&
    document.cookie.includes("local_session_present=1");
  const hasLocalAccount = () =>
    typeof document !== "undefined" &&
    document.cookie.includes("local_account_present=1");

  useEffect(() => {
    let mounted = true;
    (async () => {
      const res = await supabase.auth.getUser();
      if (mounted) setUser(res.data.user ?? null);
      if (mounted) {
        if (res.data.user?.email) {
          setAccountLabel(res.data.user.email);
        } else if (hasLocalRole()) {
          fetchMeCached()
            .then((j) => {
              const p = j?.principal;
              const label = (p && (p.username || p.email)) || null;
              setAccountLabel(label);
            })
            .catch(() => {});
        }
      }
    })();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      (event: AuthChangeEvent, s: Session | null) => {
        if (mounted) setUser(s?.user ?? null);
      }
    );
    setLocalAuthed(hasLocalRole());
    setLocalAccountPresent(hasLocalAccount());
    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [supabase]);

  useEffect(() => {
    const hasLocal = hasLocalRole();
    setLocalAuthed(hasLocal);
    setLocalAccountPresent(hasLocalAccount());
    if (userEmail) {
      // Use userEmail here
      setAccountLabel(userEmail);
    } else if (hasLocal) {
      fetchMeCached()
        .then((j) => {
          const p = j?.principal;
          const label = (p && (p.username || p.email)) || null;
          setAccountLabel(label);
        })
        .catch(() => {});
    } else {
      setAccountLabel(null);
    }
  }, [pathname, userEmail, setAccountLabel]);
  useEffect(() => {
    const onFocus = () => {
      const hasLocal = hasLocalRole();
      setLocalAuthed(hasLocal);
      setLocalAccountPresent(hasLocalAccount());
      if (!user?.email && hasLocal) {
        fetchMeCached()
          .then((j) => {
            const p = j?.principal;
            const label = (p && (p.username || p.email)) || null;
            setAccountLabel(label);
          })
          .catch(() => {});
      } else if (user?.email) {
        setAccountLabel(user.email);
      }
    };
    if (typeof window !== "undefined") {
      window.addEventListener("focus", onFocus);
    }
    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("focus", onFocus);
      }
    };
  }, [user, setLocalAuthed, setAccountLabel]);

  const handleLogout: () => Promise<void> = async () => {
    showOverlay();
    await supabase.auth.signOut();
    router.push("/login");
  };

  const authed = !!user || localAuthed;
  const pendingRole = !authed && localAccountPresent;

  return (
    <header className="sticky top-0 z-50 glass-header  text-gray-900 dark:text-gray-100 h-18.5 after:absolute after:inset-x-0 after:bottom-0 after:h-px after:bg-gradient-to-r after:from-transparent after:via-[color-mix(in_oklab,var(--ring)_35%,transparent)] after:to-transparent">
      <div className="container mx-auto px-4 h-full">
        <div className="flex justify-between h-full">
          {/* Left Section */}
          <div className="flex flex-1 items-center justify-start">
            <Link href="/" data-no-overlay className="text-xl font-bold">
              미래·사회변화주도 프로젝트
            </Link>
          </div>

          {/* Center Section (Dock) */}
          <div className="flex flex-1 items-end justify-center">
            <Dock
              panelHeight={58}
              dockHeight={72}
              baseItemSize={40}
              magnification={44}
              distance={160}
              items={nav.map((item) => {
                const map: Record<
                  string,
                  React.ComponentType<{ size?: number; className?: string }>
                > = {
                  "/projects": LuWorkflow,
                  "/notices": LuMegaphone,
                  "/ideas": LuLightbulb,
                  "/calendar": LuCalendarDays,
                  "/files": LuFolderOpen,
                };
                const Cmp = map[item.href] ?? LuFolderKanban;
                return {
                  icon: (
                    <>
                      <Link
                        href={item.href}
                        aria-label={item.label as string}
                        className="absolute inset-0 z-10"
                      />
                      <Cmp
                        size={24}
                        aria-hidden
                        className={
                          pathname?.startsWith(item.href)
                            ? "text-blue-600 dark:text-blue-300"
                            : "text-slate-700 dark:text-gray-200"
                        }
                      />
                    </>
                  ),
                  label: (
                    <span className="text-white dark:text-gray-200">
                      {item.label}
                    </span>
                  ),
                  onClick: () => {},
                  className: pathname?.startsWith(item.href)
                    ? "ring-2 ring-blue-400"
                    : "",
                };
              })}
            />
          </div>

          {/* Right Section */}
          <div className="flex flex-1 items-center justify-end">
            {authed ? (
              <div className="flex items-center gap-4">
                {accountLabel && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
                      {accountLabel}
                    </span>
                    <Link
                      href="/profile"
                      aria-label="프로필"
                      className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      <LuUserRound
                        size={20}
                        className="text-gray-700 dark:text-gray-300"
                      />
                    </Link>
                  </div>
                )}
                <form action={localSignOut}>
                  <button
                    type="submit"
                    onClick={handleLogout}
                    className="bg-rose-500 text-white px-3 py-2 rounded hover:bg-rose-600 text-sm"
                  >
                    로그아웃
                  </button>
                </form>
              </div>
            ) : pendingRole ? (
              <span className="bg-amber-100 text-amber-700 px-3 py-1 rounded text-sm">
                권한 승인 대기
              </span>
            ) : (
              <Link
                href="/login"
                className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 text-sm"
              >
                로그인 / 회원가입
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
