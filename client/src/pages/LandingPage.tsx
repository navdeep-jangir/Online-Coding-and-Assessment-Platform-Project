import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, useInView } from 'framer-motion';
import {
  Map,
  Code2,
  Calendar,
  BarChart3,
  ArrowRight,
  Sparkles,
  Layers,
  Sun,
  Moon,
  ChevronRight,
  BookOpen,
  Cpu,
  Rocket,
  Crown,
  Compass,
  Menu,
  X,
  LogOut,
  LayoutDashboard,
} from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';

interface AnimatedCounterProps {
  target: number;
  suffix?: string;
  durationMs?: number;
}

function AnimatedCounter({ target, suffix = '', durationMs = 1100 }: AnimatedCounterProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, amount: 0.4 });
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!isInView || target <= 0) {
      setCount(target);
      return;
    }
    let frameId = 0;
    const startTime = performance.now();

    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / durationMs, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.round(eased * target));
      if (progress < 1) {
        frameId = requestAnimationFrame(animate);
      }
    };

    frameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frameId);
  }, [isInView, target, durationMs]);

  return (
    <span ref={ref}>
      {count}
      {suffix}
    </span>
  );
}

function CodeClimbLogoLarge() {
  return (
    <div className="inline-flex flex-col items-center gap-4">
      <div className="relative flex h-20 w-20 items-center justify-center rounded-3xl border border-[#22C55E]/30 bg-[#22C55E]/10 shadow-[0_0_50px_-12px_rgba(34,197,94,0.45)] sm:h-24 sm:w-24">
        <svg
          viewBox="0 0 64 64"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="h-12 w-12 sm:h-14 sm:w-14"
          aria-hidden="true"
        >
          <path
            d="M18 21L9 32L18 43"
            stroke="#22C55E"
            strokeWidth="4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M46 21L55 32L46 43"
            stroke="#22C55E"
            strokeWidth="4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M21 43L32 19L43 43"
            stroke="#22C55E"
            strokeWidth="4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M26.5 31L32 19L37.5 31"
            stroke="#38BDF8"
            strokeWidth="3.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
      <div className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-[#F0F6FC] sm:text-4xl">
        Code<span className="text-[#22C55E]">Climb</span>
      </div>
    </div>
  );
}

function CodeClimbLogoSmall() {
  return (
    <svg
      viewBox="0 0 36 36"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="h-8 w-8 shrink-0"
      aria-hidden="true"
    >
      <rect
        x="1.5"
        y="1.5"
        width="33"
        height="33"
        rx="9"
        className="fill-[#22C55E]/10 stroke-[#22C55E]/35"
        strokeWidth="1.5"
      />
      <path
        d="M10.5 13L6 18L10.5 23"
        stroke="#22C55E"
        strokeWidth="2.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M25.5 13L30 18L25.5 23"
        stroke="#22C55E"
        strokeWidth="2.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M12.5 23.5L18 11.5L23.5 23.5"
        stroke="#22C55E"
        strokeWidth="2.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M15.4 17.2L18 11.5L20.6 17.2"
        stroke="#38BDF8"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const FEATURES = [
  {
    title: 'Structured DSA Roadmap',
    description:
      'Follow a progressive 24-module curriculum from arrays and recursion to graphs and dynamic programming with curated notes.',
    to: '/roadmap',
    actionLabel: 'Open DSA Roadmap',
    icon: Map,
    accent: 'text-[#22C55E]',
    bg: 'bg-[#22C55E]/10 border-[#22C55E]/25',
  },
  {
    title: 'Practice Arena',
    description:
      'Write, compile, and test solutions directly in the browser with instant feedback across C, C++, Java, and Python.',
    to: '/practice',
    actionLabel: 'Browse Problems',
    icon: Code2,
    accent: 'text-[#38BDF8]',
    bg: 'bg-[#38BDF8]/10 border-[#38BDF8]/25',
  },
  {
    title: 'Daily Challenges',
    description:
      'Build unstoppable problem-solving consistency with fresh daily coding challenges, streaks, and spaced repetition revision.',
    to: '/daily-challenge',
    actionLabel: 'Solve Daily Challenge',
    icon: Calendar,
    accent: 'text-[#22C55E]',
    bg: 'bg-[#22C55E]/10 border-[#22C55E]/25',
  },
  {
    title: 'Track Progress',
    description:
      'Visualize topic mastery, solve velocity, accuracy trends, and climb the peer leaderboard with actionable performance insights.',
    to: '/performance',
    actionLabel: 'View Performance',
    icon: BarChart3,
    accent: 'text-[#38BDF8]',
    bg: 'bg-[#38BDF8]/10 border-[#38BDF8]/25',
  },
];

const JOURNEY_STAGES = [
  {
    stage: 'beginner',
    step: '01',
    title: 'Beginner',
    subtitle: 'Foundations & Core Logic',
    topics: ['Programming Basics', 'Mathematics', 'Arrays', 'Strings'],
    icon: Compass,
    accent: 'text-[#22C55E]',
    badgeBg: 'bg-[#22C55E]/15 text-[#22C55E] border-[#22C55E]/30',
  },
  {
    stage: 'intermediate',
    step: '02',
    title: 'Intermediate',
    subtitle: 'Linear Structures & Recursion',
    topics: ['Sorting & Searching', 'Recursion', 'Linked Lists', 'Stacks & Queues'],
    icon: Layers,
    accent: 'text-[#38BDF8]',
    badgeBg: 'bg-[#38BDF8]/15 text-[#38BDF8] border-[#38BDF8]/30',
  },
  {
    stage: 'advanced',
    step: '03',
    title: 'Advanced',
    subtitle: 'Non-Linear & Optimization',
    topics: ['Trees & BSTs', 'Graphs', 'Heaps', 'Greedy & Dynamic Programming'],
    icon: Rocket,
    accent: 'text-amber-400',
    badgeBg: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  },
  {
    stage: 'master',
    step: '04',
    title: 'Master DSA',
    subtitle: 'Competitive Mastery',
    topics: ['Tries', 'Advanced Strings', 'Segment Trees', 'Competitive Programming'],
    icon: Crown,
    accent: 'text-purple-400',
    badgeBg: 'bg-purple-500/15 text-purple-400 border-purple-500/30',
  },
];

const LANGUAGES = [
  { id: 'c', name: 'C', tag: 'Low-level memory & pointers' },
  { id: 'cpp', name: 'C++', tag: 'STL & competitive speed' },
  { id: 'java', name: 'Java', tag: 'Object-oriented & Collections' },
  { id: 'python', name: 'Python', tag: 'Clean & rapid prototyping' },
];

interface PublicStats {
  modulesCount: number;
  conceptsCount: number;
  problemsCount: number;
  languagesCount: number;
}

export default function LandingPage() {
  const { theme, toggleTheme } = useTheme();
  const { isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const isDark = theme === 'dark';

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [stats, setStats] = useState<PublicStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);

  useEffect(() => {
    let active = true;
    api
      .get('/modules/public-stats')
      .then((res) => {
        if (!active) return;
        const payload = res.data?.data;
        if (payload) {
          setStats({
            modulesCount: Number(payload.modulesCount ?? 0),
            conceptsCount: Number(payload.conceptsCount ?? 0),
            problemsCount: Number(payload.problemsCount ?? 0),
            languagesCount: Number(payload.languagesCount ?? 4),
          });
        }
      })
      .catch(() => {
        if (active) setStats(null);
      })
      .finally(() => {
        if (active) setStatsLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const scrollToSection = (id: string) => {
    setMobileMenuOpen(false);
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleLogout = async () => {
    setMobileMenuOpen(false);
    await logout();
    navigate('/', { replace: true });
  };

  const statCards = [
    {
      label: 'DSA Modules',
      value: stats?.modulesCount ?? 0,
      detail: 'Structured beginner-to-master path',
      icon: Layers,
    },
    {
      label: 'Learning Concepts',
      value: stats?.conceptsCount ?? 0,
      detail: 'Detailed notes & curated tutorials',
      icon: BookOpen,
    },
    {
      label: 'Coding Problems',
      value: stats?.problemsCount ?? 0,
      detail: 'Original problems with hidden tests',
      icon: Code2,
    },
    {
      label: 'Programming Languages',
      value: stats?.languagesCount ?? 4,
      detail: 'C, C++, Java & Python supported',
      icon: Cpu,
    },
  ];

  return (
    <div className="min-h-screen scroll-smooth bg-slate-50 text-slate-900 dark:bg-[#0D1117] dark:text-[#F0F6FC]">
      {/* Top Public Navigation */}
      <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/90 backdrop-blur-md dark:border-[#30363D] dark:bg-[#0D1117]/90">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link
            to="/"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="flex items-center gap-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#22C55E]"
          >
            <CodeClimbLogoSmall />
            <span className="text-lg font-bold tracking-tight">
              Code<span className="text-[#22C55E]">Climb</span>
            </span>
          </Link>

          <nav className="hidden items-center gap-7 text-sm font-medium text-slate-600 dark:text-[#8B949E] md:flex">
            <button
              type="button"
              onClick={() => scrollToSection('features')}
              className="transition-colors hover:text-[#22C55E] focus:outline-none focus:text-[#22C55E]"
            >
              Features
            </button>
            <button
              type="button"
              onClick={() => scrollToSection('journey')}
              className="transition-colors hover:text-[#22C55E] focus:outline-none focus:text-[#22C55E]"
            >
              Curriculum
            </button>
            <Link
              to="/roadmap"
              className="transition-colors hover:text-[#22C55E] focus:outline-none focus:text-[#22C55E]"
            >
              Roadmap
            </Link>
            <Link
              to="/languages/cpp"
              className="transition-colors hover:text-[#22C55E] focus:outline-none focus:text-[#22C55E]"
            >
              Languages
            </Link>
          </nav>

          <div className="flex items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={toggleTheme}
              aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-slate-100 text-slate-600 transition-colors hover:border-[#22C55E]/50 hover:text-[#22C55E] dark:border-[#30363D] dark:bg-[#161B22] dark:text-[#8B949E] dark:hover:text-[#22C55E]"
            >
              {isDark ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4" />}
            </button>

            <div className="hidden items-center gap-2.5 sm:flex">
              {isAuthenticated ? (
                <>
                  <Link
                    to="/dashboard"
                    className="inline-flex items-center gap-1.5 rounded-lg bg-[#22C55E] px-4 py-2 text-sm font-semibold text-[#0D1117] shadow-sm transition-all hover:bg-[#16A34A]"
                  >
                    <LayoutDashboard className="h-4 w-4" />
                    Dashboard
                  </Link>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 px-3.5 py-2 text-sm font-medium text-slate-700 transition-colors hover:border-red-500/50 hover:text-red-400 dark:border-[#30363D] dark:text-[#F0F6FC]"
                  >
                    <LogOut className="h-4 w-4" />
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="rounded-lg px-3.5 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 dark:text-[#F0F6FC] dark:hover:bg-[#1C2128]"
                  >
                    Sign In
                  </Link>
                  <Link
                    to="/register"
                    className="inline-flex items-center gap-1.5 rounded-lg bg-[#22C55E] px-4 py-2 text-sm font-semibold text-[#0D1117] shadow-sm transition-all hover:bg-[#16A34A]"
                  >
                    Get Started
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </>
              )}
            </div>

            <button
              type="button"
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
              aria-expanded={mobileMenuOpen}
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-slate-100 text-slate-700 dark:border-[#30363D] dark:bg-[#161B22] dark:text-[#F0F6FC] md:hidden"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="border-t border-slate-200 bg-white px-4 py-4 dark:border-[#30363D] dark:bg-[#161B22] md:hidden">
            <div className="flex flex-col gap-2 text-sm font-medium">
              <button
                type="button"
                onClick={() => scrollToSection('features')}
                className="rounded-lg px-3 py-2 text-left text-slate-700 hover:bg-slate-100 dark:text-[#F0F6FC] dark:hover:bg-[#1C2128]"
              >
                Features
              </button>
              <button
                type="button"
                onClick={() => scrollToSection('journey')}
                className="rounded-lg px-3 py-2 text-left text-slate-700 hover:bg-slate-100 dark:text-[#F0F6FC] dark:hover:bg-[#1C2128]"
              >
                Curriculum
              </button>
              <Link
                to="/roadmap"
                onClick={() => setMobileMenuOpen(false)}
                className="rounded-lg px-3 py-2 text-slate-700 hover:bg-slate-100 dark:text-[#F0F6FC] dark:hover:bg-[#1C2128]"
              >
                Roadmap
              </Link>
              <Link
                to="/languages/cpp"
                onClick={() => setMobileMenuOpen(false)}
                className="rounded-lg px-3 py-2 text-slate-700 hover:bg-slate-100 dark:text-[#F0F6FC] dark:hover:bg-[#1C2128]"
              >
                Languages
              </Link>
              <div className="mt-2 flex gap-2 border-t border-slate-200 pt-3 dark:border-[#30363D]">
                {isAuthenticated ? (
                  <>
                    <Link
                      to="/dashboard"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex-1 rounded-lg bg-[#22C55E] px-4 py-2 text-center font-semibold text-[#0D1117]"
                    >
                      Dashboard
                    </Link>
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="rounded-lg border border-slate-300 px-4 py-2 font-medium dark:border-[#30363D]"
                    >
                      Logout
                    </button>
                  </>
                ) : (
                  <>
                    <Link
                      to="/login"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex-1 rounded-lg border border-slate-300 px-4 py-2 text-center font-medium dark:border-[#30363D]"
                    >
                      Sign In
                    </Link>
                    <Link
                      to="/register"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex-1 rounded-lg bg-[#22C55E] px-4 py-2 text-center font-semibold text-[#0D1117]"
                    >
                      Get Started
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden border-b border-slate-200 dark:border-[#30363D]/70">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-24 left-1/2 h-96 w-[44rem] -translate-x-1/2 rounded-full bg-[#22C55E]/15 blur-[120px]"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute bottom-0 right-1/4 h-72 w-96 rounded-full bg-[#38BDF8]/10 blur-[120px]"
        />

        <div className="relative mx-auto max-w-7xl px-4 pb-16 pt-14 sm:px-6 sm:pt-20 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: 'easeOut' }}
            className="mx-auto max-w-3xl text-center"
          >
            <div className="mb-7">
              <CodeClimbLogoLarge />
            </div>

            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#22C55E]/30 bg-[#22C55E]/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-[#22C55E]">
              <Sparkles className="h-3.5 w-3.5" />
              Structured DSA Mastery Platform
            </div>

            <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 dark:text-[#F0F6FC] sm:text-5xl lg:text-6xl">
              Learn. Practice.{' '}
              <span className="bg-gradient-to-r from-[#22C55E] to-[#38BDF8] bg-clip-text text-transparent">
                Climb.
              </span>
            </h1>

            <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-slate-600 dark:text-[#8B949E] sm:text-lg">
              Master Data Structures and Algorithms with a guided topic roadmap, an interactive
              multi-language coding arena, daily streak challenges, spaced-repetition revision, and
              deep progress analytics.
            </p>

            <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link
                to={isAuthenticated ? '/dashboard' : '/register'}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#22C55E] px-7 py-3.5 text-base font-semibold text-[#0D1117] shadow-lg shadow-[#22C55E]/20 transition-all hover:-translate-y-0.5 hover:bg-[#16A34A] sm:w-auto"
              >
                {isAuthenticated ? 'Go to Dashboard' : 'Get Started'}
                <ArrowRight className="h-5 w-5" />
              </Link>
              <Link
                to="/roadmap"
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-7 py-3.5 text-base font-semibold text-slate-800 transition-all hover:-translate-y-0.5 hover:border-[#38BDF8] hover:text-[#38BDF8] dark:border-[#30363D] dark:bg-[#1C2128] dark:text-[#F0F6FC] dark:hover:border-[#38BDF8] sm:w-auto"
              >
                <Map className="h-5 w-5 text-[#38BDF8]" />
                Explore Roadmap
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Interactive DSA Learning Journey & Database-Driven Statistics */}
      <section
        id="journey"
        className="scroll-mt-20 border-b border-slate-200 py-16 dark:border-[#30363D]/70 sm:py-20"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.45, ease: 'easeOut' }}
            className="mx-auto max-w-3xl text-center"
          >
            <span className="text-xs font-semibold uppercase tracking-widest text-[#38BDF8]">
              Interactive Learning Path
            </span>
            <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-slate-900 dark:text-[#F0F6FC] sm:text-4xl">
              Build Your Coding Future.
            </h2>
            <p className="mt-3 text-base text-slate-600 dark:text-[#8B949E] sm:text-lg">
              From your first line of code to advanced algorithms.
            </p>
          </motion.div>

          {/* 4 Live Database-Driven Statistic Cards */}
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {statCards.map((stat, idx) => {
              const Icon = stat.icon;
              return (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 18 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.3 }}
                  transition={{ duration: 0.4, delay: idx * 0.08 }}
                  className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-colors hover:border-[#22C55E]/40 dark:border-[#30363D] dark:bg-[#1C2128]"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-[#8B949E]">
                      {stat.label}
                    </span>
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#22C55E]/25 bg-[#22C55E]/10 text-[#22C55E]">
                      <Icon className="h-4 w-4" />
                    </div>
                  </div>
                  <div className="mt-4 text-4xl font-extrabold tracking-tight text-[#22C55E]">
                    {statsLoading ? (
                      <span className="inline-block h-10 w-16 animate-pulse rounded-lg bg-slate-200 dark:bg-[#30363D]" />
                    ) : (
                      <AnimatedCounter target={stat.value} />
                    )}
                  </div>
                  <p className="mt-1.5 text-xs text-slate-500 dark:text-[#8B949E]">{stat.detail}</p>
                </motion.div>
              );
            })}
          </div>

          {/* 4 Interactive Learning Stages */}
          <div className="relative mt-14">
            {/* Connecting horizontal line on desktop */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute left-10 right-10 top-12 hidden h-0.5 bg-gradient-to-r from-[#22C55E]/40 via-[#38BDF8]/40 to-purple-500/40 lg:block"
            />

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {JOURNEY_STAGES.map((item, idx) => {
                const StageIcon = item.icon;
                return (
                  <motion.div
                    key={item.stage}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.25 }}
                    transition={{ duration: 0.4, delay: idx * 0.08 }}
                    whileHover={{ y: -4 }}
                    className="h-full"
                  >
                    <Link
                      to={`/roadmap?stage=${item.stage}`}
                      className="group relative flex h-full cursor-pointer flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:border-[#22C55E]/60 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-[#22C55E] dark:border-[#30363D] dark:bg-[#1C2128] dark:hover:border-[#22C55E]/60"
                    >
                      <div className="flex items-center justify-between">
                        <div className="relative z-10 flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 dark:border-[#30363D] dark:bg-[#161B22]">
                          <StageIcon className={`h-5 w-5 ${item.accent}`} />
                        </div>
                        <span
                          className={`rounded-full border px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider ${item.badgeBg}`}
                        >
                          Stage {item.step}
                        </span>
                      </div>

                      <h3 className="mt-5 text-lg font-bold text-slate-900 group-hover:text-[#22C55E] dark:text-[#F0F6FC]">
                        {item.title}
                      </h3>
                      <p className="mt-1 text-xs font-medium text-[#38BDF8]">{item.subtitle}</p>

                      <ul className="mt-4 flex-1 space-y-1.5 text-xs text-slate-600 dark:text-[#8B949E]">
                        {item.topics.map((topic) => (
                          <li key={topic} className="flex items-center gap-2">
                            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#22C55E]" />
                            <span>{topic}</span>
                          </li>
                        ))}
                      </ul>

                      <div className="mt-5 inline-flex items-center gap-1.5 text-xs font-semibold text-[#22C55E]">
                        Start {item.title} Stage
                        <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                      </div>
                    </Link>
                  </motion.div>
                );
              })}
            </div>
          </div>

          <div className="mt-10 text-center">
            <Link
              to="/roadmap"
              className="inline-flex items-center gap-2 rounded-xl bg-[#22C55E] px-6 py-3 text-sm font-semibold text-[#0D1117] shadow-md shadow-[#22C55E]/15 transition-all hover:-translate-y-0.5 hover:bg-[#16A34A]"
            >
              <Map className="h-4 w-4" />
              Explore DSA Roadmap
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section — Fully Clickable Feature Cards */}
      <section id="features" className="scroll-mt-20 py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.45, ease: 'easeOut' }}
            className="mx-auto max-w-2xl text-center"
          >
            <span className="text-xs font-semibold uppercase tracking-widest text-[#38BDF8]">
              Built for Mastery
            </span>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-900 dark:text-[#F0F6FC] sm:text-4xl">
              Everything you need to level up in DSA
            </h2>
            <p className="mt-4 text-sm text-slate-600 dark:text-[#8B949E] sm:text-base">
              Go beyond random problem grinding. Follow an intentional progression designed to build
              deep algorithmic intuition.
            </p>
          </motion.div>

          <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map((feature, idx) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.25 }}
                  transition={{ duration: 0.45, delay: idx * 0.08, ease: 'easeOut' }}
                  whileHover={{ y: -4 }}
                  className="h-full"
                >
                  <Link
                    to={feature.to}
                    className="group flex h-full cursor-pointer flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:border-[#22C55E]/60 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-[#22C55E] dark:border-[#30363D] dark:bg-[#1C2128] dark:hover:border-[#22C55E]/60"
                  >
                    <div
                      className={`mb-5 flex h-12 w-12 items-center justify-center rounded-xl border ${feature.bg}`}
                    >
                      <Icon className={`h-6 w-6 ${feature.accent}`} />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 group-hover:text-[#22C55E] dark:text-[#F0F6FC]">
                      {feature.title}
                    </h3>
                    <p className="mt-2.5 flex-1 text-sm leading-relaxed text-slate-600 dark:text-[#8B949E]">
                      {feature.description}
                    </p>
                    <div className="mt-5 inline-flex items-center gap-1.5 text-xs font-semibold text-[#22C55E]">
                      <span>{feature.actionLabel}</span>
                      <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </div>

          {/* Interactive Supported Languages Banner */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.45, ease: 'easeOut' }}
            className="mt-16 rounded-2xl border border-slate-200 bg-white p-6 dark:border-[#30363D] dark:bg-[#161B22] sm:p-8"
          >
            <div className="flex flex-col items-start justify-between gap-6 lg:flex-row lg:items-center">
              <div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-[#F0F6FC]">
                  Code in your preferred language
                </h3>
                <p className="mt-1 text-sm text-slate-600 dark:text-[#8B949E]">
                  Pick a language to explore its DSA guide, syntax examples, and launch the editor
                  pre-configured.
                </p>
              </div>
              <div className="grid w-full grid-cols-2 gap-3 sm:grid-cols-4 lg:w-auto">
                {LANGUAGES.map((lang) => (
                  <Link
                    key={lang.id}
                    to={`/languages/${lang.id}`}
                    className="group flex cursor-pointer flex-col justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5 transition-all hover:-translate-y-0.5 hover:border-[#22C55E]/60 hover:bg-[#22C55E]/5 focus:outline-none focus:ring-2 focus:ring-[#22C55E] dark:border-[#30363D] dark:bg-[#1C2128] dark:hover:border-[#22C55E]/60"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-sm font-bold text-[#22C55E]">{lang.name}</span>
                      <ArrowRight className="h-3.5 w-3.5 text-slate-400 transition-transform group-hover:translate-x-0.5 group-hover:text-[#22C55E]" />
                    </div>
                    <div className="mt-1 text-[11px] leading-snug text-slate-500 dark:text-[#8B949E]">
                      {lang.tag}
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="pb-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, amount: 0.35 }}
            transition={{ duration: 0.45, ease: 'easeOut' }}
            className="relative overflow-hidden rounded-3xl border border-[#22C55E]/30 bg-gradient-to-br from-[#161B22] via-[#1C2128] to-[#0D1117] px-6 py-14 text-center text-[#F0F6FC] shadow-xl sm:px-12"
          >
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
              Ready to start your climb?
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-sm text-[#8B949E] sm:text-base">
              Create your free CodeClimb account and tackle your first DSA module today.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
              <Link
                to={isAuthenticated ? '/dashboard' : '/register'}
                className="inline-flex items-center gap-2 rounded-xl bg-[#22C55E] px-6 py-3 text-sm font-semibold text-[#0D1117] transition-all hover:bg-[#16A34A]"
              >
                {isAuthenticated ? 'Open Dashboard' : 'Create Free Account'}
                <ChevronRight className="h-4 w-4" />
              </Link>
              <Link
                to={isAuthenticated ? '/roadmap' : '/login'}
                className="inline-flex items-center gap-2 rounded-xl border border-[#30363D] bg-[#161B22] px-6 py-3 text-sm font-semibold text-[#F0F6FC] transition-colors hover:border-[#38BDF8] hover:text-[#38BDF8]"
              >
                {isAuthenticated ? 'Explore Roadmap' : 'Sign In'}
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-10 dark:border-[#30363D] dark:bg-[#161B22]">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 text-sm text-slate-500 dark:text-[#8B949E] sm:flex-row sm:px-6 lg:px-8">
          <Link to="/" className="flex items-center gap-2.5">
            <CodeClimbLogoSmall />
            <span className="font-semibold text-slate-800 dark:text-[#F0F6FC]">CodeClimb</span>
            <span>· Learn. Practice. Climb.</span>
          </Link>

          <div className="flex flex-wrap items-center justify-center gap-5">
            <Link to="/roadmap" className="transition-colors hover:text-[#22C55E]">
              Roadmap
            </Link>
            <Link to="/practice" className="transition-colors hover:text-[#22C55E]">
              Practice
            </Link>
            <Link to="/languages/cpp" className="transition-colors hover:text-[#22C55E]">
              Languages
            </Link>
            <Link to="/login" className="transition-colors hover:text-[#22C55E]">
              Login
            </Link>
            <Link to="/register" className="transition-colors hover:text-[#22C55E]">
              Register
            </Link>
          </div>

          <p className="text-xs">
            &copy; {new Date().getFullYear()} CodeClimb. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
