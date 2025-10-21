import { createClient } from "@/lib/supabase/server";
import { addProject, deleteProject } from "./actions";
import AuthGuardForm from "@/components/AuthGuardForm";

type Project = { id: number; name: string }\n\nexport default async function ProjectsPage() {
  const supabase = await createClient();
  const { data: projects, error } = await supabase.from("projects").select("id, name");

  if (error) {
    return <p className="text-red-500">프로젝트를 불러오는 중 오류가 발생했습니다.</p>;
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">프로젝트 목록</h1>

      {/* 프로젝트 목록 */}
      <AuthGuardForm action={addProject} className="mb-8 flex gap-2">
        <input
          type="text"
          name="name"
          className="border rounded px-2 py-1 flex-grow"
          placeholder="프로젝트 이름..."
          required
        />
        <button
          type="submit"
          className="bg-blue-500 text-white px-4 py-1 rounded hover:bg-blue-600"
        >
          추가
        </button>
      </AuthGuardForm>

      {((projects as unknown as Project[]) ?? []).length > 0 ? (
        <ul className="space-y-2">
          {((projects as unknown as Project[]) ?? []).map((project: Project) => (
            <li key={project.id} className="p-4 border rounded-md shadow-sm flex justify-between items-center">
              <span className="text-lg">{project.name}</span>
              <AuthGuardForm action={deleteProject} confirmMessage="정말 삭제하시겠습니까?">
                <input type="hidden" name="id" value={project.id} />
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
        <p className="mt-4">업로드된 파일이 없습니다.</p>
      )}
    </div>
  );
}



