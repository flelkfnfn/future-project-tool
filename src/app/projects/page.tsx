import { createClient } from "@/lib/supabase/server";
import { addProject, deleteProject } from "./actions";
import AuthGuardForm from "@/components/AuthGuardForm";

// ???섏씠吏???쒕쾭?먯꽌 ?ㅽ뻾?섎?濡? ?섏씠吏媛 ?뚮뜑留??섍린 ?꾩뿉 ?곗씠?곕? 媛?몄삱 ???덉뒿?덈떎.
export default async function ProjectsPage() {
  const supabase = await createClient();
  const { data: projects, error } = await supabase.from("projects").select("id, name");

  if (error) {
    return <p className="text-red-500">?곗씠?곕? 遺덈윭?ㅻ뒗 以??ㅻ쪟媛 諛쒖깮?덉뒿?덈떎.</p>;
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">?꾨줈?앺듃 紐⑸줉</h1>

      {/* ???꾨줈?앺듃 異붽? ??*/}
      <AuthGuardForm action={addProject} className="mb-8 flex gap-2">
        <input
          type="text"
          name="name"
          className="border rounded px-2 py-1 flex-grow"
          placeholder="???꾨줈?앺듃 ?대쫫..."
          required
        />
        <button
          type="submit"
          className="bg-blue-500 text-white px-4 py-1 rounded hover:bg-blue-600"
        >
          異붽?
        </button>
      </AuthGuardForm>

      {projects.length > 0 ? (
        <ul className="space-y-2">
          {projects.map((project) => (
            <li key={project.id} className="p-4 border rounded-md shadow-sm flex justify-between items-center">
              <span className="text-lg">{project.name}</span>
              <AuthGuardForm action={deleteProject}>
                <input type="hidden" name="id" value={project.id} />
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
        <p className="mt-4">?꾩쭅 ?앹꽦???꾨줈?앺듃媛 ?놁뒿?덈떎.</p>
      )}
    </div>
  );
}


