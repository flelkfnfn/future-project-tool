import { createClient } from "@/lib/supabase/server";
import { getAuth } from "@/lib/auth/session";
import IdeasGrid from "@/components/IdeasGrid";

type Comment = {
  id: number;
  content: string;
  created_at: string;
  user_id: string;
};
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

  const { data: ideas, error } = await supabase
    .from("ideas")
    .select(
      "id, title, description, idea_likes(user_id), comments(id, content, created_at, user_id)"
    )
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) {
    console.error("아이디어 데이터를 불러올 수 없음:", error);
    return (
      <div className="flex justify-center items-center h-full">
        <p className="text-red-500">
          아이디어를 불러오는 중 오류가 발생했습니다.
        </p>
      </div>
    );
  }

  const ideasList = (ideas as unknown as Idea[]) || [];
  const currentUserId = auth.principal?.id ?? null;

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">아이디어 목록</h1>

      {ideasList.length > 0 ? (
        <IdeasGrid ideas={ideasList} currentUserId={currentUserId} />
      ) : (
        <div className="text-center py-24">
          <svg
            className="mx-auto h-12 w-12 text-gray-400 hover:text-yellow-400 transition-colors"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 2a7 7 0 00-7 7c0 2.29 1.063 3.918 2.227 5.083A5.97 5.97 0 008 17h8a5.97 5.97 0 00.773-2.917C17.937 12.918 19 11.29 19 9a7 7 0 00-7-7zm0 18v2m-3 0h6"
            />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-200">
            등록된 아이디어가 없습니다.
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            새 아이디어를 추가해보세요.
          </p>
        </div>
      )}
    </div>
  );
}
