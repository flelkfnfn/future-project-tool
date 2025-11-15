'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { emitLocalDataChange } from '@/components/DataChangeNotifier'
import MotionAwareSpinner from '@/components/ui/MotionAwareSpinner'

export default function AddModal({ onClose }: { onClose: () => void }) {
  const router = useRouter()
  const [mode, setMode] = useState<'notice' | 'project' | 'idea' | null>(null)
  const [pending, setPending] = useState(false)

  async function submitNotice(form: FormData) {
    setPending(true)
    try {
      const res = await fetch('/api/notices/add', { method: 'POST', body: form })
      if (!res.ok) {
        try { 
          const j = await res.json(); 
          toast.error(j?.error ? `공지 등록 실패: ${j.error}` : '공지 등록 실패') 
        } catch { 
          toast.error('공지 등록 실패') 
        }
        return
      }
      emitLocalDataChange({ label: "공지", type: "added" })
      router.refresh()
    } catch {
      toast.error('네트워크 오류로 공지 등록에 실패했습니다.')
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
        try { 
          const j = await res.json(); 
          toast.error(j?.error ? `프로젝트 등록 실패: ${j.error}` : '프로젝트 등록 실패') 
        } catch { 
          toast.error('프로젝트 등록 실패') 
        }
        return
      }
      emitLocalDataChange({ label: "프로젝트", type: "added" })
      router.refresh()
    } catch {
      toast.error('네트워크 오류로 프로젝트 등록에 실패했습니다.')
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
        try { 
          const j = await res.json(); 
          toast.error(j?.error ? `아이디어 등록 실패: ${j.error}` : '아이디어 등록 실패') 
        } catch { 
          toast.error('아이디어 등록 실패') 
        }
        return
      }
      emitLocalDataChange({ label: "아이디어", type: "added" })
      router.refresh()
    } catch {
      toast.error('네트워크 오류로 아이디어 등록에 실패했습니다.')
    } finally {
      onClose()
      setPending(false)
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
        {pending && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-white/70 dark:bg-gray-800/70 rounded-lg">
            <MotionAwareSpinner className="h-8 w-8 rounded-full border-4 border-blue-500 border-t-transparent" />
          </div>
        )}
        {!mode ? (
          <div className="flex flex-col gap-4">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">무엇을 추가할까요?</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <button className="px-4 py-3 rounded-md bg-blue-600 hover:bg-blue-700 text-white font-semibold transition-colors" onClick={() => setMode('notice')}>공지</button>
              <button className="px-4 py-3 rounded-md bg-indigo-600 hover:bg-indigo-700 text-white font-semibold transition-colors" onClick={() => setMode('project')}>프로젝트</button>
              <button className="px-4 py-3 rounded-md bg-purple-600 hover:bg-purple-700 text-white font-semibold transition-colors" onClick={() => setMode('idea')}>아이디어</button>
            </div>
          </div>
        ) : mode === 'notice' ? (
          <form onSubmit={(e) => { e.preventDefault(); const fd = new FormData(e.currentTarget as HTMLFormElement); submitNotice(fd); }} className="flex flex-col gap-4">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">공지 추가</h3>
            <input name="title" placeholder="제목" className="border dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:ring-blue-500 focus:border-blue-500" required />
            <textarea name="content" placeholder="내용" className="border dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:ring-blue-500 focus:border-blue-500" rows={5} />
            <div className="flex justify-end gap-3">
              <button type="button" className="px-4 py-2 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700" onClick={() => setMode(null)}>뒤로</button>
              <button type="submit" className="px-4 py-2 rounded-md bg-blue-600 hover:bg-blue-700 text-white font-semibold transition-colors" disabled={pending}>등록</button>
            </div>
          </form>
        ) : mode === 'project' ? (
          <form onSubmit={(e) => { e.preventDefault(); const fd = new FormData(e.currentTarget as HTMLFormElement); submitProject(fd); }} className="flex flex-col gap-4">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">프로젝트 추가</h3>
            <input name="name" placeholder="프로젝트명" className="border dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:ring-blue-500 focus:border-blue-500" required />
            <textarea name="description" placeholder="설명 (선택)" rows={4} className="border dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:ring-blue-500 focus:border-blue-500" />
            <div className="flex justify-end gap-3">
              <button type="button" className="px-4 py-2 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700" onClick={() => setMode(null)}>뒤로</button>
              <button type="submit" className="px-4 py-2 rounded-md bg-indigo-600 hover:bg-indigo-700 text-white font-semibold transition-colors" disabled={pending}>등록</button>
            </div>
          </form>
        ) : (
          <form onSubmit={(e) => { e.preventDefault(); const fd = new FormData(e.currentTarget as HTMLFormElement); submitIdea(fd); }} className="flex flex-col gap-4">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">아이디어 추가</h3>
            <input name="title" placeholder="제목" className="border dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:ring-blue-500 focus:border-blue-500" required />
            <textarea name="description" placeholder="설명(선택)" className="border dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:ring-blue-500 focus:border-blue-500" rows={4} />
            <div className="flex justify-end gap-3">
              <button type="button" className="px-4 py-2 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700" onClick={() => setMode(null)}>뒤로</button>
              <button type="submit" className="px-4 py-2 rounded-md bg-purple-600 hover:bg-purple-700 text-white font-semibold transition-colors" disabled={pending}>등록</button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

