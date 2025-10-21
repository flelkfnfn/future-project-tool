'use client'

import { useMemo, useState } from 'react'
import AuthGuardForm from '@/components/AuthGuardForm'
import { addEvent, deleteEvent } from '@/app/calendar/actions'

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

  const first = startOfMonth(current)
  const last = endOfMonth(current)

  const days = useMemo(() => {
    const res: Date[] = []
    const startWeekday = (first.getDay() + 6) % 7 // Monday=0
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
  const weekdays = ['월', '화', '수', '목', '금', '토', '일']

  return (
    <div className="bg-white rounded-md border">
      <div className="flex items-center justify-between p-3 border-b">
        <button className="px-3 py-1 rounded bg-gray-100 hover:bg-gray-200" onClick={() => setCurrent(new Date(current.getFullYear(), current.getMonth() - 1, 1))}>이전</button>
        <h2 className="text-lg font-semibold">{monthLabel}</h2>
        <button className="px-3 py-1 rounded bg-gray-100 hover:bg-gray-200" onClick={() => setCurrent(new Date(current.getFullYear(), current.getMonth() + 1, 1))}>다음</button>
      </div>
      <div className="grid grid-cols-7 text-center text-sm text-gray-600 border-b">
        {weekdays.map((w) => (
          <div key={w} className="py-2">{w}</div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {days.map((d, idx) => {
          const inMonth = d.getMonth() === current.getMonth()
          const isToday = formatYMD(d) === formatYMD(new Date())
          const key = formatYMD(d)
          const list = eventsByDate.get(key) || []
          return (
            <div key={idx} className={`min-h-28 p-2 border -mt-px -ml-px ${inMonth ? 'bg-white' : 'bg-gray-50 text-gray-400'}`}>
              <div className={`inline-block px-2 py-0.5 rounded text-xs ${isToday ? 'bg-blue-500 text-white' : 'text-gray-700'}`}>{d.getDate()}</div>
              <div className="mt-2 flex flex-col gap-1">
                {list.map((e) => (
                  <div key={e.id} className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded flex justify-between items-center">
                    <span className="truncate">{e.title}</span>
                    <AuthGuardForm action={deleteEvent} confirmMessage="정말 삭제하시겠습니까?">
                      <input type="hidden" name="id" value={e.id} />
                      <button type="submit" className="text-rose-600 hover:text-rose-700 ml-2">삭제</button>
                    </AuthGuardForm>
                  </div>
                ))}
              </div>
              <div className="mt-2">
                <AuthGuardForm action={addEvent} className="flex gap-1">
                  <input type="hidden" name="event_date" value={key} />
                  <input
                    name="title"
                    placeholder="제목"
                    className="border rounded px-1 py-0.5 text-xs flex-1"
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
    </div>
  )
}

