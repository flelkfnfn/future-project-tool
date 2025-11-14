"use client";

import Link from "next/link";
import {
  LuBellDot,
  LuCalendarClock,
  LuFolderOpen,
  LuArrowUpRight,
} from "react-icons/lu";
import DashboardTour from "./DashboardTour";

export type DashboardProjectLink = {
  id: number;
  title: string;
  url: string;
};

export type DashboardProject = {
  id: number;
  name: string;
  description?: string | null;
  project_links: DashboardProjectLink[];
};

export type DashboardNotice = {
  id: number;
  title: string;
  content: string;
};

export type UpcomingDeadline = {
  id: number;
  title: string;
  event_date: string;
  description?: string | null;
  daysRemaining: number;
};

export type DashboardData = {
  deadlines: UpcomingDeadline[];
  notices: DashboardNotice[];
  projects: DashboardProject[];
};

type Props = DashboardData & {
  userName: string;
};

export default function DashboardHome({
  userName,
  deadlines,
  notices,
  projects,
}: Props) {
  const stats = [
    {
      label: "다가오는 마감일",
      value: deadlines.length,
      href: "/calendar",
      icon: LuCalendarClock,
    },
    {
      label: "새 공지사항",
      value: notices.length,
      href: "/notices",
      icon: LuBellDot,
    },
    {
      label: "진행 중 프로젝트",
      value: projects.length,
      href: "/projects",
      icon: LuFolderOpen,
    },
  ];

  return (
    <div className="space-y-8">
      <DashboardTour />
      <section className="relative overflow-hidden rounded-3xl border-2 border-gray-200/80 bg-gradient-to-br from-white via-slate-50 to-blue-50 p-8 shadow-xl shadow-gray-200/80 dark:border-gray-700/70 dark:from-gray-900 dark:via-gray-900 dark:to-slate-900 dark:shadow-black/40">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(99,102,241,0.2),_transparent_60%)]" />
        <div className="relative flex flex-col gap-6">
          <div>
            <p className="text-sm font-medium text-blue-600 dark:text-indigo-300">
              안녕하세요, {userName}님
            </p>
            <h1 className="mt-2 text-3xl font-bold text-gray-900 dark:text-gray-50">
              오늘 할 일과 새 소식을 한눈에 확인해 보세요.
            </h1>
            <p className="mt-3 text-base text-gray-600 dark:text-gray-300">
              최근 업데이트된 프로젝트와 다가오는 마감, 공지사항을 기반으로
              개인화된 대시보드를 구성했습니다.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            {stats.map((stat) => {
              const Icon = stat.icon;
              return (
                <Link
                  key={stat.label}
                  href={stat.href}
                  className="group flex items-center justify-between rounded-2xl border-2 border-gray-200/70 bg-white/90 px-4 py-5 text-left shadow-lg shadow-gray-200/70 ring-1 ring-transparent transition hover:-translate-y-0.5 hover:ring-blue-200 dark:border-gray-700/70 dark:bg-gray-900/80 dark:shadow-black/30 dark:hover:ring-gray-500"
                >
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {stat.label}
                    </p>
                    <p className="mt-1 text-2xl font-semibold text-gray-900 dark:text-gray-100">
                      {stat.value}
                    </p>
                  </div>
                  <span className="rounded-2xl bg-blue-50 p-3 text-blue-600 transition group-hover:bg-blue-100 dark:bg-gray-800 dark:text-blue-200 dark:group-hover:bg-gray-700">
                    <Icon className="h-5 w-5" aria-hidden />
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      <div className="grid gap-8 lg:grid-cols-2">
        <SectionCard
          title="다가오는 마감일"
          description="최근 추가된 일정 중 가장 빠른 4가지를 보여드려요."
          actionLabel="전체 일정 보기"
          actionHref="/calendar"
        >
          {deadlines.length > 0 ? (
            <ul className="space-y-4">
              {deadlines.map((deadline) => (
                <DeadlineCard key={deadline.id} deadline={deadline} />
              ))}
            </ul>
          ) : (
            <EmptyState
              title="예정된 일정이 없습니다."
              description="새 일정을 달력에 추가하면 여기에 표시돼요."
            />
          )}
        </SectionCard>

        <SectionCard
          title="새 알림 & 공지"
          description="가장 최근에 등록된 공지 4건을 모아서 보여드려요."
          actionLabel="공지 전체 보기"
          actionHref="/notices"
        >
          {notices.length > 0 ? (
            <ul className="space-y-3">
              {notices.map((notice) => (
                <li
                  key={notice.id}
                  className="rounded-2xl border border-gray-200/70 bg-white/80 px-4 py-3 shadow-sm hover:border-blue-200 dark:border-gray-800/70 dark:bg-gray-900/70 dark:hover:border-gray-600"
                >
                  <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                    {notice.title}
                  </p>
                  <p className="mt-1 line-clamp-2 text-sm text-gray-600 dark:text-gray-400">
                    {notice.content}
                  </p>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState
              title="아직 새 공지가 없어요."
              description="알림이 도착하면 이곳에서 바로 확인할 수 있습니다."
            />
          )}
        </SectionCard>
      </div>

    </div>
  );
}

function SectionCard({
  title,
  description,
  actionLabel,
  actionHref,
  children,
}: {
  title: string;
  description: string;
  actionLabel: string;
  actionHref: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-3xl border-2 border-gray-200/80 bg-white/90 p-6 shadow-xl shadow-gray-200/70 dark:border-gray-700/70 dark:bg-gray-900/70 dark:shadow-black/30">
      <div className="flex flex-wrap items-center gap-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            {title}
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {description}
          </p>
        </div>
        <Link
          href={actionHref}
          className="ml-auto inline-flex items-center gap-1 rounded-full border border-gray-200/70 px-4 py-2 text-sm font-medium text-gray-700 transition hover:border-blue-200 hover:text-blue-600 dark:border-gray-700 dark:text-gray-300 dark:hover:text-blue-300"
        >
          {actionLabel}
          <LuArrowUpRight className="h-4 w-4" aria-hidden />
        </Link>
      </div>
      <div className="mt-6">{children}</div>
    </section>
  );
}

function DeadlineCard({ deadline }: { deadline: UpcomingDeadline }) {
  const date = new Date(deadline.event_date);
  const formatter = new Intl.DateTimeFormat("ko-KR", {
    month: "long",
    day: "numeric",
    weekday: "short",
  });
  const formatted = formatter.format(date);

  const badge =
    deadline.daysRemaining <= 1
      ? "bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-300"
      : "bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-200";

  return (
    <li className="flex items-start gap-4 rounded-2xl border border-gray-200/70 px-4 py-3 shadow-sm dark:border-gray-800/70">
      <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-gray-50 text-sm font-semibold text-gray-900 dark:bg-gray-800 dark:text-gray-100">
        {date.getDate()}
      </div>
      <div className="flex-1">
        <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
          {deadline.title}
        </p>
        <p className="text-sm text-gray-500 dark:text-gray-400">{formatted}</p>
        {deadline.description && (
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
            {deadline.description}
          </p>
        )}
      </div>
      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${badge}`}>
        D-{deadline.daysRemaining <= 0 ? "DAY" : deadline.daysRemaining}
      </span>
    </li>
  );
}

function EmptyState({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-gray-200/70 bg-white/60 px-6 py-10 text-center text-sm text-gray-500 dark:border-gray-700 dark:bg-gray-900/40 dark:text-gray-400">
      <p className="font-medium text-gray-700 dark:text-gray-200">{title}</p>
      <p className="mt-2 text-gray-500 dark:text-gray-400">{description}</p>
    </div>
  );
}
