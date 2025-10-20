import { createClient } from "@/lib/supabase/server";
import { addIdea, deleteIdea, addComment, toggleLike } from "./actions";

export default async function IdeasPage() {
  const supabase = await createClient();

  // Fetch ideas and their comments
  const { data: ideas, error } = await supabase
    .from("ideas")
    .select("id, title, description, likes, comments(id, content, created_at, user_id)") // Select comments, use 'likes'
    .order("created_at", { ascending: false }); // Order ideas by creation date

  if (error) {
    console.error("아이디어 데이터 로드 오류:", error);
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
            <li key={idea.id} className="p-4 border rounded-md shadow-sm"> {/* Removed flex justify-between items-center from here */}
              <div className="flex justify-between items-start"> {/* Added this div for layout */}
                <div>
                  <h2 className="text-xl font-semibold">{idea.title}</h2>
                  <p className="mt-2 text-gray-700">{idea.description}</p>
                </div>
                <form action={deleteIdea}>
                  <input type="hidden" name="id" value={idea.id} />
                  <button
                    type="submit"
                    className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
                  >
                    삭제
                  </button>
                </form>
              </div>

              {/* 좋아요 기능 */}
              <div className="mt-4 flex items-center gap-2">
                <form action={toggleLike}>
                  <input type="hidden" name="idea_id" value={idea.id} />
                  <button
                    type="submit"
                    className="bg-purple-500 text-white px-3 py-1 rounded hover:bg-purple-600"
                  >
                    좋아요 ({idea.likes})
                  </button>
                </form>
              </div>

              {/* 댓글 섹션 */}
              <div className="mt-4 border-t pt-4">
                <h3 className="text-lg font-medium mb-2">댓글</h3>
                {idea.comments && idea.comments.length > 0 ? (
                  <ul className="space-y-2 text-sm">
                    {idea.comments.map((comment) => (
                      <li key={comment.id} className="bg-gray-100 p-2 rounded">
                        <p>{comment.content}</p>
                        <p className="text-xs text-gray-500">
                          {new Date(comment.created_at).toLocaleString()}
                        </p>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-gray-500">아직 댓글이 없습니다.</p>
                )}

                {/* 댓글 추가 폼 */}
                <form action={addComment} className="mt-4 flex gap-2">
                  <input type="hidden" name="idea_id" value={idea.id} />
                  <textarea
                    name="content"
                    className="border rounded px-2 py-1 flex-grow"
                    placeholder="댓글을 남겨주세요..."
                    rows={1}
                    required
                  ></textarea>
                  <button
                    type="submit"
                    className="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600"
                  >
                    댓글 추가
                  </button>
                </form>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-4">아직 등록된 아이디어가 없습니다.</p>
      )}
    </div>
  );
}
