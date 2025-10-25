'use client'

import { useEffect, useRef, useState } from 'react'
import { usePathname } from 'next/navigation'

export default function PageTransitionOverlay() {
  const pathname = usePathname()
  const pathnameRef = useRef(pathname)
  const [show, setShow] = useState(false)
  const minUntil = useRef<number>(0)
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    pathnameRef.current = pathname
  }, [pathname])

  // Show immediately on internal navigation click and keep for minimum time
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null
      if (!target) return
      const a = target.closest('a') as HTMLAnchorElement | null
      if (!a) return
      if (a.target && a.target !== '_self') return
      const href = a.getAttribute('href') || ''
      if (href === pathnameRef.current) return
      if (!href || href.startsWith('http') || href.startsWith('mailto:') || href.startsWith('tel:')) return
      setShow(true)
      minUntil.current = Date.now() + 800 // 최소 800ms 유지
    }
    document.addEventListener('click', onClick, true)
    return () => document.removeEventListener('click', onClick, true)
  }, [])

  useEffect(() => {
    // 경로 변경 시: 오버레이 유지 후 자연스럽게 제거
    setShow(true)
    const now = Date.now()
    const delay = Math.max(500, minUntil.current - now) // 최소 500ms 또는 클릭 기준 최소시간 보장
    if (hideTimer.current) clearTimeout(hideTimer.current)
    hideTimer.current = setTimeout(() => setShow(false), delay)
    return () => {
      if (hideTimer.current) clearTimeout(hideTimer.current)
    }
  }, [pathname])

  if (!show) return null

  return (
    <div className="pointer-events-none fixed inset-0 z-40 flex items-center justify-center bg-white/40 backdrop-blur-sm transition-opacity duration-700 opacity-100 animate-fadeout">
    </div>
  )
}
