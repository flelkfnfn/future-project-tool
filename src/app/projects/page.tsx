import { createServiceClient } from "@/lib/supabase/service";
import { createClient as createServerSupabase } from "@/lib/supabase/server";
import ProjectCard from "@/components/ProjectCard";
import { unstable_noStore as noStore } from "next/cache";
import { LuFlaskConicalOff } from "react-icons/lu";

type ProjectLink = {
  id: number;
  url: string;
  title: string;
  project_id: number;
};
type Project = {
  id: number;
  name: string;
  description?: string | null;
  project_links: ProjectLink[];
};

export const runtime = "nodejs";

export default async function ProjectsPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  noStore();
  const params = await searchParams;
  const searchQuery = params?.q || '';
  // Prefer service role for guaranteed read; fallback to anon server client if needed
  const supabase = createServiceClient();

  // Fetch projects with their links in a single query to avoid extra roundtrips
  // First try: embedded relation fetch
  let { data, error } = await supabase
    .from("projects")
    .select("*, project_links (*)")
    .order("id", { ascending: false })
    .limit(100);

  // If the service client fails (e.g., runtime/env constraints), retry with server anon client
  if (error) {
    const sb = await createServerSupabase();
    const retry = await sb
      .from("projects")
      .select("*, project_links (*)")
      .order("id", { ascending: false })
      .limit(100);
    data = retry.data as Project[];
    error = retry.error;
  }

  let projects: Project[] = [];
  if (!error && Array.isArray(data)) {
    projects = data.map((p: Project) => ({
      id: p.id,
      name: p.name,
      description: p.description ?? null,
      project_links: (Array.isArray(p.project_links)
        ? p.project_links
        : []
      ).map((l: ProjectLink) => ({
        id: l.id,
        url: l.url,
        title: l.title,
        project_id: l.project_id,
      })),
    }));
  } else {
    // Fallback: fetch separately without embedding (covers missing relationship config)
    const [{ data: projectsData, error: projectsError }, { data: linksData }] =
      await Promise.all([
        supabase
          .from("projects")
          .select("*")
          .order("id", { ascending: false })
          .limit(100),
        supabase
          .from("project_links")
          .select("id, url, title, project_id")
          .limit(2000),
      ]);

    if (projectsError) {
      const detail = (projectsError as { message?: string })?.message || "";
      return (
        <div className="flex justify-center items-center h-full">
          <div className="text-center">
            <p className="text-red-500">
              프로젝트를 불러오는 중 오류가 발생했습니다.
            </p>
            {process.env.NODE_ENV !== "production" && detail && (
              <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                {String(detail)}
              </p>
            )}
          </div>
        </div>
      );
    }

    const linksArr = (
      Array.isArray(linksData) ? linksData : []
    ) as ProjectLink[];
    // Build lookup map to avoid O(n*m) filtering on large datasets
    const byProject = new Map<number, ProjectLink[]>();
    for (const l of linksArr) {
      const key = Number(l.project_id);
      const list = byProject.get(key);
      if (list) list.push(l);
      else byProject.set(key, [l]);
    }
    projects = (projectsData || []).map((p: Project) => ({
      id: p.id,
      name: p.name,
      description: p.description ?? null,
      project_links: byProject.get(Number(p.id)) ?? [],
    }));
  }

  const filteredProjects = projects.filter(project => {
    const query = searchQuery.toLowerCase();
    const nameMatch = project.name.toLowerCase().includes(query);
    const descMatch = project.description?.toLowerCase().includes(query);
    return nameMatch || descMatch;
  });

  return (
    <div className="h-full flex flex-col">
      <h1 className="text-3xl font-bold mb-4 px-4 text-gray-900 dark:text-gray-100">
        프로젝트
      </h1>
      <div className="px-4 mb-6">
        <form action="/projects" method="GET" className="max-w-sm">
          <div className="relative">
            <input
              type="search"
              name="q"
              defaultValue={searchQuery}
              placeholder="프로젝트 이름 또는 설명으로 검색..."
              className="w-full border dark:border-gray-600 rounded-md pl-3 pr-10 py-2 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:ring-blue-500 focus:border-blue-500"
            />
            <button type="submit" className="absolute right-0 top-0 bottom-0 px-3 flex items-center justify-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-200" aria-label="Search">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                <path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11ZM2 9a7 7 0 1 1 12.452 4.391l3.328 3.329a.75.75 0 1 1-1.06 1.06l-3.329-3.328A7 7 0 0 1 2 9Z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </form>
      </div>
      <section className="mx-4 mb-4 rounded-lg border border-gray-300/80 dark:border-gray-700/70 bg-white dark:bg-gray-900/80 shadow-md ring-1 ring-gray-900/5 dark:ring-white/10">
        <div className="px-4 py-3 border-b border-gray-200/70 dark:border-gray-700/60 bg-gray-50/70 dark:bg-gray-800/60 rounded-lg">
          <h2 className="text-sm font-medium text-gray-700 dark:text-gray-300">
            프로젝트 목록
          </h2>
        </div>

        <div className="project-scroll-container flex items-start space-x-4 px-4 py-4 overflow-x-auto">
          {filteredProjects.length > 0 ? (
            <>
              {filteredProjects.map((project: Project) => (
                <ProjectCard key={project.id} project={project} />
              ))}
            </>
          ) : (
            <div className="flex-shrink-0 w-full flex justify-center items-center">
              <div className="text-center py-24">
                <LuFlaskConicalOff className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-200">
                  {searchQuery ? '검색 결과가 없습니다.' : '아직 생성된 프로젝트가 없습니다.'}
                </h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  {searchQuery ? '다른 검색어로 시도해 보세요.' : '오른쪽 패널에서 프로젝트를 추가해 보세요.'}
                </p>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
