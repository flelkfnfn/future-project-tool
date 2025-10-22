'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function AddModal({ onClose }: { onClose: () => void }) {
  const router = useRouter()
  const [mode, setMode] = useState<'notice' | 'project' | 'idea' | null>(null)
  const [pending, setPending] = useState(false)

  async function submitNotice(form: FormData) {
    setPending(true)
    try {
      const res = await fetch('/api/notices/add', { method: 'POST', body: form })
      if (!res.ok) {
        try { const j = await res.json(); alert(j?.error ? `공지 등록 실패: ${j.error}` : '공지 등록 실패') } catch { alert('공지 등록 실패') }
        return
      }
      router.refresh()
    } catch {
      alert('네트워크 오류로 공지 등록에 실패했습니다.')
    } finally {
      onClose()
      setPending(false)
    }
  }

  async function submitProject(form: FormData) {
    setPending(true)
    try {
      const res = await fetch('/api/projects/add', { method: 'POST', body: form })
      if (!res.ok) {
        try { const j = await res.json(); alert(j?.error ? `프로젝트 등록 실패: ${j.error}` : '프로젝트 등록 실패') } catch { alert('프로젝트 등록 실패') }
        return
      }
      router.refresh()
    } catch {
      alert('네트워크 오류로 프로젝트 등록에 실패했습니다.')
    } finally {
      onClose()
      setPending(false)
    }
  }

  async function submitIdea(form: FormData) {
    setPending(true)
    try {
      const res = await fetch('/api/ideas/add', { method: 'POST', body: form })
      if (!res.ok) {
        try { const j = await res.json(); alert(j?.error ? `아이디어 등록 실패: ${j.error}` : '아이디어 등록 실패') } catch { alert('아이디어 등록 실패') }
        return
      }
      router.refresh()
    } catch {
      alert('네트워크 오류로 아이디어 등록에 실패했습니다.')
    } finally {
      onClose()
      setPending(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
      <div className="bg-white rounded-md shadow-lg w-[28rem] max-w-[90vw] p-4 relative">
        <button className="absolute right-3 top-3 text-gray-500 hover:text-gray-800" onClick={onClose} aria-label="닫기">×</button>
        {!mode ? (
          <div className="flex flex-col gap-3">
            <h3 className="text-lg font-semibold">무엇을 추가할까요?</h3>
            <div className="flex gap-3">
              <button className="px-4 py-2 rounded bg-blue-600 text-white" onClick={() => setMode('notice')}>공지</button>
              <button className="px-4 py-2 rounded bg-indigo-600 text-white" onClick={() => setMode('project')}>프로젝트</button>
              <button className="px-4 py-2 rounded bg-purple-600 text-white" onClick={() => setMode('idea')}>아이디어</button>
            </div>
          </div>
        ) : mode === 'notice' ? (
          <form onSubmit={(e) => { e.preventDefault(); const fd = new FormData(e.currentTarget as HTMLFormElement); submitNotice(fd); }} className="flex flex-col gap-3">
            <h3 className="text-lg font-semibold">공지 추가</h3>
            <input name="title" placeholder="제목" className="border rounded px-2 py-1" required />
            <textarea name="content" placeholder="내용" className="border rounded px-2 py-1" rows={5} />
            <div className="flex justify-end gap-2">
              <button type="button" className="px-3 py-1" onClick={() => setMode(null)}>뒤로</button>
              <button type="submit" className="px-4 py-1 rounded bg-blue-600 text-white" disabled={pending}>등록</button>
            </div>
          </form>
        ) : mode === 'project' ? (
          <form onSubmit={(e) => { e.preventDefault(); const fd = new FormData(e.currentTarget as HTMLFormElement); submitProject(fd); }} className="flex flex-col gap-3">
            <h3 className="text-lg font-semibold">프로젝트 추가</h3>
            <input name="name" placeholder="프로젝트명" className="border rounded px-2 py-1" required />
            <div className="flex justify-end gap-2">
              <button type="button" className="px-3 py-1" onClick={() => setMode(null)}>뒤로</button>
              <button type="submit" className="px-4 py-1 rounded bg-indigo-600 text-white" disabled={pending}>등록</button>
            </div>
          </form>
        ) : (
          <form onSubmit={(e) => { e.preventDefault(); const fd = new FormData(e.currentTarget as HTMLFormElement); submitIdea(fd); }} className="flex flex-col gap-3">
            <h3 className="text-lg font-semibold">아이디어 추가</h3>
            <input name="title" placeholder="제목" className="border rounded px-2 py-1" required />
            <textarea name="description" placeholder="설명(선택)" className="border rounded px-2 py-1" rows={4} />
            <div className="flex justify-end gap-2">
              <button type="button" className="px-3 py-1" onClick={() => setMode(null)}>뒤로</button>
              <button type="submit" className="px-4 py-1 rounded bg-purple-600 text-white" disabled={pending}>등록</button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

