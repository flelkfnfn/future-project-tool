"use client"

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import AuthGuardForm from "@/components/AuthGuardForm";
import { deleteProject, addLink } from "@/app/projects/actions";
import { useSupabase } from "@/components/supabase-provider";

type ProjectLink = { 
  id: number; 
  url: string; 
  title: string; 
};

type Project = { 
  id: number; 
  name: string; 
  description?: string | null; 
  project_links: ProjectLink[]; 
};

export default function ProjectCard({ project }: { project: Project }) {
  const router = useRouter();
  const { supabase } = useSupabase();

  const [liveProject, setLiveProject] = useState(project);
  const [pending, setPending] = useState(false);
  const [open, setOpen] = useState(true);

  useEffect(() => {
    // 부모 컴포넌트로부터 받은 project prop이 변경될 경우, 로컬 상태를 최신화합니다.
    setLiveProject(project);

    // Supabase Realtime 채널을 구독합니다.
    const channel = supabase
      .channel(`project-card:${project.id}`)
      // 1. 프로젝트 자체의 정보(이름, 설명 등)가 변경되었을 때 감지
      .on(
        'postgres_changes',
        { 
          event: 'UPDATE', 
          schema: 'public', 
          table: 'projects',
          filter: `id=eq.${project.id}`
        },
        (payload) => {
          // 변경된 필드만 로컬 상태에 업데이트합니다.
          setLiveProject(prev => ({ ...prev, ...payload.new }));
        }
      )
      // 2. 이 프로젝트에 새로운 링크가 추가되었을 때 감지
      .on(
        'postgres_changes',
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'project_links', // 실제 링크 테이블 이름으로 가정
          filter: `project_id=eq.${project.id}` 
        },
        (payload) => {
          const newLink = payload.new as ProjectLink;
          setLiveProject(prev => {
            // 중복 추가를 방지합니다.
            if (prev.project_links.some(link => link.id === newLink.id)) {
              return prev;
            }
            return {
              ...prev,
              project_links: [...prev.project_links, newLink]
            };
          });
        }
      )
      // 3. 이 프로젝트의 링크가 삭제되었을 때 감지
      .on(
        'postgres_changes',
        { 
          event: 'DELETE', 
          schema: 'public', 
          table: 'project_links',
          filter: `project_id=eq.${project.id}`
        },
        (payload) => {
          const deletedLink = payload.old as Partial<ProjectLink>;
          setLiveProject(prev => ({
            ...prev,
            project_links: prev.project_links.filter(link => link.id !== deletedLink.id)
          }));
        }
      )
      .subscribe();

    // 컴포넌트가 언마운트될 때 구독을 해제하여 메모리 누수를 방지합니다.
    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, project]);

  const handleAddLink = async (formData: FormData) => {
    setPending(true);
    await addLink(formData);
    // router.refresh()를 남겨두어, 요청을 보낸 사용자에게는 서버와 확실한 동기화를 보장합니다.
    router.refresh();
    setPending(false);
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 w-80 flex-shrink-0 flex flex-col">
      <div className="flex justify-between items-start mb-2">
        <h3 className="font-bold text-lg text-gray-800 dark:text-gray-200">{liveProject.name}</h3>
        <AuthGuardForm action={deleteProject} confirmMessage="프로젝트를 삭제하시겠습니까?">
          <input type="hidden" name="id" value={liveProject.id} />
          <button
            type="submit"
            className="text-gray-400 hover:text-red-500 transition-colors"
            aria-label="프로젝트 삭제"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path
                fillRule="evenodd"
                d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm4 0a1 1 0 012 0v6a1 1 0 11-2 0V8z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </AuthGuardForm>
      </div>

      {liveProject.description && (
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 whitespace-pre-wrap">{liveProject.description}</p>
      )}

      <div className="flex-grow space-y-2">
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">링크 ({liveProject.project_links.length})</span>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="w-8 h-8 rounded-full border dark:border-gray-600 flex items-center justify-center text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            aria-expanded={open}
            aria-controls={`project-links-${liveProject.id}`}
            aria-label={open ? "링크 접기" : "링크 펼치기"}
            title={open ? "링크 접기" : "링크 펼치기"}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={`w-5 h-5 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}>
              <path fillRule="evenodd" d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" />
            </svg>
          </button>
        </div>

        <div
          id={`project-links-${liveProject.id}`}
          className={`grid transition-[grid-template-rows] duration-300 ease-in-out ${
            open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
          }`}
        >
          <div className={`overflow-hidden transition-opacity duration-300 ${open ? "opacity-100" : "opacity-0"}`}>
            {liveProject.project_links && liveProject.project_links.map((link) => (
              <a
                key={link.id}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                title={link.title ? `${link.title} - ${link.url}` : link.url}
                className="block bg-gray-100 dark:bg-gray-700 p-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors mb-2"
              >
                <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{link.title || link.url}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{link.url}</p>
              </a>
            ))}
          </div>
        </div>
      </div>

      <AuthGuardForm action={handleAddLink} className="mt-4 pt-4 border-t dark:border-gray-700 relative">
        {pending && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/70 dark:bg-gray-800/70 rounded-b-lg">
            <div className="h-6 w-6 rounded-full border-4 border-blue-500 border-t-transparent animate-spin" />
          </div>
        )}
        <input type="hidden" name="project_id" value={liveProject.id} />
        <div className="flex flex-col gap-2">
          <input
            name="title"
            placeholder="링크 제목 (선택)"
            className="border dark:border-gray-600 rounded-md px-2 py-1 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
          />
        
          <input
            name="url"
            placeholder="https://..."
            className="border dark:border-gray-600 rounded-md px-2 py-1 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            required
          />
          <button type="submit" className="bg-blue-600 text-white px-3 py-1 rounded-md hover:bg-blue-700 transition-colors text-sm" disabled={pending}>
            링크 추가
          </button>
        </div>
      </AuthGuardForm>
    </div>
  );
}