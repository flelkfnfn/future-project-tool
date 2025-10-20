import { createClient } from "@/lib/supabase/server";
import { addNotice, deleteNotice } from "./actions";

export default async function NoticesPage() {
  const supabase = await createClient();
  const { data: notices, error } = await supabase.from("notices").select("id, title, content");

  if (error) {
    return <p className="text-red-500">데이터를 불러오는 중 오류가 발생했습니다.</p>;
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">공지사항</h1>

      {/* 새 공지사항 추가 폼 */}
      <form action={addNotice} className="mb-8 flex flex-col gap-2">
        <input
          type="text"
          name="title"
          className="border rounded px-2 py-1 flex-grow"
          placeholder="공지사항 제목..."
          required
        />
        <textarea
          name="content"
          className="border rounded px-2 py-1 flex-grow"
          placeholder="공지사항 내용..."
          rows={4}
        ></textarea>
        <button
          type="submit"
          className="bg-blue-500 text-white px-4 py-1 rounded hover:bg-blue-600 self-start"
        >
          공지 추가
        </button>
      </form>

      {notices.length > 0 ? (
        <ul className="mt-4 space-y-4">
          {notices.map((notice) => (
            <li key={notice.id} className="p-4 border rounded-md shadow-sm flex justify-between items-center">
              <div>
                <h2 className="text-xl font-semibold">{notice.title}</h2>
                <p className="mt-2 text-gray-700">{notice.content}</p>
              </div>
              <form action={deleteNotice}>
                <input type="hidden" name="id" value={notice.id} />
                <button
                  type="submit"
                  className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
                >
                  삭제
                </button>
              </form>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-4">아직 등록된 공지사항이 없습니다.</p>
      )}
    </div>
  );
}
