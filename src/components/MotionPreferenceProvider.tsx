"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type {
  MotionPreference,
  ResolvedMotionSetting,
} from "@/lib/motion-preference";

type MotionPreferenceContextValue = {
  mode: MotionPreference;
  resolved: ResolvedMotionSetting;
  setMode: (next: MotionPreference) => void;
};

const MotionPreferenceContext =
  createContext<MotionPreferenceContextValue | null>(null);

type MotionPreferenceProviderProps = {
  initialPreference: MotionPreference;
  children: React.ReactNode;
};

export function MotionPreferenceProvider({
  initialPreference,
  children,
}: MotionPreferenceProviderProps) {
  const [mode, setMode] = useState<MotionPreference>(initialPreference);
  const [resolved, setResolved] = useState<ResolvedMotionSetting>(
    initialPreference === "reduced" ? "reduced" : "full"
  );

  useEffect(() => {
    setMode(initialPreference);
    setResolved(initialPreference === "reduced" ? "reduced" : "full");
  }, [initialPreference]);

  useEffect(() => {
    const html = document.documentElement;
    if (mode === "reduced") {
      setResolved("reduced");
      html.dataset.motion = "reduced";
      return;
    }
    const media =
      typeof window !== "undefined" && "matchMedia" in window
        ? window.matchMedia("(prefers-reduced-motion: reduce)")
        : null;
    const sync = () => {
      const next = media && media.matches ? "reduced" : "full";
      setResolved(next);
      html.dataset.motion = next === "reduced" ? "reduced" : "full";
    };
    sync();
    if (!media) return;
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, [mode]);

  const setModeSafe = useCallback(
    (next: MotionPreference) => {
      setMode(next);
    },
    [setMode]
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
    <MotionPreferenceContext.Provider value={value}>
      {children}
    </MotionPreferenceContext.Provider>
  );
}

export function useMotionPreference() {
  const ctx = useContext(MotionPreferenceContext);
  if (!ctx) {
    throw new Error(
      "useMotionPreference는 MotionPreferenceProvider 내부에서만 사용할 수 있습니다."
    );
  }
  return ctx;
}
