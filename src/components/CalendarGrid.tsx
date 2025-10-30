"use client"

import { useMemo, useState } from 'react'
import AuthGuardForm from '@/components/AuthGuardForm'
import { addEvent, deleteEvent, updateEventAssignee } from '@/app/calendar/actions'

type EventItem = { id: number; title: string; description: string | null; event_date: string }

function startOfMonth(d: Date) { return new Date(d.getFullYear(), d.getMonth(), 1) }
function endOfMonth(d: Date) { return new Date(d.getFullYear(), d.getMonth() + 1, 0) }
function formatYMD(d: Date) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export default function CalendarGrid({ events }: { events: EventItem[] }) {
  const [current, setCurrent] = useState<Date>(new Date())
  const [editor, setEditor] = useState<{ id: number; description: string } | null>(null)

  const first = startOfMonth(current)
  const last = endOfMonth(current)

  const days = useMemo(() => {
    const res: Date[] = []
    const startWeekday = first.getDay()
    for (let i = 0; i < startWeekday; i++) {
      const d = new Date(first)
      d.setDate(first.getDate() - (startWeekday - i))
      res.push(d)
    }
    for (let d = 1; d <= last.getDate(); d++) {
      res.push(new Date(current.getFullYear(), current.getMonth(), d))
    }
    while (res.length % 7 !== 0 || res.length < 42) {
      const d = new Date(res[res.length - 1])
      d.setDate(d.getDate() + 1)
      res.push(d)
    }
    return res
  }, [current, first, last])

  const eventsByDate = useMemo(() => {
    const map = new Map<string, EventItem[]>()
    for (const e of events) {
      const key = e.event_date.slice(0, 10)
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(e)
    }
    return map
  }, [events])

  const monthLabel = current.toLocaleString('ko-KR', { year: 'numeric', month: 'long' })
  const weekdaysKo = ['일', '월', '화', '수', '목', '금', '토']

  return (
    <div className="bg-white dark:bg-gray-800 rounded-md border dark:border-gray-700">
      <div className="flex items-center justify-between p-3 border-b dark:border-gray-700">
        <button className="px-3 py-1 rounded bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600" onClick={() => setCurrent(new Date(current.getFullYear(), current.getMonth() - 1, 1))}>이전 달</button>
        <h2 className="text-lg font-semibold">{monthLabel}</h2>
        <button className="px-3 py-1 rounded bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600" onClick={() => setCurrent(new Date(current.getFullYear(), current.getMonth() + 1, 1))}>다음 달</button>
      </div>
      <div className="grid grid-cols-7 text-center text-sm text-gray-600 dark:text-gray-400 border-b dark:border-gray-700">
        {weekdaysKo.map((w, i) => (
          <div key={w} className={`py-2 ${i === 0 ? 'text-rose-600 dark:text-rose-400' : ''} ${i === 6 ? 'text-sky-600 dark:text-sky-400' : ''}`}>{w}</div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {days.map((d, idx) => {
          const inMonth = d.getMonth() === current.getMonth()
          const isToday = formatYMD(d) === formatYMD(new Date())
          const key = formatYMD(d)
          const list = eventsByDate.get(key) || []
          const dow = d.getDay()
          const isSun = dow === 0
          const isSat = dow === 6
          const weekendBg = isSun ? 'bg-rose-50 dark:bg-rose-900/20' : isSat ? 'bg-sky-50 dark:bg-sky-900/20' : ''
          return (
            <div key={idx} className={`min-h-28 p-2 border dark:border-gray-700 -mt-px -ml-px min-w-0 overflow-hidden ${inMonth ? `${weekendBg || 'bg-white dark:bg-gray-800'}` : 'bg-gray-100 dark:bg-gray-900 text-gray-300 dark:text-gray-600 opacity-70'}`}>
              <div className={`inline-block px-2 py-0.5 rounded text-xs ${isToday ? 'bg-blue-500 text-white' : inMonth ? (isSun ? 'text-rose-600 dark:text-rose-400' : isSat ? 'text-sky-600 dark:text-sky-400' : 'text-gray-700 dark:text-gray-300') : 'text-gray-400 dark:text-gray-500'}`}>{d.getDate()}</div>
              <div className="mt-2 flex flex-col gap-1 min-w-0">
                {list.map((e) => (
                  <div key={e.id} className="text-xs bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 px-2 py-1 rounded flex justify-between items-center cursor-pointer" title={e.description ? `담당: ${e.description}` : undefined} onClick={() => setEditor({ id: e.id, description: e.description ?? '' })}>
                    <span className="truncate">{e.title}</span>
                    <AuthGuardForm action={deleteEvent} confirmMessage="일정을 삭제하시겠습니까?">
                      <input type="hidden" name="id" value={e.id} />
                      <button type="submit" className="text-rose-600 hover:text-rose-700 dark:text-rose-400 dark:hover:text-rose-300 ml-2" onClick={(ev) => ev.stopPropagation()}>X</button>
                    </AuthGuardForm>
                  </div>
                ))}
              </div>
              <div className="mt-2">
                <AuthGuardForm action={addEvent} className="flex gap-1 min-w-0 items-stretch">
                  <input type="hidden" name="event_date" value={key} />
                  <input
                    name="title"
                    placeholder="제목"
                    className="border dark:border-gray-600 rounded-md px-2 py-1 text-xs flex-1 min-w-0 w-full bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:ring-blue-500 focus:border-blue-500"
                    required
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        ;(e.currentTarget.form as HTMLFormElement | null)?.requestSubmit()
                      }
                    }}
                  />
                  
                </AuthGuardForm>
              </div>
            </div>
          )
        })}
      </div>
      {editor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg w-[28rem] max-w-[90vw] p-5 relative">
            <button className="absolute right-4 top-4 text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200" onClick={() => setEditor(null)} aria-label="닫기">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <h3 className="text-lg font-semibold mb-3 text-gray-900 dark:text-gray-100">담당자 설정</h3>
            <AuthGuardForm action={updateEventAssignee} onSubmit={() => setEditor(null)} className="flex flex-col gap-3">
              <input type="hidden" name="id" value={editor.id} />
              <input
                name="description"
                defaultValue={editor.description}
                placeholder="담당자 입력"
                className="border dark:border-gray-600 rounded-md px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                autoFocus
              />
              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setEditor(null)} className="px-3 py-1 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">취소</button>
                <button type="submit" className="px-3 py-1 rounded-md bg-blue-600 hover:bg-blue-700 text-white">저장</button>
              </div>
            </AuthGuardForm>
          </div>
        </div>
      )}
    </div>
  )
}




