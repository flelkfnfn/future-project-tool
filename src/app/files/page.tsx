import AuthGuardForm from "@/components/AuthGuardForm";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { uploadFile, deleteFile } from "./actions";

export default async function FilesPage() {
  const supabase = await createClient();
  const { data: files, error } = await supabase.from("files").select("id, name, url");

  if (error) {
    console.error("?뚯씪 ?곗씠??濡쒕뱶 ?ㅻ쪟:", error); // Log the error to the server console
    return (
      <div className="text-red-500 p-4 border border-red-700 rounded">
        <p>?곗씠?곕? 遺덈윭?ㅻ뒗 以??ㅻ쪟媛 諛쒖깮?덉뒿?덈떎.</p>
        <p className="text-sm mt-2">?ㅻ쪟 ?곸꽭: {error.message}</p> {/* Display error message */}
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">?뚯씪 怨듭쑀 怨듦컙</h1>

      {/* ?뚯씪 ?낅줈????*/}
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
          ?뚯씪 ?낅줈??
        </button>
      </AuthGuardForm>

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
                  ?ㅼ슫濡쒕뱶
                </Link>
                <AuthGuardForm action={deleteFile}>
                  <input type="hidden" name="id" value={file.id} />
                  <input type="hidden" name="url" value={file.url} />
                  <button
                    type="submit"
                    className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
                  >
                    ??젣
                  </button>
                </AuthGuardForm>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-4">?꾩쭅 怨듭쑀???뚯씪???놁뒿?덈떎.</p>
      )}
    </div>
  );
}

