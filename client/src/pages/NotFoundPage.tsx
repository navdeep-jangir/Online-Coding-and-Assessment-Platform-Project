import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LayoutDashboard, ArrowLeft, Compass } from 'lucide-react';

export default function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-50 px-4 py-16 text-slate-900 dark:bg-[#0D1117] dark:text-[#F0F6FC]">
      {/* Ambient background glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-1/3 h-80 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#22C55E]/10 blur-[120px]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute bottom-1/4 right-1/3 h-64 w-80 rounded-full bg-[#38BDF8]/10 blur-[120px]"
      />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="relative w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-xl dark:border-[#30363D] dark:bg-[#1C2128] sm:p-10"
      >
        {/* Custom Mountain + Broken Code Brackets Illustration */}
        <div className="mx-auto mb-6 flex justify-center">
          <svg
            viewBox="0 0 260 160"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="h-40 w-64"
            aria-hidden="true"
          >
            {/* Dashed trail */}
            <path
              d="M24 132C58 128 74 96 102 92C122 89 138 112 158 104C182 94 198 62 232 54"
              stroke="#38BDF8"
              strokeOpacity="0.35"
              strokeWidth="2.5"
              strokeDasharray="6 6"
              strokeLinecap="round"
            />
            {/* Mountain range silhouette */}
            <path
              d="M36 132L90 64L126 108L164 48L224 132H36Z"
              className="fill-[#22C55E]/10 stroke-[#22C55E]/40"
              strokeWidth="2"
              strokeLinejoin="round"
            />
            {/* Summit highlight */}
            <path
              d="M148 74L164 48L180 74"
              stroke="#22C55E"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {/* Flag at summit */}
            <path d="M164 48V28" stroke="#38BDF8" strokeWidth="2.5" strokeLinecap="round" />
            <path
              d="M164 28L184 34L164 40V28Z"
              fill="#38BDF8"
            />
            {/* Left bracket < */}
            <path
              d="M46 46L30 62L46 78"
              stroke="#22C55E"
              strokeWidth="3.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {/* Right bracket > */}
            <path
              d="M214 46L230 62L214 78"
              stroke="#22C55E"
              strokeWidth="3.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {/* Floating question / node dots */}
            <circle cx="90" cy="64" r="4" fill="#22C55E" />
            <circle cx="126" cy="108" r="4" fill="#38BDF8" />
          </svg>
        </div>

        <div className="inline-flex items-center gap-1.5 rounded-full border border-[#38BDF8]/30 bg-[#38BDF8]/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-[#38BDF8]">
          <Compass className="h-3.5 w-3.5" />
          Error 404
        </div>

        <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-slate-900 dark:text-[#F0F6FC] sm:text-4xl">
          Trail Not Found
        </h1>

        <p className="mt-3 text-sm leading-relaxed text-slate-600 dark:text-[#8B949E] sm:text-base">
          Looks like you wandered off the mountain trail. The page you&apos;re looking for doesn&apos;t
          exist or has been moved.
        </p>

        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            to="/dashboard"
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#22C55E] px-6 py-3 text-sm font-semibold text-[#0D1117] shadow-md shadow-[#22C55E]/20 transition-all hover:bg-[#16A34A] sm:w-auto"
          >
            <LayoutDashboard className="h-4 w-4" />
            Back to Dashboard
          </Link>

          <button
            type="button"
            onClick={() => navigate(-1)}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-6 py-3 text-sm font-semibold text-slate-700 transition-colors hover:border-[#38BDF8] hover:text-[#38BDF8] dark:border-[#30363D] dark:bg-[#161B22] dark:text-[#F0F6FC] dark:hover:border-[#38BDF8] sm:w-auto"
          >
            <ArrowLeft className="h-4 w-4" />
            Go Back
          </button>
        </div>
      </motion.div>
    </div>
  );
}
