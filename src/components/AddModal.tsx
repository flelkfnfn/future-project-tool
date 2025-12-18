"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { emitLocalDataChange } from "@/components/DataChangeNotifier";
import MotionAwareSpinner from "@/components/ui/MotionAwareSpinner";

export default function AddModal({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const [mode, setMode] = useState<"notice" | "project" | "idea" | null>(null);
  const [pending, setPending] = useState(false);
  const [noticePollEnabled, setNoticePollEnabled] = useState(false);
  const [noticePollMultiple, setNoticePollMultiple] = useState(false);
  const [noticePollAnonymous, setNoticePollAnonymous] = useState(false);
  const [noticePollAllowChange, setNoticePollAllowChange] = useState(true);
  const [noticePollQuestion, setNoticePollQuestion] = useState("");
  const [noticePollDeadline, setNoticePollDeadline] = useState("");
  const [noticePollOptions, setNoticePollOptions] = useState<string[]>([
    "",
    "",
  ]);

  async function submitNotice(form: FormData) {
    setPending(true);
    try {
      if (noticePollEnabled) {
        const opts = noticePollOptions
          .map((s) => String(s ?? "").trim())
          .filter(Boolean);
        if (opts.length < 2) {
          toast.error("Poll needs at least 2 options.");
          return;
        }

        let deadline: string | null = null;
        if (noticePollDeadline && String(noticePollDeadline).trim()) {
          try {
            const d = new Date(String(noticePollDeadline));
            if (!Number.isNaN(d.getTime())) deadline = d.toISOString();
          } catch {}
        }

        form.set(
          "poll",
          JSON.stringify({
            enabled: true,
            question: noticePollQuestion.trim()
              ? noticePollQuestion.trim()
              : null,
            multiple: noticePollMultiple,
            anonymous: noticePollAnonymous,
            allowChange: noticePollAllowChange,
            deadline,
            options: opts,
          })
        );
      } else {
        form.delete("poll");
      }

      const res = await fetch("/api/notices/add", {
        method: "POST",
        body: form,
      });
      if (!res.ok) {
        try {
          const j = await res.json();
          toast.error(
            j?.error ? `공지 등록 실패: ${j.error}` : "공지 등록 실패"
          );
        } catch {
          toast.error("공지 등록 실패");
        }
        return;
      }
      emitLocalDataChange({ label: "공지", type: "added" });
      router.refresh();
    } catch {
      toast.error("네트워크 오류로 공지 등록에 실패했습니다.");
    } finally {
      onClose();
      setPending(false);
    }
  }

  async function submitProject(form: FormData) {
    setPending(true);
    try {
      const res = await fetch("/api/projects/add", {
        method: "POST",
        body: form,
      });
      if (!res.ok) {
        try {
          const j = await res.json();
          toast.error(
            j?.error ? `프로젝트 등록 실패: ${j.error}` : "프로젝트 등록 실패"
          );
        } catch {
          toast.error("프로젝트 등록 실패");
        }
        return;
      }
      emitLocalDataChange({ label: "프로젝트", type: "added" });
      router.refresh();
    } catch {
      toast.error("네트워크 오류로 프로젝트 등록에 실패했습니다.");
    } finally {
      onClose();
      setPending(false);
    }
  }

  async function submitIdea(form: FormData) {
    setPending(true);
    try {
      const res = await fetch("/api/ideas/add", { method: "POST", body: form });
      if (!res.ok) {
        try {
          const j = await res.json();
          toast.error(
            j?.error ? `아이디어 등록 실패: ${j.error}` : "아이디어 등록 실패"
          );
        } catch {
          toast.error("아이디어 등록 실패");
        }
        return;
      }
      emitLocalDataChange({ label: "아이디어", type: "added" });
      router.refresh();
    } catch {
      toast.error("네트워크 오류로 아이디어 등록에 실패했습니다.");
    } finally {
      onClose();
      setPending(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg w-[32rem] max-w-[90vw] p-6 relative">
        <button
          className="absolute right-4 top-4 text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
          onClick={onClose}
          aria-label="닫기"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
        {pending && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-white/70 dark:bg-gray-800/70 rounded-lg">
            <MotionAwareSpinner className="h-8 w-8 rounded-full border-4 border-blue-500 border-t-transparent" />
          </div>
        )}
        {!mode ? (
          <div className="flex flex-col gap-4">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
              무엇을 추가할까요?
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <button
                className="px-4 py-3 rounded-md bg-blue-600 hover:bg-blue-700 text-white font-semibold transition-colors"
                onClick={() => setMode("notice")}
              >
                공지
              </button>
              <button
                className="px-4 py-3 rounded-md bg-indigo-600 hover:bg-indigo-700 text-white font-semibold transition-colors"
                onClick={() => setMode("project")}
              >
                프로젝트
              </button>
              <button
                className="px-4 py-3 rounded-md bg-purple-600 hover:bg-purple-700 text-white font-semibold transition-colors"
                onClick={() => setMode("idea")}
              >
                아이디어
              </button>
            </div>
          </div>
        ) : mode === "notice" ? (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const fd = new FormData(e.currentTarget as HTMLFormElement);
              submitNotice(fd);
            }}
            className="flex flex-col gap-4"
          >
            <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
              공지 추가
            </h3>
            <input
              name="title"
              placeholder="제목"
              className="border dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:ring-blue-500 focus:border-blue-500"
              required
            />
            <textarea
              name="content"
              placeholder="내용"
              className="border dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:ring-blue-500 focus:border-blue-500"
              rows={5}
            />
            <div className="rounded-md border border-gray-200 dark:border-gray-700 p-3 space-y-3">
              <label className="flex items-center justify-between gap-3 text-sm text-gray-700 dark:text-gray-200">
                <span>투표/설문 사용</span>
                <input
                  type="checkbox"
                  checked={noticePollEnabled}
                  onChange={(e) => setNoticePollEnabled(e.target.checked)}
                />
              </label>

              {noticePollEnabled && (
                <div className="space-y-3">
                  <input
                    value={noticePollQuestion}
                    onChange={(e) => setNoticePollQuestion(e.target.value)}
                    placeholder="질문(선택)"
                    className="w-full border dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:ring-blue-500 focus:border-blue-500"
                  />

                  <div className="flex flex-wrap gap-3 text-sm text-gray-700 dark:text-gray-200">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={noticePollMultiple}
                        onChange={(e) =>
                          setNoticePollMultiple(e.target.checked)
                        }
                      />
                      <span>복수 선택</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={noticePollAnonymous}
                        onChange={(e) =>
                          setNoticePollAnonymous(e.target.checked)
                        }
                      />
                      <span>익명 선택</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={noticePollAllowChange}
                        onChange={(e) =>
                          setNoticePollAllowChange(e.target.checked)
                        }
                      />
                      <span>재투표 허용</span>
                    </label>
                  </div>

                  <label className="block text-sm text-gray-700 dark:text-gray-200">
                    <div className="mb-1">마감일 (선택)</div>
                    <input
                      type="datetime-local"
                      value={noticePollDeadline}
                      onChange={(e) => setNoticePollDeadline(e.target.value)}
                      className="w-full border dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    />
                  </label>

                  <div className="space-y-2">
                    <div className="text-sm font-medium text-gray-700 dark:text-gray-200">
                      선택지
                    </div>
                    {noticePollOptions.map((opt, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <input
                          value={opt}
                          onChange={(e) =>
                            setNoticePollOptions((prev) =>
                              prev.map((v, i) =>
                                i === idx ? e.target.value : v
                              )
                            )
                          }
                          placeholder={`선택지 ${idx + 1}`}
                          className="flex-1 border dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:ring-blue-500 focus:border-blue-500"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setNoticePollOptions((prev) =>
                              prev.length <= 2
                                ? prev
                                : prev.filter((_, i) => i !== idx)
                            )
                          }
                          className="px-3 py-2 rounded-md border border-gray-200 dark:border-gray-600 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50"
                          disabled={noticePollOptions.length <= 2}
                        >
                          삭제
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() =>
                        setNoticePollOptions((prev) => [...prev, ""])
                      }
                      className="inline-flex items-center px-3 py-2 rounded-md bg-gray-100 dark:bg-gray-700 text-sm text-gray-800 dark:text-gray-100 hover:bg-gray-200 dark:hover:bg-gray-600"
                    >
                      선택지 추가
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                className="px-4 py-2 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                onClick={() => setMode(null)}
              >
                뒤로
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-md bg-blue-600 hover:bg-blue-700 text-white font-semibold transition-colors"
                disabled={pending}
              >
                등록
              </button>
            </div>
          </form>
        ) : mode === "project" ? (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const fd = new FormData(e.currentTarget as HTMLFormElement);
              submitProject(fd);
            }}
            className="flex flex-col gap-4"
          >
            <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
              프로젝트 추가
            </h3>
            <input
              name="name"
              placeholder="프로젝트명"
              className="border dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:ring-blue-500 focus:border-blue-500"
              required
            />
            <textarea
              name="description"
              placeholder="설명 (선택)"
              rows={4}
              className="border dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:ring-blue-500 focus:border-blue-500"
            />
            <div className="flex justify-end gap-3">
              <button
                type="button"
                className="px-4 py-2 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                onClick={() => setMode(null)}
              >
                뒤로
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-md bg-indigo-600 hover:bg-indigo-700 text-white font-semibold transition-colors"
                disabled={pending}
              >
                등록
              </button>
            </div>
          </form>
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const fd = new FormData(e.currentTarget as HTMLFormElement);
              submitIdea(fd);
            }}
            className="flex flex-col gap-4"
          >
            <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
              아이디어 추가
            </h3>
            <input
              name="title"
              placeholder="제목"
              className="border dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:ring-blue-500 focus:border-blue-500"
              required
            />
            <textarea
              name="description"
              placeholder="설명(선택)"
              className="border dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:ring-blue-500 focus:border-blue-500"
              rows={4}
            />
            <div className="flex justify-end gap-3">
              <button
                type="button"
                className="px-4 py-2 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                onClick={() => setMode(null)}
              >
                뒤로
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-md bg-purple-600 hover:bg-purple-700 text-white font-semibold transition-colors"
                disabled={pending}
              >
                등록
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
