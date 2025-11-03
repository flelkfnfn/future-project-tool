/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import AuthGuardForm from "@/components/AuthGuardForm";
import { deleteProject, addLink } from "@/app/projects/actions";
import { useSupabase } from "@/components/supabase-provider";

type ProjectLink = { id: number; url: string; title: string };
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

  // ▼▼▼ 상태 저장 로직 수정 ▼▼▼

  const storageKey = `project-card-open-state:${project.id}`;

  // 1. useState는 항상 안전한 기본값(true)으로 시작합니다.
  const [open, setOpen] = useState(true);

  // 2. [로딩용 useEffect] 컴포넌트가 클라이언트에 마운트된 후 *단 한번만* 실행됩니다.
  // localStorage에서 저장된 상태를 '불러와' 현재 상태를 덮어씁니다.
  useEffect(() => {
    const savedState = localStorage.getItem(storageKey);
    if (savedState !== null) {
      setOpen(JSON.parse(savedState));
    }
  }, [storageKey]); // storageKey는 변경되지 않으므로 사실상 한번만 실행됩니다.

  // 3. [저장용 useEffect] 'open' 상태가 변경될 때마다 localStorage에 '저장'합니다.
  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(open));
  }, [open, storageKey]);

  // ▲▲▲ 상태 저장 로직 수정 끝 ▲▲▲

  // 실시간 구독 로직은 그대로 유지
  useEffect(() => {
    setLiveProject(project);
    const channel = supabase.channel(`project-card:${project.id}`);
    // ... (실시간 구독 코드)
    channel
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "projects",
          filter: `id=eq.${project.id}`,
        },
        (payload) => {
          setLiveProject((prev) => ({ ...prev, ...payload.new }));
        }
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "project_links",
          filter: `project_id=eq.${project.id}`,
        },
        (payload) => {
          const newLink = payload.new as ProjectLink;
          setLiveProject((prev) => {
            if (prev.project_links.some((link) => link.id === newLink.id))
              return prev;
            return { ...prev, project_links: [...prev.project_links, newLink] };
          });
        }
      )
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "project_links",
          filter: `project_id=eq.${project.id}`,
        },
        (payload) => {
          const deletedLink = payload.old as Partial<ProjectLink>;
          setLiveProject((prev) => ({
            ...prev,
            project_links: prev.project_links.filter(
              (link) => link.id !== deletedLink.id
            ),
          }));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, project]);

  const handleAddLink = async (formData: FormData) => {
    setPending(true);
    await addLink(formData);
    // 서버 액션이 revalidatePath를 호출하므로 클라이언트에서 refresh는 필요 없습니다.
    // router.refresh();
    setPending(false);
  };

  // 이하 JSX는 변경사항 없음
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 w-80 flex-shrink-0 flex flex-col">
      <div className="flex justify-between items-start mb-2">
        <h3 className="font-bold text-lg text-gray-800 dark:text-gray-200">
          {liveProject.name}
        </h3>
        <AuthGuardForm
          action={deleteProject}
          confirmMessage="프로젝트를 삭제하시겠습니까?"
        >
          <input type="hidden" name="id" value={liveProject.id} />
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

      {liveProject.description && (
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 whitespace-pre-wrap">
          {liveProject.description}
        </p>
      )}

      <div className="space-y-2">
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            링크 ({liveProject.project_links.length})
          </span>
          <button
            type="button"
            onClick={() => setOpen((v: boolean) => !v)}
            className="w-8 h-8 rounded-full border dark:border-gray-600 flex items-center justify-center text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            aria-expanded={open}
            aria-controls={`project-links-${liveProject.id}`}
            aria-label={open ? "링크 접기" : "링크 펼치기"}
            title={open ? "링크 접기" : "링크 펼치기"}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className={`w-5 h-5 transition-transform duration-200 ${
                open ? "rotate-180" : ""
              }`}
            >
              <path
                fillRule="evenodd"
                d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </div>

        <div
          id={`project-links-${liveProject.id}`}
          className={`grid transition-[grid-template-rows] duration-300 ease-in-out ${
            open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
          }`}
        >
          <div
            className={`overflow-hidden transition-opacity duration-300 ${
              open ? "opacity-100" : "opacity-0"
            }`}
          >
            {liveProject.project_links &&
              liveProject.project_links.map((link) => {
                const normalized = normalizeExternalUrl(link.url);
                return (
                  <a
                    key={link.id}
                    href={normalized}
                    target="_blank"
                    rel="noopener noreferrer"
                    title={
                      link.title ? `${link.title} - ${normalized}` : normalized
                    }
                    className="block bg-gray-100 dark:bg-gray-700 p-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors mb-2"
                  >
                    <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">
                      {link.title || normalized}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                      {normalized}
                    </p>
                  </a>
                );
              })}
          </div>
        </div>
      </div>

      <AuthGuardForm
        action={handleAddLink}
        className="mt-4 pt-4 border-t dark:border-gray-700 relative"
      >
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
          <button
            type="submit"
            className="bg-blue-600 text-white px-3 py-1 rounded-md hover:bg-blue-700 transition-colors text-sm"
            disabled={pending}
          >
            링크 추가
          </button>
        </div>
      </AuthGuardForm>
    </div>
  );
}

function normalizeExternalUrl(input: string): string {
  const raw = String(input || "").trim();
  if (!raw) return "#";
  // Already absolute http(s)
  if (/^https?:\/\//i.test(raw)) return raw;
  // Protocol-relative
  if (/^\/\//.test(raw)) return `https:${raw}`;
  const prefixed = `https://${raw.replace(/^\/+/, "")}`;
  try {
    // Validate
    new URL(prefixed);
    return prefixed;
  } catch {
    return "#";
  }
}
