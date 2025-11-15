"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useState,
} from "react";
import type {
  ThemePreference,
  ResolvedTheme,
} from "@/lib/theme-preference";
import { resolveThemeSetting } from "@/lib/theme-preference";

type ThemePreferenceContextValue = {
  mode: ThemePreference;
  resolved: ResolvedTheme;
  setMode: (next: ThemePreference) => void;
};

const ThemePreferenceContext =
  createContext<ThemePreferenceContextValue | null>(null);

type ThemeProviderProps = {
  initialPreference: ThemePreference;
  children: React.ReactNode;
};

const useIsomorphicLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

export default function ThemeProvider({
  initialPreference,
  children,
}: ThemeProviderProps) {
  const [mode, setMode] = useState<ThemePreference>(initialPreference);
  const [resolved, setResolved] = useState<ResolvedTheme>(() =>
    initialPreference === "dark" ? "dark" : "light"
  );

  useEffect(() => {
    setMode(initialPreference);
  }, [initialPreference]);

  useIsomorphicLayoutEffect(() => {
    const html = document.documentElement;
    const body = document.body;
    const applyTheme = (next: ResolvedTheme) => {
      setResolved(next);
      if (next === "dark") {
        html.classList.add("dark");
        body.classList.add("dark");
      } else {
        html.classList.remove("dark");
        body.classList.remove("dark");
      }
      html.dataset.theme = next;
      body.dataset.theme = next;
      html.style.colorScheme = next;
      body.style.colorScheme = next;
    };

    if (mode === "system") {
      const media =
        typeof window !== "undefined" && "matchMedia" in window
          ? window.matchMedia("(prefers-color-scheme: dark)")
          : null;

      const sync = () => {
        const next = resolveThemeSetting("system", media?.matches ?? false);
        applyTheme(next);
      };

      sync();
      if (media) {
        media.addEventListener("change", sync);
        return () => media.removeEventListener("change", sync);
      }
      return;
    }

    applyTheme(mode);
  }, [mode]);

  const setModeSafe = useCallback(
    (next: ThemePreference) => {
      setMode(next);
    },
    []
  );

  const value = useMemo(
    () => ({
      mode,
      resolved,
      setMode: setModeSafe,
    }),
    [mode, resolved, setModeSafe]
  );

  return (
    <ThemePreferenceContext.Provider value={value}>
      {children}
    </ThemePreferenceContext.Provider>
  );
}

export function useThemePreference() {
  const ctx = useContext(ThemePreferenceContext);
  if (!ctx) {
    throw new Error(
      "useThemePreference는 ThemeProvider 내부에서만 사용할 수 있습니다."
    );
  }
  return ctx;
}
