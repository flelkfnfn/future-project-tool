'use client'

import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react'
import { usePathname } from 'next/navigation'

interface PageTransitionOverlayContextType {
  showOverlay: (minDuration?: number) => void;
  hideOverlay: () => void;
}

const PageTransitionOverlayContext = createContext<PageTransitionOverlayContextType | undefined>(undefined);

export const usePageTransitionOverlay = () => {
  const context = useContext(PageTransitionOverlayContext);
  if (!context) {
    throw new Error('usePageTransitionOverlay must be used within a PageTransitionOverlayProvider');
  }
  return context;
};

export const PageTransitionOverlayProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const pathname = usePathname();
  const [show, setShow] = useState(false);
  const [progress, setProgress] = useState(0);
  const [variant, setVariant] = useState<{
    gradient: string;
    spinner: string;
    backdrop: string;
    msg: string;
    target: number;
    step: number;
    interval: number;
    finishMs: number;
  } | null>(null);
  const minUntil = useRef<number>(0);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const progTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const suppressNext = useRef<boolean>(false);
  const isFirstPaint = useRef<boolean>(true);

  const showOverlay = useCallback((minDuration: number = 800) => {
    setShow(true);
    setProgress(0);
    minUntil.current = Date.now() + minDuration;
    // Pick a visual/behavior variant per activation
    const BAR_GRADIENTS = [
      'from-indigo-400 via-sky-400 to-cyan-400',
      'from-purple-400 via-fuchsia-400 to-rose-400',
      'from-amber-400 via-orange-400 to-rose-400',
      'from-emerald-400 via-teal-400 to-sky-400',
    ];
    const SPINNERS = [
      'border-indigo-500/80',
      'border-rose-500/80',
      'border-amber-500/80',
      'border-emerald-500/80',
    ];
    const BACKDROPS = [
      'bg-white/60 dark:bg-black/40',
      'bg-white/55 dark:bg-black/35',
      'bg-white/70 dark:bg-black/45',
    ];
    const MESSAGES = ['이동 중...', '페이지 전환 중...', '잠시만요...', '불러오는 중...'];
    const pick = <T,>(arr: T[]) => arr[Math.floor(Math.random() * arr.length)];
    const gradient = pick(BAR_GRADIENTS);
    const spinner = pick(SPINNERS);
    const backdrop = pick(BACKDROPS);
    const msg = pick(MESSAGES);
    const target = 0.90 + Math.random() * 0.06; // 90%~96%
    const step = 0.06 + Math.random() * 0.05;   // easing factor
    const interval = 90 + Math.floor(Math.random() * 70); // 90~160ms
    const finishMs = 220 + Math.floor(Math.random() * 180); // 220~400ms
    setVariant({ gradient, spinner, backdrop, msg, target, step, interval, finishMs });
    if (progTimer.current) clearInterval(progTimer.current);
    progTimer.current = setInterval(() => {
      setProgress((p) => {
        const next = p + (target - p) * step;
        return next > target ? target : next;
      });
    }, interval);
  }, []);

  const hideOverlay = useCallback(() => {
    const now = Date.now();
    const delay = Math.max(500, minUntil.current - now);
    if (progTimer.current) { clearInterval(progTimer.current); progTimer.current = null; }
    // Fast ramp to 100%
    const finMs = variant?.finishMs ?? 300;
    const t0 = Date.now();
    const fin = setInterval(() => {
      setProgress((p) => {
        const next = p + (1 - p) * 0.35;
        return next >= 0.999 ? 1 : next;
      });
      if (Date.now() - t0 > finMs) clearInterval(fin);
    }, 50);
    if (hideTimer.current) clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => {
      setShow(false);
      setProgress(0);
    }, Math.max(delay, 320));
  }, []);

  // Listen for native <a> tag clicks
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;
      const a = target.closest('a') as HTMLAnchorElement | null;
      if (!a) return;
      if (a.hasAttribute('data-no-overlay')) {
        suppressNext.current = true;
        return;
      }
      if (a.target && a.target !== '_self') return;
      const href = a.getAttribute('href') || '';
      if (href === pathname) return;
      if (!href || href.startsWith('http') || href.startsWith('mailto:') || href.startsWith('tel:')) return;
      showOverlay();
    };
    document.addEventListener('click', onClick, true);
    return () => document.removeEventListener('click', onClick, true);
  }, [pathname, showOverlay]);

  // Listen for pathname changes (e.g., from router.push)
  useEffect(() => {
    // Skip overlay on initial mount when landing on home
    if (isFirstPaint.current) {
      isFirstPaint.current = false;
      if (pathname === '/') return;
    }
    if (suppressNext.current) {
      suppressNext.current = false;
      return;
    }
    showOverlay();
    hideOverlay();
  }, [pathname, showOverlay, hideOverlay]);

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (hideTimer.current) clearTimeout(hideTimer.current);
      if (progTimer.current) clearInterval(progTimer.current);
    };
  }, []);

  return (
    <PageTransitionOverlayContext.Provider value={{ showOverlay, hideOverlay }}>
      {children}
      {show && (
        <div className={`pointer-events-none fixed inset-0 z-40 flex items-center justify-center ${variant?.backdrop ?? 'bg-white/60 dark:bg-black/40'} backdrop-blur-sm transition-opacity duration-500 opacity-100`}>
          <div
            role="status"
            aria-live="polite"
            className="pointer-events-none select-none rounded-2xl border border-gray-200/70 dark:border-gray-700/60 bg-white/80 dark:bg-gray-900/70 shadow-lg px-6 py-5 flex flex-col items-center gap-3 text-center"
          >
            <div className={`h-8 w-8 rounded-full border-2 border-t-transparent animate-spin ${variant?.spinner ?? 'border-indigo-500/80'}`} aria-hidden />
            <div className="text-sm font-medium text-gray-800 dark:text-gray-100">이동 중...</div>
            <div className="mt-1 h-1.5 w-48 rounded-full bg-gray-200/70 dark:bg-gray-700/70 overflow-hidden">
              <div
                className={`h-full w-full bg-gradient-to-r ${variant?.gradient ?? 'from-indigo-400 via-sky-400 to-cyan-400'}`}
                style={{ transformOrigin: 'left', transform: `scaleX(${Math.max(0.02, Math.min(1, progress))})` }}
              />
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400">잠시만 기다려 주세요</div>
          </div>
        </div>
      )}
    </PageTransitionOverlayContext.Provider>
  );
};

// This component is now just a wrapper for the provider
export default function PageTransitionOverlay() {
  return null; // The actual overlay is rendered by the provider
}
