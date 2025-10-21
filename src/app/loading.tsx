"use client"

export default function RootLoading() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/60 backdrop-blur-sm animate-fade-out">
      <style jsx global>{`
        @keyframes fade-out { from { opacity: 1 } to { opacity: 0 } }
        .animate-fade-out { animation: fade-out 0.28s ease-out forwards; }
      `}</style>
      <div className="flex flex-col items-center gap-3">
        <div className="h-10 w-10 rounded-full border-4 border-blue-500 border-t-transparent animate-spin" />
        <p className="text-sm text-gray-700">로딩 중…</p>
      </div>
    </div>
  )
}
