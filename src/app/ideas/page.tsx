import { createClient } from "@/lib/supabase/server";
import { deleteIdea, addComment, toggleLike } from "./actions";
import AuthGuardForm from "@/components/AuthGuardForm";

type Comment = { id: number; content: string; created_at: string; user_id: string }
// If likes is an array of user IDs, update the type:
type Idea = { id: number; title: string; description: string; likes: string[]; comments: Comment[] }

export default async function IdeasPage() {
  const supabase = await createClient();

  // Fetch ideas and their comments
  const { data: ideas, error } = await supabase
    .from("ideas")
    .select("id, title, description, likes, comments(id, content, created_at, user_id)") // Select comments, use 'likes'
    .order("created_at", { ascending: false }); // Order ideas by creation date

  if (error) {
    console.error("아이디어 데이터를 불러오는 중 오류:", error);
    return <p className="text-red-500">아이디어를 불러오는 중 오류가 발생했습니다.</p>;
  }

  const ideasList = (ideas as unknown as Idea[]) || []

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">아이디어 목록</h1>

      {/* 아이디어 추가 폼 */}
      {/* 추가는 전역 + 버튼 모달 사용 */}

      {ideasList.length > 0 ? (
        <ul className="mt-4 space-y-4">
          {ideasList.map((idea: Idea) => (
            <li key={idea.id} className="p-4 border rounded-md shadow-sm"> {/* Removed flex justify-between items-center from here */}
              <div className="flex justify-between items-start"> {/* Added this div for layout */}
                <div>
                  <h2 className="text-xl font-semibold">{idea.title}</h2>
                  <p className="mt-2 text-gray-700">{idea.description}</p>
                </div>
                <AuthGuardForm action={deleteIdea}>
                  <input type="hidden" name="id" value={idea.id} />
                  <button
                    type="submit"
                    className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
                  >
                    삭제
                  </button>
                </AuthGuardForm>
              </div>

              {/* 좋아요 버튼 */}
              <div className="mt-4 flex items-center gap-2">
                <AuthGuardForm action={toggleLike}>
                  <input type="hidden" name="idea_id" value={idea.id} />
                  <button
                    type="submit"
                    className="bg-purple-500 text-white px-3 py-1 rounded hover:bg-purple-600"
                  >
                    {/* 좋아요 개수 표시 */}
                    좋아요({idea.likes.length})
                  </button>
                </AuthGuardForm>
              </div>

              {/* ?볤? ?뱀뀡 */}
              <div className="mt-4 border-t pt-4">
                <h3 className="text-lg font-medium mb-2">댓글</h3>
                {idea.comments && idea.comments.length > 0 ? (
                  <ul className="space-y-2 text-sm">
                    {idea.comments.map((comment: Comment) => (
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
                <AuthGuardForm action={addComment} className="mt-4 flex gap-2">
                  <input type="hidden" name="idea_id" value={idea.id} />
                  <textarea
                    name="content"
                    className="border rounded px-2 py-1 flex-grow"
                    placeholder="댓글을 입력해주세요..."
                    rows={1}
                    required
                  ></textarea>
                  <button
                    type="submit"
                    className="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600"
                  >
                    댓글 추가
                  </button>
                </AuthGuardForm>
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


