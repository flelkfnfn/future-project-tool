import { createClient } from "@/lib/supabase/server";
import { addEvent } from "./actions";

export default async function CalendarPage() {
  const supabase = await createClient();
  const { data: events, error } = await supabase.from("calendar_events").select("id, title, description, event_date");

  if (error) {
    return <p className="text-red-500">데이터를 불러오는 중 오류가 발생했습니다.</p>;
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">캘린더</h1>

      {/* 새 이벤트 추가 폼 */}
      <form action={addEvent} className="mb-8 flex flex-col gap-2">
        <input
          type="text"
          name="title"
          className="border rounded px-2 py-1 flex-grow"
          placeholder="이벤트 제목..."
          required
        />
        <textarea
          name="description"
          className="border rounded px-2 py-1 flex-grow"
          placeholder="이벤트 설명..."
          rows={2}
        ></textarea>
        <input
          type="date"
          name="event_date"
          className="border rounded px-2 py-1 flex-grow"
          required
        />
        <button
          type="submit"
          className="bg-blue-500 text-white px-4 py-1 rounded hover:bg-blue-600 self-start"
        >
          이벤트 추가
        </button>
      </form>

      {events.length > 0 ? (
        <ul className="mt-4 space-y-4">
          {events.map((event) => (
            <li key={event.id} className="p-4 border rounded-md shadow-sm">
              <h2 className="text-xl font-semibold">{event.title}</h2>
              <p className="mt-2 text-gray-700">{event.description}</p>
              <p className="mt-2 text-sm text-gray-500">날짜: {event.event_date}</p>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-4">아직 등록된 일정이 없습니다.</p>
      )}
    </div>
  );
}
