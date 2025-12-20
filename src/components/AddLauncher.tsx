'use client';
import { LuPlus } from 'react-icons/lu';

export default function AddLauncher({ onOpen }: { onOpen: () => void }) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="glass-fab glass-fab--accent ring-2 ring-[color-mix(in_oklab,var(--ring)_25%,transparent)]"
      aria-label="ì¶”ê?"
    >
      <LuPlus className="w-6 h-6" />
    </button>
  )
}

