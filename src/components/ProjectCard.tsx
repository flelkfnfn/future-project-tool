'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import AuthGuardForm from "@/components/AuthGuardForm";
import { deleteProject, addLink } from "@/app/projects/actions";

type ProjectLink = { id: number; url: string; title: string };
type Project = { id: number; name: string; description?: string | null; project_links: ProjectLink[] };

export default function ProjectCard({ project }: { project: Project }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  const handleAddLink = async (formData: FormData) => {
    setPending(true);
    await addLink(formData);
    router.refresh();
    setPending(false);
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 w-80 flex-shrink-0 flex flex-col">
      <div className="flex justify-between items-start mb-2">
        <h3 className="font-bold text-lg text-gray-800 dark:text-gray-200">{project.name}</h3>
        <AuthGuardForm
          action={deleteProject}
          confirmMessage="정말 삭제하시겠습니까?"
        >
          <input type="hidden" name="id" value={project.id} />
          <button
            type="submit"
            className="text-gray-400 hover:text-red-500 transition-colors"
            aria-label="프로젝트 삭제"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm4 0a1 1 0 012 0v6a1 1 0 11-2 0V8z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </AuthGuardForm>
      </div>
      {project.description && (
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 whitespace-pre-wrap">
          {project.description}
        </p>
      )}

      <div className="flex-grow space-y-2">

        {project.project_links && project.project_links.map(link => (
          <a
            key={link.id}
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            title={link.title ? `${link.title} — ${link.url}` : link.url}
            className="block bg-gray-100 dark:bg-gray-700 p-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{link.title || link.url}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{link.url}</p>
          </a>
        ))}
      </div>

      <AuthGuardForm action={handleAddLink} className="mt-4 pt-4 border-t dark:border-gray-700 relative">
        {pending && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/70 dark:bg-gray-800/70 rounded-b-lg">
            <div className="h-6 w-6 rounded-full border-4 border-blue-500 border-t-transparent animate-spin" />
          </div>
        )}
        <input type="hidden" name="project_id" value={project.id} />
        <div className="flex flex-col gap-2">
          <input name="title" placeholder="링크 제목 (선택)" className="border dark:border-gray-600 rounded-md px-2 py-1 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100" />
          <input name="url" placeholder="https://..." className="border dark:border-gray-600 rounded-md px-2 py-1 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100" required />
          <button type="submit" className="bg-blue-600 text-white px-3 py-1 rounded-md hover:bg-blue-700 transition-colors text-sm" disabled={pending}>
            링크 추가
          </button>
        </div>
      </AuthGuardForm>
    </div>
  );
}
