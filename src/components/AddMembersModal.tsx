'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

type User = {
  id: string
  username: string
}

type Member = {
  user_id: string
}

type Props = {
  roomId: number
  roomName: string
  onClose: () => void
}

export default function AddMembersModal({ roomId, roomName, onClose }: Props) {
  const router = useRouter()
  const [allUsers, setAllUsers] = useState<User[]>([])
  const [currentMemberIds, setCurrentMemberIds] = useState<string[]>([])
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([])
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchData() {
      try {
        const [usersRes, membersRes] = await Promise.all([
          fetch('/api/users'),
          fetch(`/api/chat/rooms/${roomId}/members`),
        ])
        const usersData = await usersRes.json()
        const membersData = await membersRes.json()

        if (usersData.ok) {
          setAllUsers(usersData.users)
        }
        if (membersData.ok) {
          setCurrentMemberIds(membersData.members.map((m: Member) => m.user_id))
        }
      } catch (e) {
        console.error('Failed to fetch data', e)
      }
    }
    fetchData()
  }, [roomId])

  const handleUserToggle = (userId: string) => {
    setSelectedUserIds(prev =>
      prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (selectedUserIds.length === 0) {
      setError('추가할 멤버를 선택하세요.')
      return
    }
    setPending(true)
    setError(null)
    try {
      const res = await fetch(`/api/chat/rooms/${roomId}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ member_ids: selectedUserIds }),
      })
      const data = await res.json()
      if (!res.ok || !data.ok) {
        throw new Error(data.error || 'Failed to add members')
      }
      router.refresh()
      onClose()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setPending(false)
    }
  }

  const usersToAdd = allUsers.filter(u => !currentMemberIds.includes(u.id))

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg w-[32rem] max-w-[90vw] p-6 relative">
        <button className="absolute right-4 top-4 text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200" onClick={onClose} aria-label="닫기">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">'{roomName}'에 멤버 추가</h3>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">사용자 선택</label>
            <div className="max-h-60 overflow-y-auto border dark:border-gray-600 rounded-md p-2 space-y-2">
              {usersToAdd.length > 0 ? usersToAdd.map(user => (
                <div key={user.id} className="flex items-center">
                  <input
                    type="checkbox"
                    id={`user-add-${user.id}`}
                    checked={selectedUserIds.includes(user.id)}
                    onChange={() => handleUserToggle(user.id)}
                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <label htmlFor={`user-add-${user.id}`} className="ml-3 block text-sm text-gray-900 dark:text-gray-100">
                    {user.username}
                  </label>
                </div>
              )) : <p className="text-sm text-gray-500">추가할 사용자가 없습니다.</p>}
            </div>
          </div>
          {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
          <div className="flex justify-end gap-3">
            <button type="button" className="px-4 py-2 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700" onClick={onClose} disabled={pending}>
              취소
            </button>
            <button type="submit" className="px-4 py-2 rounded-md bg-blue-600 hover:bg-blue-700 text-white font-semibold transition-colors" disabled={pending}>
              {pending ? '추가 중...' : '추가'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
