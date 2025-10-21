import { createClient } from "@/lib/supabase/server";
import CalendarGrid from "@/components/CalendarGrid";

export default async function CalendarPage() {
  const supabase = await createClient();
  const { data: events, error } = await supabase.from("calendar_events").select("id, title, description, event_date");

  if (error) {
    return <p className="text-red-500">일정을 불러오는 중 오류가 발생했습니다.</p>;
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">일정 캘린더</h1>
      <CalendarGrid events={events ?? []} />
    </div>
  );
}
