import { createServiceClient } from "@/lib/supabase/service";
import { createClient as createServerSupabase } from "@/lib/supabase/server";
import ProjectCard from "@/components/ProjectCard";
import { unstable_noStore as noStore } from "next/cache";

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

export default async function ProjectsPage() {
  noStore();
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

  return (
    <div className="h-full flex flex-col">
      <h1 className="text-3xl font-bold mb-6 px-4 text-gray-900 dark:text-gray-100">
        프로젝트
      </h1>
      <section className="mx-4 mb-4 rounded-lg border border-gray-300/80 dark:border-gray-700/70 bg-white dark:bg-gray-900/80 shadow-md ring-1 ring-gray-900/5 dark:ring-white/10">
        <div className="px-4 py-3 border-b border-gray-200/70 dark:border-gray-700/60 bg-gray-50/70 dark:bg-gray-800/60 rounded-lg">
          <h2 className="text-sm font-medium text-gray-700 dark:text-gray-300">
            프로젝트 목록
          </h2>
        </div>

        <div className="flex items-start space-x-4 px-4 py-4 min-h-full overflow-x-auto">
          {projects.length > 0 ? (
            <>
              {projects.map((project: Project) => (
                <ProjectCard key={project.id} project={project} />
              ))}
            </>
          ) : (
            <div className="flex-shrink-0 w-full flex justify-center items-center">
              <div className="text-center py-24">
                <svg
                  className="mx-auto h-12 w-12 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    vectorEffect="non-scaling-stroke"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z"
                  />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-200">
                  아직 생성된 프로젝트가 없습니다.
                </h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  오른쪽 패널에서 프로젝트를 추가해 보세요.
                </p>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
