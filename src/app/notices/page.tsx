import AuthGuardForm from "@/components/AuthGuardForm";
import { createClient } from "@/lib/supabase/server";
import { addNotice, deleteNotice } from "./actions";

export default async function NoticesPage() {
  const supabase = await createClient();
  const { data: notices, error } = await supabase.from("notices").select("id, title, content");

  if (error) {
    return <p className="text-red-500">?곗씠?곕? 遺덈윭?ㅻ뒗 以??ㅻ쪟媛 諛쒖깮?덉뒿?덈떎.</p>;
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">怨듭??ы빆</h1>

      {/* ??怨듭??ы빆 異붽? ??*/}
      <AuthGuardForm action={addNotice} className="mb-8 flex flex-col gap-2">
        <input
          type="text"
          name="title"
          className="border rounded px-2 py-1 flex-grow"
          placeholder="怨듭??ы빆 ?쒕ぉ..."
          required
        />
        <textarea
          name="content"
          className="border rounded px-2 py-1 flex-grow"
          placeholder="怨듭??ы빆 ?댁슜..."
          rows={4}
        ></textarea>
        <button
          type="submit"
          className="bg-blue-500 text-white px-4 py-1 rounded hover:bg-blue-600 self-start"
        >
          怨듭? 異붽?
        </button>
      </AuthGuardForm>

      {notices.length > 0 ? (
        <ul className="mt-4 space-y-4">
          {notices.map((notice) => (
            <li key={notice.id} className="p-4 border rounded-md shadow-sm flex justify-between items-center">
              <div>
                <h2 className="text-xl font-semibold">{notice.title}</h2>
                <p className="mt-2 text-gray-700">{notice.content}</p>
              </div>
              <AuthGuardForm action={deleteNotice}>
                <input type="hidden" name="id" value={notice.id} />
                <button
                  type="submit"
                  className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
                >
                  ??젣
                </button>
              </AuthGuardForm>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-4">?꾩쭅 ?깅줉??怨듭??ы빆???놁뒿?덈떎.</p>
      )}
    </div>
  );
}

