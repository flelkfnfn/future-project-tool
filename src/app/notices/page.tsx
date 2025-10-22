import AuthGuardForm from "@/components/AuthGuardForm";
import { createClient } from "@/lib/supabase/server";
import { deleteNotice } from "./actions";

type Notice = {
  id: number;
  title: string;
  content: string;
};

export default async function NoticesPage() {
  const supabase = await createClient();
  const { data: notices, error } = await supabase
    .from("notices")
    .select("id, title, content")
    .order("id", { ascending: false });

  if (error) {
    return (
      <p className="text-red-500">
        공지사항을 불러오는 중 오류가 발생했습니다.
      </p>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">공지사항</h1>
      {/* 추가는 전역 + 버튼 모달 사용 */}
      {((notices as unknown as Notice[]) ?? []).length > 0 ? (
        <ul className="mt-4 space-y-4">
          {((notices as unknown as Notice[]) ?? []).map((notice: Notice) => (
            <li
              key={notice.id}
              className="p-4 border rounded-md shadow-sm flex justify-between items-center"
            >
              <div>
                <h2 className="text-xl font-semibold">{notice.title}</h2>
                <p className="mt-2 text-gray-700">{notice.content}</p>
              </div>

              <AuthGuardForm
                action={deleteNotice}
                confirmMessage="정말 삭제하시겠습니까?"
              >
                <input type="hidden" name="id" value={notice.id} />
                <button
                  type="submit"
                  className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
                >
                  삭제
                </button>
              </AuthGuardForm>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-4">아직 등록된 공지사항이 없습니다.</p>
      )}
    </div>
  );
}
