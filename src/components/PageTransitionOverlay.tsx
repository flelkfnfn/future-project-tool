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
  const minUntil = useRef<number>(0);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const suppressNext = useRef<boolean>(false);
  const isFirstPaint = useRef<boolean>(true);

  const showOverlay = useCallback((minDuration: number = 800) => {
    setShow(true);
    minUntil.current = Date.now() + minDuration;
  }, []);

  const hideOverlay = useCallback(() => {
    const now = Date.now();
    const delay = Math.max(500, minUntil.current - now);
    if (hideTimer.current) clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => setShow(false), delay);
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

  return (
    <PageTransitionOverlayContext.Provider value={{ showOverlay, hideOverlay }}>
      {children}
      {show && (
        <div className="pointer-events-none fixed inset-0 z-40 flex items-center justify-center bg-white/40 backdrop-blur-sm transition-opacity duration-700 opacity-100 animate-fadeout">
        </div>
      )}
    </PageTransitionOverlayContext.Provider>
  );
};

// This component is now just a wrapper for the provider
export default function PageTransitionOverlay() {
  return null; // The actual overlay is rendered by the provider
}
