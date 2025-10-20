import { createClient } from "@/lib/supabase/server";
import { addIdea } from "./actions";

export default async function IdeasPage() {
  const supabase = await createClient();
  const { data: ideas, error } = await supabase.from("ideas").select("id, title, description, likes");

  if (error) {
    return <p className="text-red-500">데이터를 불러오는 중 오류가 발생했습니다.</p>;
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">아이디어 모음</h1>

      {/* 새 아이디어 추가 폼 */}
      <form action={addIdea} className="mb-8 flex flex-col gap-2">
        <input
          type="text"
          name="title"
          className="border rounded px-2 py-1 flex-grow"
          placeholder="아이디어 제목..."
          required
        />
        <textarea
          name="description"
          className="border rounded px-2 py-1 flex-grow"
          placeholder="아이디어 설명..."
          rows={4}
        ></textarea>
        <button
          type="submit"
          className="bg-blue-500 text-white px-4 py-1 rounded hover:bg-blue-600 self-start"
        >
          아이디어 추가
        </button>
      </form>

      {ideas.length > 0 ? (
        <ul className="mt-4 space-y-4">
          {ideas.map((idea) => (
            <li key={idea.id} className="p-4 border rounded-md shadow-sm">
              <h2 className="text-xl font-semibold">{idea.title}</h2>
              <p className="mt-2 text-gray-700">{idea.description}</p>
              <p className="mt-2 text-sm text-gray-500">좋아요: {idea.likes}</p>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-4">아직 등록된 아이디어가 없습니다.</p>
      )}
    </div>
  );
}
