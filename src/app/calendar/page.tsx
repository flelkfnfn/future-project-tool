import { createClient } from "@/lib/supabase/server";
import CalendarGrid from "@/components/CalendarGrid";

export default async function CalendarPage() {
  const supabase = await createClient();
  const { data: events, error } = await supabase.from("calendar_events").select("id, title, description, event_date");

  if (error) {
    return (
      <div className="flex justify-center items-center h-full">
        <p className="text-red-500">일정을 불러오는 중 오류가 발생했습니다.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">일정 캘린더</h1>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
        <CalendarGrid events={events ?? []} />
      </div>
    </div>
  );
}
