'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'

export default function PageTransitionOverlay() {
  const pathname = usePathname()
  const [show, setShow] = useState(false)

  useEffect(() => {
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

