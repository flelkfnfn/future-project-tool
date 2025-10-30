export default function Home() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-center py-24">
        <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-gray-100 sm:text-6xl">
          미래·사회변화주도 프로젝트
        </h1>
        <p className="mt-6 text-lg leading-8 text-gray-600 dark:text-gray-300">
          상단 메뉴를 통해 원하는 기능으로 이동하세요.
        </p>
      </div>

      {/* Project Intro (English template; replace with your content) */}
      <div className="max-w-3xl mx-auto grid gap-8">
        <section className="rounded-lg border dark:border-gray-700 bg-white dark:bg-gray-800 p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Overview</h2>
          <p className="mt-3 text-gray-700 dark:text-gray-300 italic">Write a short description of the project here.</p>
        </section>

        <section className="rounded-lg border dark:border-gray-700 bg-white dark:bg-gray-800 p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Goals</h2>
          <ul className="mt-3 list-disc pl-5 text-gray-700 dark:text-gray-300 space-y-1">
            <li>Define measurable objectives.</li>
            <li>Describe desired impact and outcomes.</li>
            <li>Set success criteria and KPIs.</li>
          </ul>
        </section>

        <section className="rounded-lg border dark:border-gray-700 bg-white dark:bg-gray-800 p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Scope</h2>
          <p className="mt-3 text-gray-700 dark:text-gray-300 italic">Outline what is in scope and out of scope.</p>
        </section>

        <section className="rounded-lg border dark:border-gray-700 bg-white dark:bg-gray-800 p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">How It Works</h2>
          <ol className="mt-3 list-decimal pl-5 text-gray-700 dark:text-gray-300 space-y-1">
            <li>Summarize the process or workflow.</li>
            <li>Note tools, datasets, or integrations.</li>
            <li>Explain review and iteration cadence.</li>
          </ol>
        </section>

        <div className="grid md:grid-cols-2 gap-6">
          <section className="rounded-lg border dark:border-gray-700 bg-white dark:bg-gray-800 p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Timeline</h3>
            <p className="mt-3 text-gray-700 dark:text-gray-300 italic">Add key phases and milestones.</p>
          </section>
          <section className="rounded-lg border dark:border-gray-700 bg-white dark:bg-gray-800 p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Stakeholders</h3>
            <p className="mt-3 text-gray-700 dark:text-gray-300 italic">List core team and partners.</p>
          </section>
        </div>

        <section className="rounded-lg border dark:border-gray-700 bg-white dark:bg-gray-800 p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Call to Action</h2>
          <p className="mt-3 text-gray-700 dark:text-gray-300 italic">Describe how readers can contribute or follow updates.</p>
        </section>
      </div>
    </div>
  );
}

