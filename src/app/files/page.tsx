import AuthGuardForm from "@/components/AuthGuardForm";
import { createClient } from "@/lib/supabase/server";
import { uploadFile, deleteFile, downloadFile } from "./actions";

type FileItem = { id: number; name: string; url: string };

export default async function FilesPage() {
  const supabase = await createClient();
  const { data: files, error } = await supabase
    .from("files")
    .select("id, name, url")
    .order("id", { ascending: false })
    .limit(200);

  if (error) {
    console.error("파일 목록을 가져오는 중 오류 발생:", error);
    return (
      <div className="flex justify-center items-center h-full">
        <div className="text-red-500 p-4 border border-red-700 rounded">
          <p>파일을 불러오는 중 오류가 발생했습니다.</p>
          <p className="text-sm mt-2">오류 상세: {error.message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">파일 관리</h1>

      <div className="glass-card p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">파일 업로드</h2>
        <AuthGuardForm
          action={uploadFile}
          className="flex flex-col sm:flex-row gap-4 items-start"
        >
          <div className="flex-grow">
            <input
              type="file"
              name="file"
              className="block w-full text-sm text-gray-700 dark:text-gray-200 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border file:border-slate-200/70 dark:file:border-white/10 file:text-sm file:font-semibold file:bg-white/70 dark:file:bg-white/5 file:text-slate-900 dark:file:text-white hover:file:bg-white/85 dark:hover:file:bg-white/10"
              required
            />
          </div>
          <button
            type="submit"
            className="btn btn-accent px-6"
          >
            업로드
          </button>
        </AuthGuardForm>
      </div>

      {files && files.length > 0 ? (
        <div className="glass-card overflow-hidden">
          <ul className="divide-y divide-slate-200/70 dark:divide-white/10">
            {(files as unknown as FileItem[]).map((file: FileItem) => (
              <li
                key={file.id}
                className="p-4 flex justify-between items-center hover:bg-white/60 dark:hover:bg-white/5 transition-colors"
              >
                <span className="text-lg font-medium text-gray-800 dark:text-gray-200">
                  {file.name}
                </span>
                <div className="flex gap-2">
                  <form action={downloadFile}>
                    <input type="hidden" name="fileUrl" value={file.url} />
                    <button
                      type="submit"
                      className="btn btn-neutral"
                    >
                      다운로드
                    </button>
                  </form>
                  <AuthGuardForm
                    action={deleteFile}
                    confirmMessage="정말 삭제하시겠습니까?"
                  >
                    <input type="hidden" name="id" value={file.id} />
                    <input type="hidden" name="fileUrl" value={file.url} />
                    <button
                      type="submit"
                      className="btn btn-danger"
                    >
                      삭제
                    </button>
                  </AuthGuardForm>
                </div>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <div className="glass-card text-center py-24">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-200">
            업로드된 파일이 없습니다.
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            위의 양식을 사용하여 파일을 업로드하세요.
          </p>
        </div>
      )}
    </div>
  );
}
