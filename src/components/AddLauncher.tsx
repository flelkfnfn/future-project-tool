'use client';
import { LuPlus } from 'react-icons/lu';

export default function AddLauncher({ onOpen }: { onOpen: () => void }) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="w-12 h-12 rounded-full bg-emerald-600 text-white shadow flex items-center justify-center transition-all duration-150 ease-out hover:bg-emerald-700 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-emerald-500/30 active:translate-y-0 active:scale-95 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-300/50 dark:focus-visible:ring-emerald-400/30"
      aria-label="추가"
    >
      <LuPlus className="w-6 h-6" />
    </button>
  )
}
