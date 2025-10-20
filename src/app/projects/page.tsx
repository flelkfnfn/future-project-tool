import { createClient } from "@/lib/supabase/server";
import { addProject, deleteProject } from "./actions";

// 이 페이지는 서버에서 실행되므로, 페이지가 렌더링 되기 전에 데이터를 가져올 수 있습니다.
export default async function ProjectsPage() {
  const supabase = await createClient();
  const { data: projects, error } = await supabase.from("projects").select("id, name");

  if (error) {
    return <p className="text-red-500">데이터를 불러오는 중 오류가 발생했습니다.</p>;
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">프로젝트 목록</h1>

      {/* 새 프로젝트 추가 폼 */}
      <form action={addProject} className="mb-8 flex gap-2">
        <input
          type="text"
          name="name"
          className="border rounded px-2 py-1 flex-grow"
          placeholder="새 프로젝트 이름..."
          required
        />
        <button
          type="submit"
          className="bg-blue-500 text-white px-4 py-1 rounded hover:bg-blue-600"
        >
          추가
        </button>
      </form>

      {projects.length > 0 ? (
        <ul className="space-y-2">
          {projects.map((project) => (
            <li key={project.id} className="p-4 border rounded-md shadow-sm flex justify-between items-center">
              <span className="text-lg">{project.name}</span>
              <form action={deleteProject}>
                <input type="hidden" name="id" value={project.id} />
                <button
                  type="submit"
                  className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
                >
                  삭제
                </button>
              </form>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-4">아직 생성된 프로젝트가 없습니다.</p>
      )}
    </div>
  );
}
