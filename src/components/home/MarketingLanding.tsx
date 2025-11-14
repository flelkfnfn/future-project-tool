"use client";

import { motion } from "framer-motion";
import {
  LuFolderKanban,
  LuMessageSquare,
  LuMegaphone,
  LuLightbulb,
  LuCalendarDays,
  LuFolderOpen,
} from "react-icons/lu";

const features = [
  {
    name: "프로젝트별 게시 공간",
    description:
      "프로젝트별 게시 공간의 용도, 결정 사항 등을 기록하고 관리합니다.",
    icon: LuFolderKanban,
  },
  {
    name: "자유로운 게시판",
    description:
      "자유로운 게시판의 성격을 살린 채팅과 결합하여 소통할 수 있습니다.",
    icon: LuMessageSquare,
  },
  {
    name: "자동화된 공지 발송",
    description:
      "자동화된 공지 발송은 모든 게시물에 이메일로 발송되며, 사용자에게 체크리스트를 제공합니다.",
    icon: LuMegaphone,
  },
  {
    name: "아이디어 브레인스토밍",
    description:
      "아이디어 브레인스토밍은 자유롭게 아이디어를 제안하고, 서로의 '좋아요' 의견을 눌러줍니다.",
    icon: LuLightbulb,
  },
  {
    name: "팀 캘린더",
    description: "팀의 마감일과 주요 일정을 공유하고 관리합니다.",
    icon: LuCalendarDays,
  },
  {
    name: "파일 라이브러리",
    description: "프로젝트 관련 파일들을 공유하고 관리하는 공간입니다.",
    icon: LuFolderOpen,
  },
];

export default function MarketingLanding() {
  return (
    <div className="relative min-h-screen bg-gradient-to-b from-white to-gray-50 dark:from-gray-950 dark:to-gray-900 rounded-t-3xl overflow-hidden border-t border-x border-gray-200/70 bg-white/70 dark:border-gray-800/70 dark:bg-gray-900/60">
      {/* ��� ??��?? �׸�??+ ���� �׶�??��??*/}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 [mask-image:radial-gradient(60%_50%_at_50%_0%,#000,transparent)]"
      >
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(120,119,198,0.06)_1px,transparent_1px),linear-gradient(to_bottom,rgba(120,119,198,0.06)_1px,transparent_1px)] bg-[size:32px_32px]" />
        <div className="absolute left-1/2 top-[-120px] h-[420px] w-[800px] -translate-x-1/2 rounded-full bg-gradient-to-r from-blue-400/25 via-indigo-400/20 to-cyan-400/20 blur-3xl dark:from-blue-500/20 dark:via-indigo-500/20 dark:to-cyan-500/20" />
      </div>

      <div className="w-full max-w-none px-4 py-8">
        {/* Hero */}
        <section className="relative overflow-hidden rounded-3xl border border-gray-200/70 bg-white/70 shadow-sm backdrop-blur dark:border-gray-800/70 dark:bg-gray-900/60">
          <div className="absolute -right-10 -top-10 h-64 w-64 rounded-full bg-gradient-to-tr from-indigo-400/20 to-sky-400/10 blur-2xl" />
          <div className="absolute -bottom-10 -left-10 h-64 w-64 rounded-full bg-gradient-to-tr from-cyan-400/20 to-emerald-400/10 blur-2xl" />
          <div className="relative isolate px-6 py-20 sm:px-12 lg:px-16">
            <motion.h1
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45 }}
              className="text-center text-4xl font-bold tracking-tight text-gray-900 dark:text-gray-50 sm:text-6xl"
            >
              미래·사회변화주도 프로젝트
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.08 }}
              className="mx-auto mt-6 max-w-2xl text-center text-lg leading-8 text-gray-600 dark:text-gray-300"
            >
              상단 메뉴를 통해 원하는 기능으로 이동하세요.
            </motion.p>
          </div>
        </section>

        {/* ??�� ??�� */}
        <motion.section
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mx-auto my-16 max-w-4xl text-center"
        >
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 sm:text-3xl">
            프로젝트별 게시 공간
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-base text-gray-700 dark:text-gray-300">
            미래·사회변화주도 프로젝트의 활동 내용을 기록하고 관리합니다.
            프로젝트에 대한 아이디어든, 제안이든 함께 이야기 나누며 발전시켜
            나갑니다.
          </p>
        </motion.section>

        {/* �ٽ� ��� */}
        <section className="mx-auto max-w-6xl">
          <h2 className="mb-8 text-center text-2xl font-bold text-gray-900 dark:text-gray-100 sm:mb-12 sm:text-3xl">
            핵심 기능
          </h2>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <motion.article
                  key={feature.name}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.45, delay: index * 0.06 }}
                  className="group relative overflow-hidden rounded-2xl border border-gray-200/80 bg-white/80 p-5 shadow-sm ring-1 ring-transparent transition hover:-translate-y-1 hover:shadow-md hover:ring-indigo-200 dark:border-gray-800/70 dark:bg-gray-900/60 dark:hover:ring-indigo-500/20"
                >
                  {/* ī�� ��� �ε������� */}
                  <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-indigo-400/60 via-sky-400/60 to-cyan-400/60 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 ring-1 ring-indigo-100 transition group-hover:scale-105 dark:bg-indigo-500/10 dark:text-indigo-300 dark:ring-indigo-500/20">
                      <Icon size={20} aria-hidden />
                    </div>
                    <div>
                      <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">
                        {feature.name}
                      </h3>
                      <p className="mt-1 text-sm leading-6 text-gray-600 dark:text-gray-400">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                </motion.article>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}
