import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-slate-200/80 bg-white/95 backdrop-blur-sm">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-xl font-bold tracking-tight text-slate-900">ExamPrep</span>
          </Link>
          <nav className="hidden items-center gap-8 sm:flex">
            <a href="#features" className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">Features</a>
            <a href="#how-it-works" className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">How it works</a>
            <a href="#benefits" className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">Benefits</a>
          </nav>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 transition-colors"
            >
              Sign in
            </Link>
            <Link
              href="/login"
              className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-slate-800 transition-colors"
            >
              Get started
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative pt-28 pb-20 sm:pt-36 sm:pb-28 px-4 sm:px-6 overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-[linear-gradient(to_bottom_right,#f8fafc_0%,#f1f5f9_50%,#e2e8f0_100%)]" />
        <div className="absolute top-1/4 right-0 w-96 h-96 rounded-full bg-primary-100/40 blur-3xl -z-10" />
        <div className="absolute bottom-0 left-1/4 w-80 h-80 rounded-full bg-primary-50/60 blur-3xl -z-10" />
        <div className="mx-auto max-w-4xl text-center">
          <h1 className="text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl md:text-6xl">
            Smarter exam prep,{' '}
            <span className="text-primary-600">powered by AI</span>
          </h1>
          <p className="mt-6 text-lg text-slate-600 sm:text-xl max-w-2xl mx-auto leading-relaxed">
            Summaries, practice papers, and instant evaluation—all from your notes and PDFs. 
            Built for students and teachers.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/login"
              className="w-full sm:w-auto rounded-xl bg-slate-900 px-8 py-3.5 text-base font-semibold text-white shadow-lg shadow-slate-900/25 hover:bg-slate-800 transition-all hover:shadow-xl hover:shadow-slate-900/20"
            >
              Get started
            </Link>
            <Link
              href="/login"
              className="w-full sm:w-auto rounded-xl border-2 border-slate-300 bg-white px-8 py-3.5 text-base font-semibold text-slate-700 hover:border-slate-400 hover:bg-slate-50 transition-colors"
            >
              Sign in
            </Link>
          </div>
          <p className="mt-6 text-sm text-slate-500">
            Free to use · No credit card required
          </p>
        </div>
      </section>

      {/* Stats strip */}
      <section className="border-y border-slate-200 bg-slate-50/80 py-8">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <p className="text-3xl font-bold text-slate-900">AI</p>
              <p className="mt-1 text-sm font-medium text-slate-600">Summaries & keywords</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-slate-900">MCQ + Theory</p>
              <p className="mt-1 text-sm font-medium text-slate-600">Practice papers</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-slate-900">Instant</p>
              <p className="mt-1 text-sm font-medium text-slate-600">Evaluation</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-slate-900">Teachers</p>
              <p className="mt-1 text-sm font-medium text-slate-600">Upload & evaluate</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 sm:py-28 px-4 sm:px-6 bg-white">
        <div className="mx-auto max-w-6xl">
          <div className="text-center max-w-2xl mx-auto">
            <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
              Everything you need to prepare
            </h2>
            <p className="mt-4 text-lg text-slate-600">
              One place for study tools, practice exams, and teacher evaluation.
            </p>
          </div>
          <div className="mt-16 grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                title: 'AI summaries & keywords',
                description: 'Upload your PDF or paste text. Get concise summaries and important keywords so you focus on what matters.',
                icon: '📄',
              },
              {
                title: 'Practice exams',
                description: 'Generate MCQs, fill-in-the-blanks, and theory questions from your content. New set every time.',
                icon: '📝',
              },
              {
                title: 'Instant theory evaluation',
                description: 'Submit your answers and get AI feedback with marks and suggested learning links.',
                icon: '✓',
              },
              {
                title: 'Teacher tools',
                description: 'Create papers, evaluate scripts, upload PDFs, and track evaluated papers in one dashboard.',
                icon: '👩‍🏫',
              },
              {
                title: 'Student dashboard',
                description: 'Summaries, keywords, and exam attempts in one place. See your progress at a glance.',
                icon: '📊',
              },
              {
                title: 'Roles built-in',
                description: 'Admin, teacher, and student accounts. Teachers assign; students practice; admin manages.',
                icon: '🔐',
              },
            ].map((item, i) => (
              <div
                key={i}
                className="group relative rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:shadow-md hover:border-slate-300"
              >
                <span className="text-2xl" aria-hidden>{item.icon}</span>
                <h3 className="mt-4 text-lg font-semibold text-slate-900">{item.title}</h3>
                <p className="mt-2 text-slate-600 leading-relaxed">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="py-20 sm:py-28 px-4 sm:px-6 bg-slate-50">
        <div className="mx-auto max-w-6xl">
          <div className="text-center max-w-2xl mx-auto">
            <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
              How it works
            </h2>
            <p className="mt-4 text-lg text-slate-600">
              Simple flow for students and teachers.
            </p>
          </div>
          <div className="mt-16 grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-primary-100 text-primary-700 font-bold">1</div>
              <h3 className="mt-4 font-semibold text-slate-900">Sign in</h3>
              <p className="mt-2 text-slate-600 text-sm">Create or use your account as student or teacher.</p>
            </div>
            <div className="text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-primary-100 text-primary-700 font-bold">2</div>
              <h3 className="mt-4 font-semibold text-slate-900">Upload or paste</h3>
              <p className="mt-2 text-slate-600 text-sm">Add your PDF or text. Get summaries, keywords, or generate questions.</p>
            </div>
            <div className="text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-primary-100 text-primary-700 font-bold">3</div>
              <h3 className="mt-4 font-semibold text-slate-900">Practice & evaluate</h3>
              <p className="mt-2 text-slate-600 text-sm">Take exams, submit answers, and get instant or teacher evaluation.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section id="benefits" className="py-20 sm:py-28 px-4 sm:px-6 bg-white">
        <div className="mx-auto max-w-6xl">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <div>
              <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
                Study smarter, not harder
              </h2>
              <p className="mt-4 text-lg text-slate-600">
                ExamPrep uses AI to turn your material into summaries, keywords, and practice questions—so you spend time on understanding, not searching.
              </p>
              <ul className="mt-8 space-y-4">
                {['Focus on what matters with AI summaries', 'Practice with different question types', 'Get instant feedback on theory answers'].map((text, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary-100 text-primary-600 mt-0.5">✓</span>
                    <span className="text-slate-700">{text}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-8 lg:p-10">
              <p className="text-sm font-semibold uppercase tracking-wider text-primary-600">For students & teachers</p>
              <h3 className="mt-2 text-xl font-bold text-slate-900">One platform, full workflow</h3>
              <p className="mt-3 text-slate-600">
                Students prepare with summaries and practice exams. Teachers generate papers, evaluate scripts, and track results—all in one place.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 sm:py-28 px-4 sm:px-6 bg-slate-900">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Ready to prep better?
          </h2>
          <p className="mt-4 text-lg text-slate-300">
            Sign in and start with summaries, keywords, or a practice exam.
          </p>
          <div className="mt-10">
            <Link
              href="/login"
              className="inline-flex rounded-xl border-2 border-white bg-white px-8 py-3.5 text-base font-semibold text-slate-900 hover:bg-slate-100 transition-colors"
            >
              Get started
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-slate-50 py-12 px-4 sm:px-6">
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            <Link href="/" className="text-lg font-bold text-slate-900">ExamPrep</Link>
            <nav className="flex items-center gap-6 text-sm">
              <a href="#features" className="text-slate-600 hover:text-slate-900 transition-colors">Features</a>
              <a href="#how-it-works" className="text-slate-600 hover:text-slate-900 transition-colors">How it works</a>
              <a href="#benefits" className="text-slate-600 hover:text-slate-900 transition-colors">Benefits</a>
              <Link href="/login" className="text-slate-600 hover:text-slate-900 transition-colors">Sign in</Link>
            </nav>
          </div>
          <p className="mt-8 text-sm text-slate-500">
            © {new Date().getFullYear()} ExamPrep. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
