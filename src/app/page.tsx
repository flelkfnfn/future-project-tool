"use client";

import { motion } from "framer-motion";

const features = [
  {
    name: "프로젝트별 게시 공간",
    description: "각 팀이 회의 내용, 결정 사항을 체계적으로 기록하고 관리합니다.",
  },
  {
    name: "실시간 대화방",
    description:
      "자유로운 게시물 작성과 실시간 채팅을 결합하여 신속한 소통을 돕습니다.",
  },
  {
    name: "자동화된 공지 시스템",
    description:
      "전체 공지 등록 시 모든 팀원에게 메일이 발송되며, 확인 여부를 체크할 수 있습니다.",
  },
  {
    name: "아이디어 허브",
    description:
      "누구나 자유롭게 아이디어를 제안하고, 댓글과 '좋아요'로 의견을 나눕니다.",
  },
  {
    name: "팀 캘린더",
    description: "회의, 마감일 등 주요 일정을 공유하고 한눈에 파악합니다.",
  },
  {
    name: "파일 라이브러리",
    description: "프로젝트 관련 파일을 안전하게 공유하고 관리하는 공간입니다.",
  },
];

export default function Home() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-center pt-24 pb-16">
        <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-gray-100 sm:text-6xl">
          미래·사회변화주도 프로젝트
        </h1>
        <p className="mt-6 text-lg leading-8 text-gray-600 dark:text-gray-300">
          상단 메뉴를 통해 원하는 기능으로 이동하세요.
        </p>
      </div>

      <div className="max-w-4xl mx-auto">
        {/* Project Overview */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-16 text-center"
        >
          <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            우리의 새로운 협업 공간
          </h2>
          <p className="text-lg text-gray-700 dark:text-gray-300 max-w-2xl mx-auto">
            미래사회변화주도 프로젝트 팀의 원활한 소통과 효율적인 협업을 위해
            탄생한 온라인 플랫폼입니다. 오프라인의 한계를 넘어, 언제 어디서든
            함께 아이디어를 나누고 프로젝트를 발전시켜 나가세요.
          </p>
        </motion.section>

        {/* Core Features */}
        <section>
          <h2 className="text-3xl font-bold text-center text-gray-900 dark:text-gray-100 mb-12">
            핵심 기능
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={feature.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden transform hover:-translate-y-1 transition-transform duration-300"
              >
                <div className="p-6">
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
                    {feature.name}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    {feature.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
