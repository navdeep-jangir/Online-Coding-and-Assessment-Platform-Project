import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Calendar,
  CheckCircle2,
  Clock,
  Code2,
  Flame,
  History,
  Play,
  Sparkles,
  Trophy,
  Zap,
} from 'lucide-react';
import api from '@/services/api';
import { DifficultyBadge } from '@/components/common/DifficultyBadge';
import { LoadingSkeleton } from '@/components/common/LoadingSkeleton';
import { formatDate } from '@/utils/helpers';

interface ChallengeTopic {
  _id: string;
  title: string;
  slug: string;
}

interface ChallengeProblem {
  _id: string;
  title: string;
  slug: string;
  difficulty: 'Easy' | 'Medium' | 'Hard' | string;
  description?: string;
  topics?: ChallengeTopic[];
  tags?: string[];
}

interface TodayChallengePayload {
  _id: string;
  date: string;
  timezone: string;
  problem: ChallengeProblem;
  difficulty: string;
  difficultyPreference: 'Auto' | 'Easy' | 'Medium' | 'Hard';
  xpReward: number;
  completed: boolean;
  completedAt?: string | null;
  xpAwarded: number;
  streak: {
    currentStreak: number;
    longestStreak: number;
    lastActivityDate?: string | null;
  };
}

interface ChallengeHistoryItem {
  _id: string;
  date: string;
  problem: ChallengeProblem | null;
  difficulty: string;
  xpReward: number;
  completed: boolean;
  isMissed?: boolean;
  completedAt?: string | null;
  xpAwarded: number;
}

const DIFFICULTY_OPTIONS: Array<{ value: 'Auto' | 'Easy' | 'Medium' | 'Hard'; label: string }> = [
  { value: 'Auto', label: 'Auto (Progress-Based)' },
  { value: 'Easy', label: 'Easy' },
  { value: 'Medium', label: 'Medium' },
  { value: 'Hard', label: 'Hard' },
];

