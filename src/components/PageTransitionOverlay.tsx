'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'

export default function PageTransitionOverlay() {
  const pathname = usePathname()
  const [show, setShow] = useState(false)

  // Show immediately on internal navigation click
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null
      if (!target) return
      const a = target.closest('a') as HTMLAnchorElement | null
      if (!a) return
      if (a.target && a.target !== '_self') return
      const href = a.getAttribute('href') || ''
      if (!href || href.startsWith('http') || href.startsWith('mailto:') || href.startsWith('tel:')) return
      setShow(true)
    }
    document.addEventListener('click', onClick, true)
    return () => document.removeEventListener('click', onClick, true)
  }, [])

  useEffect(() => {
    // Path changed: keep overlay briefly then fade out
    setShow(true)
    const t = setTimeout(() => setShow(false), 280)
    return () => clearTimeout(t)
  }, [pathname])

  if (!show) return null

  return (
    <div className="pointer-events-none fixed inset-0 z-40 flex items-center justify-center bg-white/40 backdrop-blur-sm transition-opacity duration-300 animate-fade-out">
      <style jsx global>{`
        @keyframes fade-out { from { opacity: 1 } to { opacity: 0 } }
        .animate-fade-out { animation: fade-out 0.28s ease-out forwards; }
      `}</style>
    </div>
  )
}
