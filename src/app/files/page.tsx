import AuthGuardForm from "@/components/AuthGuardForm";
import { createClient } from "@/lib/supabase/server";
import { uploadFile, deleteFile, downloadFile } from "./actions";

type FileItem = { id: number; name: string; url: string }

export default async function FilesPage() {
  const supabase = await createClient();
  const { data: files, error } = await supabase.from("files").select("id, name, url");

  if (error) {
    console.error("파일 목록을 가져오는 중 오류 발생:", error);
    return (
      <div className="text-red-500 p-4 border border-red-700 rounded">
        <p>파일을 불러오는 중 오류가 발생했습니다.</p>
        <p className="text-sm mt-2">오류 상세: {error.message}</p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">파일 관리</h1>

      {/* 파일 업로드 폼 */}
      <AuthGuardForm action={uploadFile} className="mb-8 flex flex-col gap-2">
        <input
          type="file"
          name="file"
          className="border rounded px-2 py-1 flex-grow"
          required
        />
        <button
          type="submit"
          className="bg-blue-500 text-white px-4 py-1 rounded hover:bg-blue-600 self-start"
        >
          파일 업로드
        </button>
      </AuthGuardForm>

      {(files as unknown as FileItem[]) && (files as unknown as FileItem[]).length > 0 ? (
        <ul className="mt-4 space-y-4">
          {(files as unknown as FileItem[]).map((file: FileItem) => (
            <li key={file.id} className="p-4 border rounded-md shadow-sm flex justify-between items-center">
              <span className="text-lg">{file.name}</span>
              <div className="flex gap-2">
                <form action={downloadFile}>
                  <input type="hidden" name="fileUrl" value={file.url} />
                  <button
                    type="submit"
                    className="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600"
                  >
                  다운로드
                </button>
                </form>
                <AuthGuardForm action={deleteFile} confirmMessage="정말 삭제하시겠습니까?">
                  <input type="hidden" name="id" value={file.id} />
                  <input type="hidden" name="fileUrl" value={file.url} />
                  <button
                    type="submit"
                    className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
                  >
                    삭제
                  </button>
                </AuthGuardForm>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-4">업로드된 파일이 없습니다.</p>
      )}
    </div>
  );
}
