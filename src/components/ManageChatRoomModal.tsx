'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

type Props = {
  roomId: number
  roomName: string
  onClose: () => void
  onAddMembers: () => void
}

export default function ManageChatRoomModal({ roomId, roomName, onClose, onAddMembers }: Props) {
  const router = useRouter()
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleDelete = async () => {
    if (!window.confirm(`'${roomName}' 채팅방을 정말로 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.`)) {
      return
    }
    setPending(true)
    setError(null)
    try {
      const res = await fetch(`/api/chat/rooms/${roomId}`, {
        method: 'DELETE',
      })
      const data = await res.json()
      if (!res.ok || !data.ok) {
        throw new Error(data.error || 'Failed to delete room')
      }
      router.refresh()
      onClose()
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.'
      setError(message)
    } finally {
      setPending(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg w-96 max-w-[90vw] p-6 relative">
        <button className="absolute right-4 top-4 text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200" onClick={onClose} aria-label="닫기">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
          &lsquo;{roomName}&rsquo; 설정
        </h3>        
        {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

        <div className="flex flex-col gap-4">
          <button
            onClick={onAddMembers}
            disabled={pending}
            className="w-full px-4 py-2 rounded-md bg-blue-600 text-white font-semibold transition-colors hover:bg-blue-700 disabled:bg-gray-400"
          >
            멤버 추가
          </button>
          <button
            onClick={handleDelete}
            disabled={pending}
            className="w-full px-4 py-2 rounded-md bg-red-600 text-white font-semibold transition-colors hover:bg-red-700 disabled:bg-gray-400"
          >
            {pending ? '삭제 중...' : '채팅방 삭제'}
          </button>
        </div>
      </div>
    </div>
  )
}
