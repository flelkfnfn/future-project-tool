'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

type User = {
  id: string
  username: string
}

export default function CreateChatRoomModal({ onClose }: { onClose: () => void }) {
  const router = useRouter()
  const [users, setUsers] = useState<User[]>([])
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([])
  const [roomName, setRoomName] = useState('')
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchUsers() {
      try {
        const res = await fetch('/api/users')
        const data = await res.json()
        if (data.ok) {
          setUsers(data.users)
        }
      } catch (e) {
        console.error('Failed to fetch users', e)
      }
    }
    fetchUsers()
  }, [])

  const handleUserToggle = (userId: string) => {
    setSelectedUserIds(prev =>
      prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!roomName.trim() || selectedUserIds.length === 0) {
      setError('채팅방 이름과 최소 한 명 이상의 멤버를 선택해야 합니다.')
      return
    }
    setPending(true)
    setError(null)
    try {
      const res = await fetch('/api/chat/rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: roomName, member_ids: selectedUserIds }),
      })
      const data = await res.json()
      if (!res.ok || !data.ok) {
        throw new Error(data.error || 'Failed to create room')
      }
      router.refresh()
      onClose()
    } catch (err: unknown) {
      if (err instanceof Error) {
    setError(err.message)
  } else {
    setError('알 수 없는 오류가 발생했습니다.')
  }
}

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg w-[32rem] max-w-[90vw] p-6 relative">
        <button className="absolute right-4 top-4 text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200" onClick={onClose} aria-label="닫기">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">새 채팅방 생성</h3>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="roomName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">채팅방 이름</label>
            <input
              id="roomName"
              type="text"
              value={roomName}
              onChange={e => setRoomName(e.target.value)}
              className="border dark:border-gray-600 rounded-md px-3 py-2 w-full bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              required
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">멤버 초대</label>
            <div className="max-h-60 overflow-y-auto border dark:border-gray-600 rounded-md p-2 space-y-2">
              {users.map(user => (
                <div key={user.id} className="flex items-center">
                  <input
                    type="checkbox"
                    id={`user-${user.id}`}
                    checked={selectedUserIds.includes(user.id)}
                    onChange={() => handleUserToggle(user.id)}
                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <label htmlFor={`user-${user.id}`} className="ml-3 block text-sm text-gray-900 dark:text-gray-100">
                    {user.username}
                  </label>
                </div>
              ))}
            </div>
          </div>
          {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
          <div className="flex justify-end gap-3">
            <button type="button" className="px-4 py-2 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700" onClick={onClose} disabled={pending}>
              취소
            </button>
            <button type="submit" className="px-4 py-2 rounded-md bg-blue-600 hover:bg-blue-700 text-white font-semibold transition-colors" disabled={pending}>
              {pending ? '생성 중...' : '생성'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
}