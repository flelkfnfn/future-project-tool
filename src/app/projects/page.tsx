import { createClient } from "@/lib/supabase/server";

// 이 페이지는 서버에서 실행되므로, 페이지가 렌더링 되기 전에 데이터를 가져올 수 있습니다.
export default async function ProjectsPage() {
  const supabase = await createClient();
  const { data: projects, error } = await supabase.from("projects").select("id, name");

  if (error) {
    return <p className="text-red-500">데이터를 불러오는 중 오류가 발생했습니다.</p>;
  }

  return (
    <div>
      <h1 className="text-2xl font-bold">프로젝트 목록</h1>
      {projects.length > 0 ? (
        <ul className="mt-4 space-y-2">
          {projects.map((project) => (
            <li key={project.id} className="p-4 border rounded-md shadow-sm">
              {project.name}
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-4">아직 생성된 프로젝트가 없습니다.</p>
      )}
    </div>
  );
}
