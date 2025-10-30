import AuthGuardForm from "@/components/AuthGuardForm";
import { createClient } from "@/lib/supabase/server";
import { deleteNotice } from "./actions";
import Link from "next/link";
type Notice = { id: number; title: string; content: string };

export default async function NoticesPage() {
  const supabase = await createClient();
  const { data: notices, error } = await supabase
    .from("notices")
    .select("id, title, content")
    .order("id", { ascending: false });

  if (error) {
    return (
      <div className="flex justify-center items-center h-full">
        <p className="text-red-500">
          공지사항을 불러오는 중 오류가 발생했습니다.
        </p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">공지사항</h1>
        <Link href="/send-email" className="inline-flex items-center px-4 py-2 rounded-md bg-emerald-600 text-white hover:bg-emerald-700 transition-colors">
          메일 발송
        </Link>
      </div>
      {((notices as unknown as Notice[]) ?? []).length > 0 ? (
        <ul className="space-y-4">
          {((notices as unknown as Notice[]) ?? []).map((notice: Notice) => (
            <li
              key={notice.id}
              className="bg-white dark:bg-gray-800 p-6 border dark:border-gray-700 rounded-lg shadow-sm hover:shadow-md transition-shadow flex justify-between items-start"
            >
              <div>
                <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200">{notice.title}</h2>
                <p className="mt-2 text-gray-600 dark:text-gray-300 whitespace-pre-wrap">{notice.content}</p>
              </div>
              <AuthGuardForm
                action={deleteNotice}
                confirmMessage="정말 삭제하시겠습니까?"
              >
                <input type="hidden" name="id" value={notice.id} />
                <button
                  type="submit"
                  className="bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600 transition-colors ml-4"
                >
                  삭제
                </button>
              </AuthGuardForm>
            </li>
          ))}
        </ul>
      ) : (
        <div className="text-center py-24">
          <svg
            className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              vectorEffect="non-scaling-stroke"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">아직 등록된 공지사항이 없습니다.</h3>
          <p className="mt-1 text-sm text-gray-500">새로운 공지사항을 추가해보세요.</p>
        </div>
      )}
    </div>
  );
}
