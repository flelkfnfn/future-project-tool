import { createServiceClient } from "@/lib/supabase/service";
import ProjectCard from "@/components/ProjectCard";
import { unstable_noStore as noStore } from 'next/cache';

type ProjectLink = { id: number; url: string; title: string; project_id: number };
type Project = { id: number; name: string; project_links: ProjectLink[] };

export default async function ProjectsPage() {
  noStore();
  const supabase = createServiceClient();
  const { data: projectsData, error: projectsError } = await supabase
    .from("projects")
    .select("id, name")
    .order("id", { ascending: false });

  if (projectsError) {
    console.error("Error fetching projects:", projectsError);
    return (
      <div className="flex justify-center items-center h-full">
        <p className="text-red-500">
          프로젝트를 불러오는 중 오류가 발생했습니다.
        </p>
      </div>
    );
  }

  const { data: linksData, error: linksError } = await supabase
    .from("project_links")
    .select("*");

  if (linksError) {
    console.error("Error fetching project links:", linksError);
    // Not returning an error here, as we can still display projects
  }

  const projects: Project[] = (projectsData || []).map((project: { id: number; name: string }) => {
    const projectLinks = (linksData as ProjectLink[] || []).filter(link => Number(link.project_id) === Number(project.id));
    return {
      id: project.id,
      name: project.name,
      project_links: projectLinks,
    };
  });


  return (
    <div className="h-full flex flex-col">
      <h1 className="text-3xl font-bold mb-6 px-4">프로젝트</h1>
      <div className="flex-grow overflow-x-auto pb-4">
        <div className="flex space-x-4 px-4">
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
                  새로운 프로젝트를 추가해보세요.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
