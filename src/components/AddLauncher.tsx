'use client';
import { LuPlus } from 'react-icons/lu';

export default function AddLauncher({ onOpen }: { onOpen: () => void }) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="glass-fab glass-fab--accent"
      aria-label="추가"
    >
      <LuPlus className="w-6 h-6" />
    </button>
  )
}
