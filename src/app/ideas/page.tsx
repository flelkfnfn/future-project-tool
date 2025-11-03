import { createClient } from "@/lib/supabase/server";
import { getAuth } from "@/lib/auth/session";
import { deleteIdea, addComment, toggleLike } from "./actions";
import AuthGuardForm from "@/components/AuthGuardForm";
import IdeaComments from "@/components/IdeaComments";

type Comment = { id: number; content: string; created_at: string; user_id: string };
type IdeaLike = { user_id: string };
type Idea = {
  id: number;
  title: string;
  description: string;
  idea_likes: IdeaLike[];
  comments: Comment[];
};

export default async function IdeasPage() {
  const supabase = await createClient();
  const auth = await getAuth();
  // Removed page-load upsert to avoid unnecessary writes and latency.

  const { data: ideas, error } = await supabase
    .from("ideas")
    .select("id, title, description, idea_likes(user_id), comments(id, content, created_at, user_id)")
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) {
    console.error("아이디어 데이터를 불러오는 중 오류:", error);
    return (
      <div className="flex justify-center items-center h-full">
        <p className="text-red-500">아이디어를 불러오는 중 오류가 발생했습니다.</p>
      </div>
    );
  }

  const ideasList = (ideas as unknown as Idea[]) || [];
  const currentUserId = auth.principal?.id ?? null;

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">아이디어 목록</h1>

      {ideasList.length > 0 ? (
        <ul className="space-y-6">
          {ideasList.map((idea: Idea) => {
            const userHasLiked = idea.idea_likes.some(like => like.user_id === currentUserId);
            const likeCount = idea.idea_likes.length;

            return (
              <li key={idea.id} className="bg-white dark:bg-gray-800 p-6 border dark:border-gray-700 rounded-lg shadow-sm hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200">{idea.title}</h2>
                    <p className="mt-2 text-gray-600 dark:text-gray-400 whitespace-pre-wrap">{idea.description}</p>
                  </div>
                  <AuthGuardForm action={deleteIdea} confirmMessage="아이디어를 삭제하시겠습니까?">
                    <input type="hidden" name="id" value={idea.id} />
                    <button
                      type="submit"
                      className="bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600 transition-colors ml-4"
                    >
                      삭제
                    </button>
                  </AuthGuardForm>
                </div>

                <div className="mt-4 flex items-center gap-4">
                  <AuthGuardForm action={toggleLike}>
                    <input type="hidden" name="idea_id" value={idea.id} />
                    <button
                      type="submit"
                      className={`flex items-center gap-2 transition-colors ${
                        userHasLiked
                          ? "text-purple-600 dark:text-purple-400"
                          : "text-gray-500 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400"
                      }`}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.43a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.2-6A2 2 0 0015.56 8H12V4a2 2 0 00-2-2 1 1 0 00-1 1v.667a4 4 0 01-.8 2.4L6.8 7.933a2 2 0 00-.8 1.4z" />
                      </svg>
                      <span>{likeCount}</span>
                    </button>
                  </AuthGuardForm>
                </div>

                
                <IdeaComments comments={idea.comments} ideaId={idea.id} />
              </li>
            );
          })}
        </ul>
      ) : (
        <div className="text-center py-24">
          <svg
            className="mx-auto h-12 w-12 text-gray-400 hover:text-yellow-400 transition-colors"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            {/* 💡 전구 아이콘 */}
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 2a7 7 0 00-7 7c0 2.29 1.063 3.918 2.227 5.083A5.97 5.97 0 008 17h8a5.97 5.97 0 00.773-2.917C17.937 12.918 19 11.29 19 9a7 7 0 00-7-7zm0 18v2m-3 0h6"
            />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-200">아직 등록된 아이디어가 없습니다.</h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">새로운 아이디어를 추가해보세요.</p>
        </div>
      )}
    </div>
  );
}






