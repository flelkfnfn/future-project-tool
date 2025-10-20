import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { uploadFile, deleteFile } from "./actions";

export default async function FilesPage() {
  const supabase = await createClient();
  const { data: files, error } = await supabase.from("files").select("id, name, url");

  if (error) {
    return <p className="text-red-500">데이터를 불러오는 중 오류가 발생했습니다.</p>;
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">파일 공유 공간</h1>

      {/* 파일 업로드 폼 */}
      <form action={uploadFile} className="mb-8 flex flex-col gap-2">
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
      </form>

      {files.length > 0 ? (
        <ul className="mt-4 space-y-4">
          {files.map((file) => (
            <li key={file.id} className="p-4 border rounded-md shadow-sm flex justify-between items-center">
              <span className="text-lg">{file.name}</span>
              <div className="flex gap-2">
                <Link
                  href={file.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600"
                >
                  다운로드
                </Link>
                <form action={deleteFile}>
                  <input type="hidden" name="id" value={file.id} />
                  <input type="hidden" name="url" value={file.url} />
                  <button
                    type="submit"
                    className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
                  >
                    삭제
                  </button>
                </form>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-4">아직 공유된 파일이 없습니다.</p>
      )}
    </div>
  );
}
