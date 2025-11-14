"use client";

import { useMemo, useState } from "react";
import AuthGuardForm from "@/components/AuthGuardForm";
import {
  addEvent,
  deleteEvent,
  updateEventAssignee,
} from "@/app/calendar/actions";

type EventItem = {
  id: number;
  title: string;
  description: string | null;
  event_date: string;
};

function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}
function endOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0);
}
function formatYMD(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

const weekdaysKo = ["일", "월", "화", "수", "목", "금", "토"];

export default function CalendarGrid({ events }: { events: EventItem[] }) {
  const [current, setCurrent] = useState(new Date());
  const [editor, setEditor] = useState<{
    id: number;
    description: string;
  } | null>(null);

  const first = startOfMonth(current);
  const last = endOfMonth(current);

  const days = useMemo(() => {
    const res: Date[] = [];
    const startWeekday = first.getDay();
    for (let i = 0; i < startWeekday; i++) {
      const d = new Date(first);
      d.setDate(first.getDate() - (startWeekday - i));
      res.push(d);
    }
    for (let d = 1; d <= last.getDate(); d++) {
      res.push(new Date(current.getFullYear(), current.getMonth(), d));
    }
    while (res.length % 7 !== 0 || res.length < 42) {
      const d = new Date(res[res.length - 1]);
      d.setDate(d.getDate() + 1);
      res.push(d);
    }
    return res;
  }, [current, first, last]);

  const eventsByDate = useMemo(() => {
    const map = new Map<string, EventItem[]>();
    for (const e of events) {
      const key = e.event_date.slice(0, 10);
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(e);
    }
    return map;
  }, [events]);

  const monthLabel = current.toLocaleString("ko-KR", {
    year: "numeric",
    month: "long",
  });

  return (
    <div className="rounded-md border bg-white dark:border-gray-700 dark:bg-gray-800">
      <div className="flex items-center justify-between border-b p-3 dark:border-gray-700">
        <button
          type="button"
          className="rounded bg-gray-100 px-3 py-1 text-sm font-medium text-gray-700 transition hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600"
          onClick={() =>
            setCurrent(
              new Date(current.getFullYear(), current.getMonth() - 1, 1)
            )
          }
        >
          이전 달
        </button>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          {monthLabel}
        </h2>
        <button
          type="button"
          className="rounded bg-gray-100 px-3 py-1 text-sm font-medium text-gray-700 transition hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600"
          onClick={() =>
            setCurrent(
              new Date(current.getFullYear(), current.getMonth() + 1, 1)
            )
          }
        >
          다음 달
        </button>
      </div>

      <div className="grid grid-cols-7 border-b text-center text-sm text-gray-600 dark:border-gray-700 dark:text-gray-400">
        {weekdaysKo.map((label, idx) => (
          <div
            key={label}
            className={`py-2 ${
              idx === 0
                ? "text-rose-600 dark:text-rose-400"
                : idx === 6
                  ? "text-sky-600 dark:text-sky-400"
                  : ""
            }`}
          >
            {label}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7">
        {days.map((d, idx) => {
          const inMonth = d.getMonth() === current.getMonth();
          const isToday = formatYMD(d) === formatYMD(new Date());
          const key = formatYMD(d);
          const list = eventsByDate.get(key) || [];
          const dow = d.getDay();
          const isSun = dow === 0;
          const isSat = dow === 6;

          const weekendBg = isSun
            ? "bg-rose-50 dark:bg-rose-900/20"
            : isSat
              ? "bg-sky-50 dark:bg-sky-900/20"
              : "";
          const todayRing = isToday
            ? "ring-2 ring-inset ring-blue-400 shadow-lg shadow-blue-200/40 dark:shadow-blue-900/40 bg-blue-50 dark:bg-blue-900/40"
            : "";
          const inMonthBg = weekendBg || "bg-white dark:bg-gray-800";
          const outMonthBg =
            "bg-gray-100/80 dark:bg-gray-900/70 text-gray-400 dark:text-gray-600 opacity-70 border-dashed border-gray-200 dark:border-gray-700";
          const outMonthStyle = !inMonth
            ? {
                backgroundImage:
                  "repeating-linear-gradient(135deg, rgba(148,163,184,0.18) 0, rgba(148,163,184,0.18) 8px, transparent 8px, transparent 16px)",
              }
            : undefined;

          const cellClass = inMonth
            ? `${inMonthBg} ${todayRing}`
            : outMonthBg;
          const dateBadgeClass = isToday
            ? "bg-blue-600 text-white shadow-sm"
            : inMonth
              ? isSun
                ? "text-rose-600 dark:text-rose-400"
                : isSat
                  ? "text-sky-600 dark:text-sky-400"
                  : "text-gray-700 dark:text-gray-200"
              : "bg-gray-200/70 text-gray-500 dark:bg-gray-800/80 dark:text-gray-400";

          return (
            <div
              key={idx}
              className={`relative -ml-px -mt-px min-h-28 min-w-0 overflow-hidden border p-2 dark:border-gray-700 ${cellClass}`}
              style={outMonthStyle}
            >
              <div className="flex items-center gap-2">
                <div
                  className={`inline-block rounded px-2 py-0.5 text-xs font-semibold ${dateBadgeClass}`}
                >
                  {d.getDate()}
                </div>
                {isToday && (
                  <span className="rounded-full bg-blue-500/15 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-blue-600 dark:text-blue-300">
                    오늘
                  </span>
                )}
              </div>

              <div className="mt-2 flex min-w-0 flex-col gap-1">
                {list.map((e) => (
                  <div
                    key={e.id}
                    className="flex cursor-pointer items-center justify-between rounded bg-blue-100 px-2 py-1 text-xs text-blue-700 dark:bg-blue-900/50 dark:text-blue-300"
                    title={e.description ? `메모: ${e.description}` : undefined}
                    onClick={() =>
                      setEditor({ id: e.id, description: e.description ?? "" })
                    }
                  >
                    <span className="truncate">{e.title}</span>
                    <AuthGuardForm
                      action={deleteEvent}
                      confirmMessage="이벤트를 삭제하시겠습니까?"
                    >
                      <input type="hidden" name="id" value={e.id} />
                      <button
                        type="submit"
                        className="ml-2 text-rose-600 transition hover:text-rose-700 dark:text-rose-400 dark:hover:text-rose-300"
                        onClick={(ev) => ev.stopPropagation()}
                      >
                        ×
                      </button>
                    </AuthGuardForm>
                  </div>
                ))}
              </div>

              <div className="mt-2">
                <AuthGuardForm
                  action={addEvent}
                  className="flex min-w-0 items-stretch gap-1"
                >
                  <input type="hidden" name="event_date" value={key} />
                  <input
                    name="title"
                    placeholder="일정"
                    className="w-full flex-1 min-w-0 rounded-md border px-2 py-1 text-xs text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 dark:placeholder-gray-500"
                    required
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        (e.currentTarget.form as HTMLFormElement | null)
                          ?.requestSubmit();
                      }
                    }}
                  />
                </AuthGuardForm>
              </div>
            </div>
          );
        })}
      </div>

      {editor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="relative w-[28rem] max-w-[90vw] rounded-lg bg-white p-5 shadow-lg dark:bg-gray-800">
            <button
              className="absolute right-4 top-4 text-gray-500 transition hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
              onClick={() => setEditor(null)}
              aria-label="닫기"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
            <h3 className="mb-3 text-lg font-semibold text-gray-900 dark:text-gray-100">
              일정 메모 수정
            </h3>
            <AuthGuardForm
              action={updateEventAssignee}
              onSubmit={() => setEditor(null)}
              className="flex flex-col gap-3"
            >
              <input type="hidden" name="id" value={editor.id} />
              <input
                name="description"
                defaultValue={editor.description}
                placeholder="메모를 입력하세요"
                className="rounded-md border px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                autoFocus
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditor(null)}
                  className="rounded-md px-3 py-1 text-gray-700 transition hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="rounded-md bg-blue-600 px-3 py-1 text-white transition hover:bg-blue-700"
                >
                  저장
                </button>
              </div>
            </AuthGuardForm>
          </div>
        </div>
      )}
    </div>
  );
}