export default function DailyChallengePage() {
  const [preference, setPreference] = useState<'Auto' | 'Easy' | 'Medium' | 'Hard'>('Auto');
  const [todayData, setTodayData] = useState<TodayChallengePayload | null>(null);
  const [history, setHistory] = useState<ChallengeHistoryItem[]>([]);
  const [totalXpEarned, setTotalXpEarned] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async (pref: string) => {
    setLoading(true);
    setError(null);
    try {
      const [todayRes, historyRes] = await Promise.all([
        api.get<{ success: boolean; data: TodayChallengePayload }>('/daily-challenges/today', {
          params: { difficulty: pref },
        }),
        api.get<{
          success: boolean;
          data: ChallengeHistoryItem[];
          totalXpEarned?: number;
        }>('/daily-challenges/history', { params: { limit: 20 } }),
      ]);

      const todayPayload = todayRes.data?.data;
      setTodayData(todayPayload || null);
      if (todayPayload?.difficultyPreference) {
        setPreference(todayPayload.difficultyPreference);
      }

      setHistory(Array.isArray(historyRes.data?.data) ? historyRes.data.data : []);
      setTotalXpEarned(Number(historyRes.data?.totalXpEarned || 0));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load daily challenge.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData(preference);
  }, [loadData, preference]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0D1117] px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <LoadingSkeleton count={3} />
        </div>
      </div>
    );
  }

  if (error || !todayData) {
    return (
      <div className="min-h-screen bg-[#0D1117] px-4 py-8 text-[#F0F6FC] sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl rounded-xl border border-rose-500/40 bg-rose-500/10 p-6 text-center">
          <p className="text-sm font-medium text-rose-300">{error || 'Daily challenge unavailable.'}</p>
          <button
            type="button"
            onClick={() => void loadData(preference)}
            className="mt-3 rounded-lg bg-rose-500/20 px-4 py-2 text-xs font-semibold text-rose-200 hover:bg-rose-500/30"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const problem = todayData.problem;

  return (
    <div className="min-h-screen bg-[#0D1117] px-4 py-8 text-[#F0F6FC] sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-[#22C55E]/30 bg-[#22C55E]/10 px-3 py-1 text-xs font-medium text-[#22C55E]">
              <Calendar className="h-3.5 w-3.5" />
              {todayData.date} ({todayData.timezone})
            </div>
            <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
              Daily Coding Challenge
            </h1>
            <p className="mt-1 text-sm text-[#8B949E]">
              Solve today&apos;s verified Judge0 challenge to earn +{todayData.xpReward} bonus XP.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <label htmlFor="challenge-pref" className="text-xs text-[#8B949E]">
              Preference:
            </label>
            <select
              id="challenge-pref"
              value={preference}
              onChange={(e) =>
                setPreference(e.target.value as 'Auto' | 'Easy' | 'Medium' | 'Hard')
              }
              className="rounded-lg border border-[#30363D] bg-[#161B22] px-3 py-2 text-xs font-medium text-[#F0F6FC] focus:border-[#22C55E] focus:outline-none"
            >
              {DIFFICULTY_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-[#30363D] bg-[#161B22] p-4">
            <div className="flex items-center gap-2 text-xs text-[#8B949E]">
              <Flame className="h-4 w-4 text-amber-400" />
              Current Streak
            </div>
            <p className="mt-1 text-2xl font-bold text-[#F0F6FC]">
              {todayData.streak?.currentStreak ?? 0}{' '}
              <span className="text-sm font-normal text-[#8B949E]">
                {(todayData.streak?.currentStreak ?? 0) === 1 ? 'day' : 'days'}
              </span>
            </p>
            <p className="mt-1 text-xs text-[#8B949E]">
              No penalties for taking breaks — resume anytime.
            </p>
          </div>

          <div className="rounded-xl border border-[#30363D] bg-[#161B22] p-4">
            <div className="flex items-center gap-2 text-xs text-[#8B949E]">
              <Trophy className="h-4 w-4 text-sky-400" />
              Challenge XP Earned
            </div>
            <p className="mt-1 text-2xl font-bold text-sky-400">+{totalXpEarned} XP</p>
            <p className="mt-1 text-xs text-[#8B949E]">
              Longest streak: {todayData.streak?.longestStreak ?? 0} days
            </p>
          </div>

          <div className="rounded-xl border border-[#30363D] bg-[#161B22] p-4">
            <div className="flex items-center gap-2 text-xs text-[#8B949E]">
              <Zap className="h-4 w-4 text-[#22C55E]" />
              Today&apos;s Status
            </div>
            <p
              className={`mt-1 text-xl font-bold ${
                todayData.completed ? 'text-[#22C55E]' : 'text-amber-300'
              }`}
            >
              {todayData.completed ? 'Completed' : 'Pending'}
            </p>
            <p className="mt-1 text-xs text-[#8B949E]">
              {todayData.completed
                ? `Awarded +${todayData.xpAwarded} bonus XP`
                : 'Requires Accepted Judge0 submission'}
            </p>
          </div>
        </div>

        {/* Today's Challenge Card */}
        <div className="rounded-2xl border border-[#30363D] bg-[#161B22] p-6">
          <div className="flex flex-col justify-between gap-4 border-b border-[#30363D] pb-5 sm:flex-row sm:items-start">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="inline-flex items-center gap-1 rounded-full bg-[#22C55E]/15 px-2.5 py-0.5 text-xs font-semibold text-[#22C55E]">
                  <Sparkles className="h-3 w-3" />
                  Today&apos;s Challenge
                </span>
                <DifficultyBadge difficulty={problem.difficulty} size="sm" />
                <span className="rounded-full border border-sky-500/30 bg-sky-500/10 px-2.5 py-0.5 text-xs font-medium text-sky-300">
                  +{todayData.xpReward} Bonus XP
                </span>
                {todayData.completed && (
                  <span className="inline-flex items-center gap-1 rounded-full border border-[#22C55E]/40 bg-[#22C55E]/15 px-2.5 py-0.5 text-xs font-semibold text-[#22C55E]">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Completed
                  </span>
                )}
              </div>

              <h2 className="text-xl font-bold text-[#F0F6FC] sm:text-2xl">{problem.title}</h2>

              {Array.isArray(problem.topics) && problem.topics.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {problem.topics.map((t) => (
                    <Link
                      key={t._id}
                      to={`/notes/${t.slug}`}
                      className="rounded-md border border-[#30363D] bg-[#0D1117] px-2.5 py-1 text-xs text-[#38BDF8] hover:border-[#38BDF8]/50"
                    >
                      {t.title}
                    </Link>
                  ))}
                </div>
              )}
            </div>

            <Link
              to={`/practice/${problem.slug}`}
              className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-[#22C55E] px-5 py-3 text-sm font-semibold text-[#0D1117] transition hover:bg-[#22C55E]/90"
            >
              <Play className="h-4 w-4" />
              {todayData.completed ? 'Review in Editor' : 'Solve Challenge'}
            </Link>
          </div>

          <div className="mt-5">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[#8B949E]">
              Problem Description
            </h3>
            <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-[#C9D1D9]">
              {problem.description || 'Open the coding workspace to view the full problem statement and test cases.'}
            </p>
          </div>
        </div>

        {/* Challenge History */}
        <div className="rounded-2xl border border-[#30363D] bg-[#161B22] p-6">
          <div className="mb-4 flex items-center gap-2">
            <History className="h-5 w-5 text-[#38BDF8]" />
            <h2 className="text-lg font-semibold">Challenge History</h2>
          </div>

          {history.length === 0 ? (
            <p className="text-sm text-[#8B949E]">No challenge history yet.</p>
          ) : (
            <div className="divide-y divide-[#30363D]">
              {history.map((item) => (
                <div
                  key={`${item._id}-${item.date}`}
                  className="flex flex-col justify-between gap-3 py-3.5 sm:flex-row sm:items-center"
                >
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs text-[#8B949E]">{item.date}</span>
                      {item.problem ? (
                        <Link
                          to={`/practice/${item.problem.slug}`}
                          className="text-sm font-semibold text-[#F0F6FC] hover:text-[#22C55E]"
                        >
                          {item.problem.title}
                        </Link>
                      ) : (
                        <span className="text-sm text-[#8B949E]">Challenge Problem</span>
                      )}
                      <DifficultyBadge difficulty={item.difficulty} size="sm" />
                    </div>
                    {item.completedAt && (
                      <p className="text-xs text-[#8B949E]">
                        Completed on {formatDate(item.completedAt)}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    {item.completed ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-[#22C55E]/15 px-3 py-1 text-xs font-semibold text-[#22C55E]">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Completed (+{item.xpAwarded} XP)
                      </span>
                    ) : (
                      <>
                        <span className="inline-flex items-center gap-1 rounded-full bg-[#0D1117] px-3 py-1 text-xs text-[#8B949E]">
                          <Clock className="h-3.5 w-3.5" />
                          {item.isMissed ? 'Missed (Practice Only)' : 'In Progress'}
                        </span>
                        {item.problem && (
                          <Link
                            to={`/practice/${item.problem.slug}`}
                            className="inline-flex items-center gap-1 rounded-lg border border-[#30363D] bg-[#0D1117] px-3 py-1.5 text-xs font-medium text-[#F0F6FC] hover:border-[#22C55E]/50"
                          >
                            <Code2 className="h-3.5 w-3.5" />
                            Practice
                          </Link>
                        )}
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
