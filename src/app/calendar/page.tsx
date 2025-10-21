import AuthGuardForm from "@/components/AuthGuardForm";
import { createClient } from "@/lib/supabase/server";
import { addEvent, deleteEvent } from "./actions";

export default async function CalendarPage() {
  const supabase = await createClient();
  const { data: events, error } = await supabase.from("calendar_events").select("id, title, description, event_date");

  if (error) {
    return <p className="text-red-500">?곗씠?곕? 遺덈윭?ㅻ뒗 以??ㅻ쪟媛 諛쒖깮?덉뒿?덈떎.</p>;
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">일정 관리</h1>

      {/* 일정 추가 폼 */}
      <AuthGuardForm action={addEvent} className="mb-8 flex flex-col gap-2">
        <input
          type="text"
          name="title"
          className="border rounded px-2 py-1 flex-grow"
          placeholder="?대깽???쒕ぉ..."
          required
        />
        <textarea
          name="description"
          className="border rounded px-2 py-1 flex-grow"
          placeholder="?대깽???ㅻ챸..."
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
          ?대깽??異붽?
        </button>
      </AuthGuardForm>

      {events.length > 0 ? (
        <ul className="mt-4 space-y-4">
          {events.map((event) => (
            <li key={event.id} className="p-4 border rounded-md shadow-sm flex justify-between items-center">
              <div>
                <h2 className="text-xl font-semibold">{event.title}</h2>
                <p className="mt-2 text-gray-700">{event.description}</p>
                <p className="mt-2 text-sm text-gray-500">?좎쭨: {event.event_date}</p>
              </div>
              <AuthGuardForm action={deleteEvent}>
                <input type="hidden" name="id" value={event.id} />
                <button
                  type="submit"
                  className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
                >
                  ??젣
                </button>
              </AuthGuardForm>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-4">?꾩쭅 ?깅줉???쇱젙???놁뒿?덈떎.</p>
      )}
    </div>
  );
}

