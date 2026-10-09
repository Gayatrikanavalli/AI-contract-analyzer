import React from 'react';
import { ArrowRight, FileSearch, FileText, Scale, Shield, Sparkles } from 'lucide-react';

interface LandingPageProps {
  onNavigate: (path: string) => void;
}

const features = [
  {
    icon: FileSearch,
    title: 'Understand every clause',
    description: 'Turn dense contract language into clear, searchable insights.',
  },
  {
    icon: Scale,
    title: 'Spot risk sooner',
    description: 'Surface risky terms and get practical negotiation guidance.',
  },
  {
    icon: Shield,
    title: 'Keep work private',
    description: 'A dedicated workspace keeps your documents tied to your account.',
  },
];

export const LandingPage: React.FC<LandingPageProps> = ({ onNavigate }) => (
  <div className="relative isolate min-h-screen overflow-x-clip bg-[#17143D] font-sans text-white">
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute -top-48 right-[-8rem] h-[34rem] w-[34rem] rounded-full bg-[#6D5FE8]/20 blur-3xl" />
      <div className="absolute -bottom-64 left-[-10rem] h-[38rem] w-[38rem] rounded-full bg-indigo-400/10 blur-3xl" />
    </div>

    <header className="relative z-10 mx-auto flex h-20 max-w-7xl items-center justify-between px-5 sm:px-8">
      <button
        type="button"
        onClick={() => onNavigate('/')}
        className="flex items-center gap-3 text-left"
        aria-label="Contract Analyzer home"
      >
        <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#6D5FE8] text-white shadow-lg shadow-indigo-950/40">
          <Shield className="h-5 w-5" />
        </span>
        <span>
          <span className="block text-sm font-bold tracking-tight">Contract Analyzer</span>
          <span className="block text-[11px] text-indigo-300">Legal AI Workspace</span>
        </span>
      </button>
      <nav className="flex items-center gap-3" aria-label="Account">
        <button
          type="button"
          onClick={() => onNavigate('/login')}
          className="interactive-link rounded-lg px-3 py-2 text-sm font-semibold text-indigo-100 hover:text-white"
        >
          Sign in
        </button>
        <button
          type="button"
          onClick={() => onNavigate('/signup')}
          className="interactive-button rounded-xl bg-white px-4 py-2.5 text-sm font-bold text-[#352A9B] shadow-lg shadow-black/10 hover:bg-indigo-50"
        >
          Get started
        </button>
      </nav>
    </header>

    <main className="relative z-10 mx-auto max-w-7xl px-5 pb-20 pt-12 sm:px-8 sm:pt-20">
      <section className="grid items-center gap-14 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="max-w-2xl">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-indigo-300/20 bg-white/5 px-3.5 py-2 text-xs font-semibold text-indigo-100">
            <Sparkles className="h-3.5 w-3.5 text-violet-300" />
            Clarity for the fine print
          </div>
          <h1 className="text-4xl font-black leading-[1.08] tracking-tight sm:text-5xl lg:text-6xl">
            Make confident decisions about every contract.
          </h1>
          <p className="mt-6 max-w-xl text-base leading-7 text-indigo-200 sm:text-lg">
            Upload an agreement to uncover key clauses, understand potential risks, and know what to review next—all in one private workspace.
          </p>
          <div className="mt-9 flex flex-wrap items-center gap-4">
            <button
              type="button"
              onClick={() => onNavigate('/signup')}
              className="interactive-button inline-flex items-center gap-2 rounded-xl bg-[#6D5FE8] px-5 py-3.5 text-sm font-bold text-white shadow-lg shadow-indigo-950/30 hover:bg-[#5B4DE0]"
            >
              Get started for free
              <ArrowRight className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => onNavigate('/login')}
              className="interactive-link px-2 py-3 text-sm font-semibold text-indigo-100 hover:text-white"
            >
              Sign in to your workspace
            </button>
          </div>
          <p className="mt-5 text-xs text-indigo-300/80">
            Private by account · PDF analysis · Clear risk summaries
          </p>
        </div>

        <div className="interactive-card relative mx-auto w-full max-w-xl rounded-3xl border border-white/15 bg-white/[0.07] p-4 shadow-2xl shadow-black/20 backdrop-blur-sm sm:p-6">
          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 text-slate-900 shadow-xl sm:p-6">
            <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-[#6D5FE8]">
                  <FileText className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-sm font-bold">Agreement overview</p>
                  <p className="mt-0.5 text-xs text-slate-500">Your contract, made clearer</p>
                </div>
              </div>
              <span className="rounded-full bg-amber-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-amber-700">
                Review recommended
              </span>
            </div>

            <div className="grid grid-cols-3 gap-3 py-5">
              <div className="rounded-xl bg-slate-50 p-3">
                <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Clauses</p>
                <p className="mt-1 text-2xl font-black">24</p>
              </div>
              <div className="rounded-xl bg-rose-50 p-3">
                <p className="text-[10px] font-bold uppercase tracking-wide text-rose-600">High risk</p>
                <p className="mt-1 text-2xl font-black text-rose-700">3</p>
              </div>
              <div className="rounded-xl bg-emerald-50 p-3">
                <p className="text-[10px] font-bold uppercase tracking-wide text-emerald-700">Analyzed</p>
                <p className="mt-1 text-2xl font-black text-emerald-800">100%</p>
              </div>
            </div>

            <div className="rounded-xl border border-rose-100 bg-rose-50/60 p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs font-bold text-slate-900">Limitation of liability</p>
                <span className="rounded-full bg-rose-100 px-2 py-1 text-[10px] font-bold text-rose-700">High risk</span>
              </div>
              <p className="mt-2 text-xs leading-5 text-slate-600">
                Review the liability cap and confirm it covers the potential scope of loss.
              </p>
            </div>

            <div className="mt-4 flex items-center gap-2 text-[11px] font-medium text-slate-500">
              <Shield className="h-3.5 w-3.5 text-emerald-600" />
              A clear overview before you commit
            </div>
          </div>
        </div>
      </section>

      <section className="mt-24 border-t border-white/10 pt-10">
        <div className="mb-7">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-violet-300">A smarter review workflow</p>
          <h2 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">Spend less time searching. Focus on what matters.</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {features.map(({ icon: Icon, title, description }) => (
            <article key={title} className="interactive-card rounded-2xl border border-white/10 bg-white/[0.05] p-5">
              <span className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-[#6D5FE8]/20 text-violet-200">
                <Icon className="h-5 w-5" />
              </span>
              <h3 className="text-sm font-bold">{title}</h3>
              <p className="mt-2 text-sm leading-6 text-indigo-200/80">{description}</p>
            </article>
          ))}
        </div>
      </section>
    </main>
  </div>
);
