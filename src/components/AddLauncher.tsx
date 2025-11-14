'use client';
import { LuPlus } from 'react-icons/lu';

export default function AddLauncher({ onOpen }: { onOpen: () => void }) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="w-12 h-12 rounded-full bg-emerald-600 text-white shadow hover:bg-emerald-700 flex items-center justify-center"
      aria-label="추가"
    >
      <LuPlus className="w-6 h-6" />
    </button>
  )
}
