"use client";

import { useEffect, useState } from "react";
import {
  LuChevronLeft,
  LuChevronRight,
  LuSparkles,
  LuX,
} from "react-icons/lu";

const TOUR_STORAGE_KEY = "dashboard-tour:v1";

const steps = [
  {
    title: "개인화된 홈",
    description:
      "로그인하면 홈 화면이 자동으로 대시보드로 전환되어 오늘 필요한 정보를 먼저 보여줍니다.",
  },
  {
    title: "다가오는 일정",
    description:
      "캘린더에 등록된 일정 중 임박한 항목을 우선 정렬해 주어 D-Day 관리가 편해졌어요.",
  },
  {
    title: "알림 & 공지",
    description:
      "최근 등록된 공지사항을 바로 확인하고 필요한 페이지로 이동할 수 있습니다.",
  },
  {
    title: "프로젝트 스냅샷",
    description:
      "업데이트된 프로젝트를 빠르게 훑어보고 상세 페이지로 넘어가 후속 조치를 진행하세요.",
  },
];

export default function DashboardTour() {
  const [open, setOpen] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);

  useEffect(() => {
    try {
      const seen = localStorage.getItem(TOUR_STORAGE_KEY);
      if (!seen) {
        const timer = setTimeout(() => setOpen(true), 400);
        return () => clearTimeout(timer);
      }
    } catch {
      /* noop */
    }
    return undefined;
  }, []);

  const completeTour = () => {
    try {
      localStorage.setItem(TOUR_STORAGE_KEY, "done");
    } catch {
      /* noop */
    }
    setOpen(false);
  };

  const next = () => {
    if (stepIndex >= steps.length - 1) {
      completeTour();
    } else {
      setStepIndex((prev) => Math.min(prev + 1, steps.length - 1));
    }
  };

  const prev = () => {
    setStepIndex((prev) => Math.max(prev - 1, 0));
  };

  if (!open) return null;

  const step = steps[stepIndex];

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl dark:bg-gray-900">
        <div className="flex items-center justify-between">
          <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-600 dark:bg-blue-500/10 dark:text-blue-200">
            <LuSparkles className="h-4 w-4" aria-hidden />
            온보딩 투어
          </div>
          <button
            type="button"
            onClick={completeTour}
            className="rounded-full p-1 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800"
            aria-label="투어 닫기"
          >
            <LuX className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-5">
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
            Step {stepIndex + 1} / {steps.length}
          </p>
          <h2 className="mt-2 text-xl font-semibold text-gray-900 dark:text-gray-100">
            {step.title}
          </h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
            {step.description}
          </p>
        </div>

        <div className="mt-6 flex items-center justify-between">
          <button
            type="button"
            onClick={completeTour}
            className="text-sm font-medium text-gray-500 underline-offset-4 transition hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            다시 보지 않기
          </button>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={prev}
              disabled={stepIndex === 0}
              className="inline-flex items-center gap-1 rounded-full border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-600 transition disabled:opacity-40 dark:border-gray-700 dark:text-gray-300"
            >
              <LuChevronLeft className="h-4 w-4" />
              이전
            </button>
            <button
              type="button"
              onClick={next}
              className="inline-flex items-center gap-1 rounded-full bg-blue-600 px-4 py-1.5 text-sm font-semibold text-white shadow hover:bg-blue-700"
            >
              {stepIndex === steps.length - 1 ? "시작하기" : "다음"}
              <LuChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
