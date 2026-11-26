import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  AlertCircle,
  ArrowRight,
  Bell,
  BookOpen,
  CheckCircle2,
  Clock,
  Code2,
  Compass,
  Flame,
  RefreshCw,
  Sparkles,
  Star,
  Target,
  Trophy,
  Zap,
} from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import StatsCard from '../components/dashboard/StatsCard';
import ActivityChart, { type ActivityDataPoint } from '../components/dashboard/ActivityChart';

interface DifficultyCounts {
  easy: number;
  medium: number;
  hard: number;
}

interface DailyChallengeData {
  id: string;
  slug: string;
  title: string;
  difficulty: string;
  completed: boolean;
  expiresAt?: string;
  remainingSeconds?: number;
  xpReward?: number;
  url?: string;
}

interface RecentSubmissionItem {
  id: string;
  problemId: string;
  problemSlug: string;
  problemTitle: string;
  language: string;
  verdict: string;
  runtime: string;
  submittedAt: string;
  url?: string;
}

interface RevisionItem {
  id: string;
  title: string;
  slug: string;
  type: 'problem' | 'topic';
  dueDate?: string;
  url?: string;
}

interface RevisionReminderData {
  dueCount: number;
  items: RevisionItem[];
  reviewUrl?: string;
}

interface RecommendedTopicData {
  id: string;
  slug: string;
  title: string;
  module: string;
  difficulty: string;
  reason: string;
  url?: string;
}

interface RecommendedProblemItem {
  id: string;
  slug: string;
  title: string;
  difficulty: string;
  xpReward?: number;
  needsRetry?: boolean;
  alreadySolved?: boolean;
}

interface WeakTopicItem {
  topicId: string;
  topicName: string;
  acceptanceRate: number;
  failedSubmissions: number;
  totalSubmissions: number;
}

interface RoadmapProgressData {
  completedTopics: number;
  totalTopics: number;
  completedModules: number;
  totalModules: number;
  percentage: number;
}

interface DashboardData {
  userName: string;
  problemsSolved: number;
  totalProblems: number;
  difficultyBreakdown: DifficultyCounts;
  currentStreak: number;
  longestStreak: number;
  totalXp: number;
  level?: number;
  leaderboardRank: number | null;
  roadmapProgress: RoadmapProgressData;
  weeklyActivity: ActivityDataPoint[];
  dailyChallenge: DailyChallengeData | null;
  recentSubmissions: RecentSubmissionItem[];
  revisionReminders: RevisionReminderData;
  recommendedTopic: RecommendedTopicData | null;
  recommendedProblems: RecommendedProblemItem[];
  weakTopics: WeakTopicItem[];
}

type UnknownRecord = Record<string, unknown>;

function asRecord(val: unknown): UnknownRecord | null {
  return val && typeof val === 'object' && !Array.isArray(val)
    ? (val as UnknownRecord)
    : null;
}

function asString(val: unknown, fallback = ''): string {
  if (typeof val === 'string') return val;
  if (typeof val === 'number' && Number.isFinite(val)) return String(val);
  return fallback;
}

function asNumber(val: unknown, fallback = 0): number {
  if (typeof val === 'number' && Number.isFinite(val)) return val;
  if (typeof val === 'string' && val.trim() !== '') {
    const parsed = Number(val);
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
}

function asNullableNumber(val: unknown): number | null {
  if (val === null || val === undefined || val === '') return null;
  const num = Number(val);
  return Number.isFinite(num) && num > 0 ? num : null;
}

function asBoolean(val: unknown, fallback = false): boolean {
  if (typeof val === 'boolean') return val;
  if (typeof val === 'string') {
    const lower = val.toLowerCase();
    if (lower === 'true' || lower === 'completed' || lower === 'solved') return true;
    if (lower === 'false' || lower === 'pending') return false;
  }
  return fallback;
}

function unwrapApiBody(response: unknown): UnknownRecord {
  const root = asRecord(response);
  if (!root) return {};
  const axiosBody =
    'data' in root && ('status' in root || 'headers' in root || 'config' in root)
      ? asRecord(root.data) ?? root
      : root;
  if ('success' in axiosBody && 'data' in axiosBody) {
    return asRecord(axiosBody.data) ?? axiosBody;
  }
  const nestedData = asRecord(axiosBody.data);
  if (nestedData && Object.keys(axiosBody).length <= 2) {
    return nestedData;
  }
  return axiosBody;
}

function parseDashboardResponse(response: unknown): DashboardData {
  const payload = unwrapApiBody(response);
  const userObj = asRecord(payload.user) ?? asRecord(payload.profile);
  const statsObj = asRecord(payload.stats) ?? asRecord(payload.overview) ?? payload;

  const userName = asString(
    userObj?.name ??
      userObj?.displayName ??
      userObj?.username ??
      payload.userName ??
      payload.name
  );

  // Problems solved + difficulty breakdown
  const solvedRaw = statsObj.problemsSolved ?? payload.problemsSolved ?? statsObj.solved;
  const solvedObj = asRecord(solvedRaw);
  const breakdownObj =
    asRecord(statsObj.difficultyBreakdown) ??
    asRecord(statsObj.solvedByDifficulty) ??
    asRecord(payload.difficultyBreakdown) ??
    asRecord(payload.solvedByDifficulty) ??
    solvedObj;

  const easy = asNumber(
    breakdownObj?.easy ?? breakdownObj?.Easy ?? statsObj.easySolved ?? payload.easySolved,
    0
  );
  const medium = asNumber(
    breakdownObj?.medium ??
      breakdownObj?.Medium ??
      statsObj.mediumSolved ??
      payload.mediumSolved,
    0
  );
  const hard = asNumber(
    breakdownObj?.hard ?? breakdownObj?.Hard ?? statsObj.hardSolved ?? payload.hardSolved,
    0
  );

  const explicitTotalSolved =
    solvedObj !== null
      ? asNumber(solvedObj.total ?? solvedObj.count, easy + medium + hard)
      : asNumber(
          statsObj.totalSolved ??
            statsObj.problemsSolved ??
            payload.totalSolved ??
            payload.problemsSolvedCount,
          easy + medium + hard
        );

  const totalProblems = asNumber(
    statsObj.totalProblems ?? payload.totalProblems ?? solvedObj?.available,
    0
  );

  // Streak
  const streakObj = asRecord(statsObj.streak) ?? asRecord(payload.streak);
  const currentStreak = asNumber(
    streakObj?.current ?? statsObj.currentStreak ?? payload.currentStreak,
    0
  );
  const longestStreak = asNumber(
    streakObj?.longest ?? statsObj.longestStreak ?? payload.longestStreak,
    0
  );

  // XP & Level
  const xpObj = asRecord(statsObj.xp) ?? asRecord(payload.xp);
  const totalXp = asNumber(
    xpObj?.total ?? statsObj.totalXp ?? statsObj.xp ?? payload.totalXp ?? payload.xp,
    0
  );
  const rawLevel = statsObj.level ?? payload.level ?? xpObj?.level;
  const level = rawLevel !== undefined ? asNumber(rawLevel, 0) : undefined;

  // Leaderboard rank
  const leaderboardRank = asNullableNumber(
    statsObj.leaderboardRank ??
      statsObj.rank ??
      payload.leaderboardRank ??
      payload.rank
  );

  // Roadmap completion
  const roadmapObj =
    asRecord(payload.roadmapProgress) ??
    asRecord(payload.roadmap) ??
    asRecord(payload.curriculumProgress);
  const completedTopics = asNumber(
    roadmapObj?.completedTopics ??
      roadmapObj?.completed ??
      payload.completedTopics,
    0
  );
  const totalTopics = asNumber(
    roadmapObj?.totalTopics ?? roadmapObj?.total ?? payload.totalTopics,
    0
  );
  const completedModules = asNumber(roadmapObj?.completedModules, 0);
  const totalModules = asNumber(roadmapObj?.totalModules, 0);
  const rawPct =
    roadmapObj?.percentage ??
    roadmapObj?.completionPercentage ??
    payload.roadmapCompletion;
  const computedPct =
    rawPct !== undefined
      ? Math.min(100, Math.max(0, asNumber(rawPct, 0)))
      : totalTopics > 0
        ? Math.min(100, Math.round((completedTopics / totalTopics) * 100))
        : 0;

  // Weekly activity
  const activityContainer = asRecord(payload.activity);
  const rawWeekly =
    payload.weeklyActivity ??
    activityContainer?.weekly ??
    payload.last7Days ??
    payload.recentActivity;
  const weeklyActivity: ActivityDataPoint[] = Array.isArray(rawWeekly)
    ? rawWeekly
        .map((item) => asRecord(item))
        .filter((item): item is UnknownRecord => item !== null)
        .map((item) => ({
          date: asString(item.date),
          day: asString(item.day ?? item.label ?? item.dayOfWeek),
          label: asString(item.label ?? item.day),
          submissions: asNumber(
            item.submissions ?? item.count ?? item.total ?? item.attempts,
            0
          ),
          accepted:
            item.accepted !== undefined || item.solved !== undefined
              ? asNumber(item.accepted ?? item.solved, 0)
              : undefined,
        }))
    : [];

  // Daily Challenge
  const dcRaw = asRecord(payload.dailyChallenge);
  const dcProblem = asRecord(dcRaw?.problem) ?? dcRaw;
  let dailyChallenge: DailyChallengeData | null = null;
  if (dcRaw && dcProblem && (dcProblem.title || dcProblem.name || dcProblem.slug || dcProblem._id || dcProblem.id)) {
    const dcId = asString(dcProblem._id ?? dcProblem.id ?? dcRaw.problemId ?? dcRaw.id);
    const dcSlug = asString(dcProblem.slug ?? dcRaw.slug ?? dcId);
    dailyChallenge = {
      id: dcId,
      slug: dcSlug,
      title: asString(dcProblem.title ?? dcProblem.name ?? dcRaw.title, 'Daily Challenge'),
      difficulty: asString(dcProblem.difficulty ?? dcRaw.difficulty, 'Medium'),
      completed: asBoolean(
        dcRaw.completed ?? dcRaw.isCompleted ?? dcRaw.status,
        false
      ),
      expiresAt: asString(dcRaw.expiresAt ?? dcRaw.endsAt) || undefined,
      remainingSeconds:
        dcRaw.remainingSeconds !== undefined
          ? asNumber(dcRaw.remainingSeconds, 0)
          : undefined,
      xpReward:
        dcRaw.xpReward !== undefined ? asNumber(dcRaw.xpReward, 0) : undefined,
      url: asString(dcRaw.url ?? dcProblem.url) || undefined,
    };
  }

  // Recent Submissions
  const rawSubs = payload.recentSubmissions ?? payload.submissions;
  const recentSubmissions: RecentSubmissionItem[] = Array.isArray(rawSubs)
    ? rawSubs
        .map((item) => asRecord(item))
        .filter((item): item is UnknownRecord => item !== null)
        .map((item, idx) => {
          const probObj = asRecord(item.problem);
          const pId = asString(
            probObj?._id ?? probObj?.id ?? item.problemId ?? item._id ?? idx
          );
          const pSlug = asString(
            probObj?.slug ?? item.problemSlug ?? item.slug ?? pId
          );
          const runtimeVal = item.runtime ?? item.executionTime ?? item.time;
          const runtimeStr =
            typeof runtimeVal === 'number'
              ? `${runtimeVal} ms`
              : asString(runtimeVal, '—');
          return {
            id: asString(item._id ?? item.id ?? idx),
            problemId: pId,
            problemSlug: pSlug,
            problemTitle: asString(
              probObj?.title ??
                probObj?.name ??
                item.problemTitle ??
                item.problemName ??
                item.title,
              'Untitled Problem'
            ),
            language: asString(item.language ?? item.lang, '—'),
            verdict: asString(item.verdict ?? item.status, 'Pending'),
            runtime: runtimeStr || '—',
            submittedAt: asString(
              item.submittedAt ?? item.createdAt ?? item.date
            ),
            url: asString(item.url ?? probObj?.url) || undefined,
          };
        })
    : [];

  // Revision Reminders
  const revRaw =
    payload.revisionReminders ?? payload.revisions ?? payload.dueRevisions;
  let revisionReminders: RevisionReminderData = { dueCount: 0, items: [] };
  if (typeof revRaw === 'number') {
    revisionReminders = { dueCount: revRaw, items: [] };
  } else if (Array.isArray(revRaw)) {
    const items: RevisionItem[] = revRaw
      .map((item) => asRecord(item))
      .filter((item): item is UnknownRecord => item !== null)
      .map((item, idx) => {
        const target = asRecord(item.problem) ?? asRecord(item.topic) ?? item;
        const id = asString(target._id ?? target.id ?? item._id ?? idx);
        const slug = asString(target.slug ?? item.slug ?? id);
        const typeStr = asString(item.type ?? item.itemType, 'problem').toLowerCase();
        return {
          id,
          slug,
          title: asString(target.title ?? target.name ?? item.title, 'Due Item'),
          type: typeStr === 'topic' ? 'topic' : 'problem',
          dueDate: asString(item.dueDate ?? item.nextReviewAt) || undefined,
          url: asString(item.url ?? target.url) || undefined,
        };
      });
    revisionReminders = { dueCount: items.length, items };
  } else {
    const revObj = asRecord(revRaw);
    if (revObj) {
      const rawItems = revObj.items ?? revObj.dueItems ?? revObj.list;
      const items: RevisionItem[] = Array.isArray(rawItems)
        ? rawItems
            .map((item) => asRecord(item))
            .filter((item): item is UnknownRecord => item !== null)
            .map((item, idx) => {
              const target = asRecord(item.problem) ?? asRecord(item.topic) ?? item;
              const id = asString(target._id ?? target.id ?? item._id ?? idx);
              const slug = asString(target.slug ?? item.slug ?? id);
              const typeStr = asString(item.type ?? item.itemType, 'problem').toLowerCase();
              return {
                id,
                slug,
                title: asString(target.title ?? target.name ?? item.title, 'Due Item'),
                type: typeStr === 'topic' ? 'topic' : 'problem',
                dueDate: asString(item.dueDate ?? item.nextReviewAt) || undefined,
                url: asString(item.url ?? target.url) || undefined,
              };
            })
        : [];
      revisionReminders = {
        dueCount: asNumber(
          revObj.dueCount ?? revObj.count ?? revObj.total,
          items.length
        ),
        items,
        reviewUrl: asString(revObj.url ?? revObj.reviewUrl) || undefined,
      };
    }
  }

  // Recommended Next Topic
  const recRaw =
    asRecord(payload.recommendedTopic) ??
    asRecord(payload.nextTopic) ??
    asRecord(payload.recommendation);
  let recommendedTopic: RecommendedTopicData | null = null;
  if (recRaw && (recRaw.title || recRaw.name || recRaw.slug || recRaw._id || recRaw.id)) {
    const modObj = asRecord(recRaw.module);
    const id = asString(recRaw._id ?? recRaw.id);
    const slug = asString(recRaw.slug ?? id);
    recommendedTopic = {
      id,
      slug,
      title: asString(recRaw.title ?? recRaw.name, 'Next Topic'),
      module: asString(
        modObj?.title ?? modObj?.name ?? recRaw.moduleName ?? recRaw.module,
        ''
      ),
      difficulty: asString(recRaw.difficulty ?? recRaw.level, ''),
      reason: asString(
        recRaw.reason ?? recRaw.recommendationReason ?? recRaw.description,
        ''
      ),
      url: asString(recRaw.url) || undefined,
    };
  }

  const recommendedProblems: RecommendedProblemItem[] = Array.isArray(payload.recommendedProblems)
    ? payload.recommendedProblems
        .map((item) => asRecord(item))
        .filter((item): item is UnknownRecord => item !== null)
        .map((item) => ({
          id: asString(item._id ?? item.id),
          slug: asString(item.slug ?? item._id ?? item.id),
          title: asString(item.title, 'Practice Problem'),
          difficulty: asString(item.difficulty, 'Easy'),
          xpReward: item.xpReward !== undefined ? asNumber(item.xpReward, 10) : undefined,
          needsRetry: Boolean(item.needsRetry),
          alreadySolved: Boolean(item.alreadySolved),
        }))
    : [];

  const weakTopics: WeakTopicItem[] = Array.isArray(payload.weakTopics)
    ? payload.weakTopics
        .map((item) => asRecord(item))
        .filter((item): item is UnknownRecord => item !== null)
        .map((item) => ({
          topicId: asString(item.topicId),
          topicName: asString(item.topicName, 'DSA Topic'),
          acceptanceRate: asNumber(item.acceptanceRate, 0),
          failedSubmissions: asNumber(item.failedSubmissions, 0),
          totalSubmissions: asNumber(item.totalSubmissions, 0),
        }))
    : [];

  return {
    userName,
    problemsSolved: explicitTotalSolved,
    totalProblems,
    difficultyBreakdown: { easy, medium, hard },
    currentStreak,
    longestStreak,
    totalXp,
    level,
    leaderboardRank,
    roadmapProgress: {
      completedTopics,
      totalTopics,
      completedModules,
      totalModules,
      percentage: computedPct,
    },
    weeklyActivity,
    dailyChallenge,
    recentSubmissions,
    revisionReminders,
    recommendedTopic,
    recommendedProblems,
    weakTopics,
  };
}

function getDifficultyBadgeStyle(difficulty: string): string {
  const lower = difficulty.toLowerCase();
  if (lower === 'easy' || lower === 'beginner') {
    return 'border-[#22C55E]/30 bg-[#22C55E]/15 text-[#22C55E]';
  }
  if (lower === 'medium' || lower === 'intermediate') {
    return 'border-amber-500/30 bg-amber-500/15 text-amber-400';
  }
  if (lower === 'hard' || lower === 'advanced') {
    return 'border-red-500/30 bg-red-500/15 text-red-400';
  }
  return 'border-[#30363D] bg-[#161B22] text-[#8B949E]';
}

function getVerdictBadgeStyle(verdict: string): string {
  const lower = verdict.toLowerCase();
  if (lower.includes('accept') || lower === 'ac' || lower === 'passed') {
    return 'border-[#22C55E]/30 bg-[#22C55E]/15 text-[#22C55E]';
  }
  if (lower.includes('time limit') || lower === 'tle') {
    return 'border-amber-500/30 bg-amber-500/15 text-amber-400';
  }
  if (
    lower.includes('wrong') ||
    lower.includes('error') ||
    lower.includes('fail') ||
    lower === 'wa' ||
    lower === 're' ||
    lower === 'ce'
  ) {
    return 'border-red-500/30 bg-red-500/15 text-red-400';
  }
  return 'border-[#30363D] bg-[#161B22] text-[#8B949E]';
}

function formatSubmissionDate(isoOrDate: string): string {
  if (!isoOrDate) return '—';
  const parsed = new Date(isoOrDate);
  if (Number.isNaN(parsed.getTime())) return isoOrDate;
  return parsed.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatCountdown(totalSeconds: number): string {
  const clamped = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(clamped / 3600);
  const minutes = Math.floor((clamped % 3600) / 60);
  const seconds = clamped % 60;
  return [hours, minutes, seconds]
    .map((part) => String(part).padStart(2, '0'))
    .join(':');
}

function computeRemainingSeconds(challenge: DailyChallengeData | null): number {
  if (!challenge) return 0;
  if (challenge.expiresAt) {
    const expiryMs = new Date(challenge.expiresAt).getTime();
    if (!Number.isNaN(expiryMs)) {
      return Math.max(0, Math.floor((expiryMs - Date.now()) / 1000));
    }
  }
  if (challenge.remainingSeconds !== undefined && challenge.remainingSeconds > 0) {
    return challenge.remainingSeconds;
  }
  // Default daily reset at end of current day
  const now = new Date();
  const endOfDay = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    23,
    59,
    59
  );
  return Math.max(0, Math.floor((endOfDay.getTime() - now.getTime()) / 1000));
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6 animate-pulse" aria-busy="true" aria-label="Loading dashboard">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <div className="h-8 w-72 rounded-lg bg-[#1C2128]" />
          <div className="h-4 w-52 rounded-md bg-[#1C2128]" />
        </div>
        <div className="h-10 w-36 rounded-lg bg-[#1C2128]" />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[0, 1, 2, 3].map((idx) => (
          <div
            key={idx}
            className="h-32 rounded-xl border border-[#30363D] bg-[#1C2128] p-5"
          >
            <div className="flex justify-between">
              <div className="space-y-2.5">
                <div className="h-3 w-24 rounded bg-[#30363D]" />
                <div className="h-8 w-20 rounded bg-[#30363D]" />
                <div className="h-3 w-32 rounded bg-[#30363D]" />
              </div>
              <div className="h-11 w-11 rounded-xl bg-[#30363D]" />
            </div>
          </div>
        ))}
      </div>

      <div className="h-24 rounded-xl border border-[#30363D] bg-[#1C2128] p-5">
        <div className="flex justify-between">
          <div className="h-4 w-48 rounded bg-[#30363D]" />
          <div className="h-4 w-16 rounded bg-[#30363D]" />
        </div>
        <div className="mt-4 h-3 w-full rounded-full bg-[#30363D]" />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="h-80 rounded-xl border border-[#30363D] bg-[#1C2128] p-5 lg:col-span-2" />
        <div className="h-80 rounded-xl border border-[#30363D] bg-[#1C2128] p-5" />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="h-72 rounded-xl border border-[#30363D] bg-[#1C2128] p-5 lg:col-span-2" />
        <div className="space-y-6">
          <div className="h-32 rounded-xl border border-[#30363D] bg-[#1C2128] p-5" />
          <div className="h-36 rounded-xl border border-[#30363D] bg-[#1C2128] p-5" />
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [secondsLeft, setSecondsLeft] = useState<number>(0);

  const fetchDashboard = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get('/progress/dashboard');
      const parsed = parseDashboardResponse(response);
      setData(parsed);
      setSecondsLeft(computeRemainingSeconds(parsed.dailyChallenge));
    } catch (err: unknown) {
      const errObj = asRecord(err);
      const errResponse = asRecord(errObj?.response);
      const errData = asRecord(errResponse?.data);
      const message = asString(
        errData?.message ?? errObj?.message,
        'Unable to load your dashboard data right now.'
      );
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchDashboard();
  }, [fetchDashboard]);

  useEffect(() => {
    if (!data?.dailyChallenge || data.dailyChallenge.completed) {
      return;
    }

    const interval = window.setInterval(() => {
      setSecondsLeft((prev) => {
        if (data.dailyChallenge?.expiresAt) {
          return computeRemainingSeconds(data.dailyChallenge);
        }
        return prev > 0 ? prev - 1 : 0;
      });
    }, 1000);

    return () => window.clearInterval(interval);
  }, [data?.dailyChallenge]);

  const welcomeMessage = useMemo(() => {
    const displayName = data?.userName || user?.name;
    if (displayName) {
      return `Welcome back, ${displayName}! 👋`;
    }
    return 'Welcome back! 👋';
  }, [data?.userName, user?.name]);

  const revisionTargetUrl = useMemo(() => {
    if (!data) return '/roadmap';
    if (data.revisionReminders.reviewUrl) return data.revisionReminders.reviewUrl;
    const firstItem = data.revisionReminders.items[0];
    if (firstItem) {
      if (firstItem.url) return firstItem.url;
      return firstItem.type === 'topic'
        ? `/topics/${firstItem.slug}`
        : `/problems/${firstItem.slug}`;
    }
    return '/practice';
  }, [data]);

  return (
    <div className="min-h-screen bg-[#0D1117] px-4 py-6 text-[#F0F6FC] sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        {loading ? (
          <LoadingSkeleton />
        ) : error ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-red-500/30 bg-[#1C2128] px-6 py-16 text-center">
            <AlertCircle className="mb-3 h-10 w-10 text-red-400" />
            <h2 className="text-lg font-semibold text-[#F0F6FC]">
              Failed to load dashboard
            </h2>
            <p className="mt-1 max-w-md text-sm text-[#8B949E]">{error}</p>
            <button
              type="button"
              onClick={() => void fetchDashboard()}
              className="mt-5 inline-flex items-center gap-2 rounded-lg bg-[#22C55E] px-4 py-2 text-sm font-semibold text-[#0D1117] transition hover:bg-[#22C55E]/90"
            >
              <RefreshCw className="h-4 w-4" />
              Try Again
            </button>
          </div>
        ) : !data ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-[#30363D] bg-[#1C2128] px-6 py-16 text-center">
            <Compass className="mb-3 h-10 w-10 text-[#8B949E]" />
            <h2 className="text-lg font-semibold text-[#F0F6FC]">
              No dashboard data available
            </h2>
            <p className="mt-1 text-sm text-[#8B949E]">
              Start solving problems or following the roadmap to track your climb.
            </p>
            <Link
              to="/roadmap"
              className="mt-5 inline-flex items-center gap-2 rounded-lg bg-[#22C55E] px-4 py-2 text-sm font-semibold text-[#0D1117] transition hover:bg-[#22C55E]/90"
            >
              Explore Roadmap
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-[#F0F6FC] sm:text-3xl">
                  {welcomeMessage}
                </h1>
                <p className="mt-1 text-sm text-[#8B949E]">
                  Here&apos;s your learning momentum and coding activity overview.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <Link
                  to="/performance"
                  className="inline-flex items-center gap-2 rounded-lg border border-[#30363D] bg-[#1C2128] px-4 py-2 text-sm font-medium text-[#F0F6FC] transition hover:border-[#8B949E]/50 hover:bg-[#21262D]"
                >
                  View Analytics
                </Link>
                <Link
                  to="/roadmap"
                  className="inline-flex items-center gap-2 rounded-lg bg-[#22C55E] px-4 py-2 text-sm font-semibold text-[#0D1117] transition hover:bg-[#22C55E]/90"
                >
                  Open Roadmap
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>

            {/* Stats Cards Row */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <StatsCard
                icon={CheckCircle2}
                label="Problems Solved"
                value={data.problemsSolved}
                variant="accent"
                subtitle={
                  data.totalProblems > 0
                    ? `of ${data.totalProblems.toLocaleString()} total problems`
                    : undefined
                }
              >
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className="rounded-md bg-[#22C55E]/15 px-2 py-0.5 font-medium text-[#22C55E]">
                    Easy {data.difficultyBreakdown.easy}
                  </span>
                  <span className="rounded-md bg-amber-500/15 px-2 py-0.5 font-medium text-amber-400">
                    Med {data.difficultyBreakdown.medium}
                  </span>
                  <span className="rounded-md bg-red-500/15 px-2 py-0.5 font-medium text-red-400">
                    Hard {data.difficultyBreakdown.hard}
                  </span>
                </div>
              </StatsCard>

              <StatsCard
                icon={Flame}
                label="Current Streak 🔥"
                value={data.currentStreak}
                suffix={data.currentStreak === 1 ? ' day' : ' days'}
                variant="warning"
                subtitle={
                  data.longestStreak > 0
                    ? `Longest streak: ${data.longestStreak} days`
                    : 'Solve a problem daily to build your streak'
                }
              />

              <StatsCard
                icon={Star}
                label="Total XP ⭐"
                value={data.totalXp}
                variant="secondary"
                subtitle={
                  data.level !== undefined && data.level > 0
                    ? `Level ${data.level}`
                    : 'Earned from challenges & practice'
                }
              />

              <StatsCard
                icon={Trophy}
                label="Leaderboard Rank 🏆"
                value={data.leaderboardRank !== null ? `#${data.leaderboardRank}` : '—'}
                variant="purple"
                subtitle={
                  <Link
                    to="/leaderboard"
                    className="inline-flex items-center gap-1 text-[#38BDF8] hover:underline"
                  >
                    View full standings
                    <ArrowRight className="h-3 w-3" />
                  </Link>
                }
              />
            </div>

            {/* Roadmap Completion Progress Bar */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="rounded-xl border border-[#30363D] bg-[#1C2128] p-5"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#22C55E]/15 text-[#22C55E]">
                    <Target className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-semibold text-[#F0F6FC]">
                      Roadmap Completion
                    </h2>
                    <p className="text-xs text-[#8B949E]">
                      {data.roadmapProgress.totalTopics > 0
                        ? `${data.roadmapProgress.completedTopics} of ${data.roadmapProgress.totalTopics} topics completed`
                        : 'Track your structured DSA curriculum progress'}
                      {data.roadmapProgress.totalModules > 0
                        ? ` • ${data.roadmapProgress.completedModules}/${data.roadmapProgress.totalModules} modules`
                        : ''}
                    </p>
                  </div>
                </div>
                <span className="font-mono text-lg font-bold text-[#22C55E]">
                  {data.roadmapProgress.percentage}%
                </span>
              </div>

              <div
                className="mt-4 h-3 w-full overflow-hidden rounded-full bg-[#0D1117]"
                role="progressbar"
                aria-valuenow={data.roadmapProgress.percentage}
                aria-valuemin={0}
                aria-valuemax={100}
              >
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${data.roadmapProgress.percentage}%` }}
                  transition={{ duration: 0.8, ease: 'easeOut' }}
                  className="h-full rounded-full bg-gradient-to-r from-[#22C55E] to-[#38BDF8]"
                />
              </div>
            </motion.div>

            {/* Weekly Activity Chart + Daily Challenge */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              <div className="lg:col-span-2">
                <ActivityChart
                  data={data.weeklyActivity}
                  type="bar"
                  title="Weekly Activity"
                  subtitle="Submissions over the last 7 days"
                  height={270}
                  emptyMessage="No submissions in the last 7 days. Solve your first problem today!"
                />
              </div>

              {/* Daily Challenge Card */}
              <div className="flex flex-col justify-between rounded-xl border border-[#30363D] bg-[#1C2128] p-5">
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-[#22C55E]">
                      <Zap className="h-3.5 w-3.5" />
                      Daily Challenge
                    </span>
                    {data.dailyChallenge ? (
                      <span
                        className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium ${
                          data.dailyChallenge.completed
                            ? 'border-[#22C55E]/30 bg-[#22C55E]/15 text-[#22C55E]'
                            : 'border-amber-500/30 bg-amber-500/15 text-amber-400'
                        }`}
                      >
                        {data.dailyChallenge.completed ? (
                          <>
                            <CheckCircle2 className="h-3 w-3" />
                            Completed
                          </>
                        ) : (
                          'Pending'
                        )}
                      </span>
                    ) : null}
                  </div>

                  {data.dailyChallenge ? (
                    <div className="mt-4 space-y-4">
                      <div>
                        <h3 className="text-lg font-bold text-[#F0F6FC]">
                          {data.dailyChallenge.title}
                        </h3>
                        <div className="mt-2 flex flex-wrap items-center gap-2">
                          <span
                            className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${getDifficultyBadgeStyle(
                              data.dailyChallenge.difficulty
                            )}`}
                          >
                            {data.dailyChallenge.difficulty}
                          </span>
                          {data.dailyChallenge.xpReward ? (
                            <span className="rounded-full border border-[#38BDF8]/30 bg-[#38BDF8]/10 px-2.5 py-0.5 text-xs font-medium text-[#38BDF8]">
                              +{data.dailyChallenge.xpReward} XP
                            </span>
                          ) : null}
                        </div>
                      </div>

                      <div className="rounded-lg border border-[#30363D] bg-[#0D1117] p-3.5">
                        <div className="flex items-center justify-between text-xs text-[#8B949E]">
                          <span className="flex items-center gap-1.5">
                            <Clock className="h-3.5 w-3.5 text-[#38BDF8]" />
                            Time Remaining
                          </span>
                          <span className="font-mono text-sm font-semibold text-[#F0F6FC]">
                            {data.dailyChallenge.completed
                              ? 'Done for today'
                              : formatCountdown(secondsLeft)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-6 flex flex-col items-center justify-center rounded-lg border border-dashed border-[#30363D] bg-[#0D1117]/60 px-4 py-8 text-center">
                      <Zap className="mb-2 h-7 w-7 text-[#8B949E]/60" />
                      <p className="text-sm font-medium text-[#8B949E]">
                        No daily challenge available right now.
                      </p>
                    </div>
                  )}
                </div>

                {data.dailyChallenge ? (
                  <Link
                    to={
                      data.dailyChallenge.url ||
                      `/practice/${data.dailyChallenge.slug || data.dailyChallenge.id}`
                    }
                    className={`mt-5 inline-flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition ${
                      data.dailyChallenge.completed
                        ? 'border border-[#30363D] bg-[#0D1117] text-[#F0F6FC] hover:border-[#22C55E]/50'
                        : 'bg-[#22C55E] text-[#0D1117] hover:bg-[#22C55E]/90'
                    }`}
                  >
                    {data.dailyChallenge.completed ? 'Review Solution' : 'Solve Now'}
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                ) : null}
              </div>
            </div>

            {/* Recent Submissions + Revision Reminders + Recommended Next Topic */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              {/* Recent Submissions Table */}
              <div className="rounded-xl border border-[#30363D] bg-[#1C2128] p-5 lg:col-span-2">
                <div className="mb-4 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Code2 className="h-5 w-5 text-[#22C55E]" />
                    <h2 className="text-base font-semibold text-[#F0F6FC]">
                      Recent Submissions
                    </h2>
                  </div>
                  <Link
                    to="/performance"
                    className="text-xs font-medium text-[#38BDF8] hover:underline"
                  >
                    Full history
                  </Link>
                </div>

                {data.recentSubmissions.length === 0 ? (
                  <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-[#30363D] bg-[#0D1117]/60 px-4 py-12 text-center">
                    <Code2 className="mb-2 h-8 w-8 text-[#8B949E]/60" />
                    <p className="text-sm font-medium text-[#F0F6FC]">
                      No submissions yet
                    </p>
                    <p className="mt-1 text-xs text-[#8B949E]">
                      Pick a problem from the roadmap or daily challenge to submit your first solution.
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[540px] text-left text-sm">
                      <thead>
                        <tr className="border-b border-[#30363D] text-xs uppercase tracking-wider text-[#8B949E]">
                          <th className="pb-3 pr-4 font-medium">Problem</th>
                          <th className="pb-3 pr-4 font-medium">Language</th>
                          <th className="pb-3 pr-4 font-medium">Verdict</th>
                          <th className="pb-3 pr-4 font-medium">Runtime</th>
                          <th className="pb-3 font-medium">Date</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#30363D]/60">
                        {data.recentSubmissions.map((sub) => (
                          <tr
                            key={sub.id}
                            className="transition-colors hover:bg-[#0D1117]/50"
                          >
                            <td className="py-3 pr-4 font-medium">
                              <Link
                                to={
                                  sub.url ||
                                  `/practice/${sub.problemSlug || sub.problemId}`
                                }
                                className="text-[#F0F6FC] transition hover:text-[#22C55E]"
                              >
                                {sub.problemTitle}
                              </Link>
                            </td>
                            <td className="py-3 pr-4">
                              <span className="rounded bg-[#0D1117] px-2 py-0.5 font-mono text-xs text-[#8B949E]">
                                {sub.language}
                              </span>
                            </td>
                            <td className="py-3 pr-4">
                              <span
                                className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-medium ${getVerdictBadgeStyle(
                                  sub.verdict
                                )}`}
                              >
                                {sub.verdict}
                              </span>
                            </td>
                            <td className="py-3 pr-4 font-mono text-xs text-[#8B949E]">
                              {sub.runtime}
                            </td>
                            <td className="py-3 text-xs text-[#8B949E]">
                              {formatSubmissionDate(sub.submittedAt)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Right Column: Revision Reminders & Recommended Next Topic */}
              <div className="space-y-6">
                {/* Revision Reminders */}
                <div className="rounded-xl border border-[#30363D] bg-[#1C2128] p-5">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Bell className="h-5 w-5 text-amber-400" />
                      <h2 className="text-base font-semibold text-[#F0F6FC]">
                        Revision Reminders
                      </h2>
                    </div>
                    <span
                      className={`rounded-full px-2.5 py-0.5 font-mono text-xs font-semibold ${
                        data.revisionReminders.dueCount > 0
                          ? 'bg-amber-500/15 text-amber-400'
                          : 'bg-[#22C55E]/15 text-[#22C55E]'
                      }`}
                    >
                      {data.revisionReminders.dueCount} due
                    </span>
                  </div>

                  {data.revisionReminders.dueCount === 0 ? (
                    <div className="mt-4 rounded-lg border border-dashed border-[#30363D] bg-[#0D1117]/60 p-4 text-center">
                      <p className="text-sm font-medium text-[#F0F6FC]">
                        All caught up!
                      </p>
                      <p className="mt-1 text-xs text-[#8B949E]">
                        No spaced-repetition reviews due right now.
                      </p>
                    </div>
                  ) : (
                    <div className="mt-4 space-y-3">
                      <p className="text-xs text-[#8B949E]">
                        You have{' '}
                        <span className="font-semibold text-[#F0F6FC]">
                          {data.revisionReminders.dueCount}
                        </span>{' '}
                        {data.revisionReminders.dueCount === 1 ? 'item' : 'items'} ready
                        for spaced repetition review.
                      </p>
                      {data.revisionReminders.items.length > 0 ? (
                        <ul className="space-y-1.5">
                          {data.revisionReminders.items.slice(0, 3).map((item) => (
                            <li
                              key={item.id}
                              className="flex items-center justify-between rounded-md bg-[#0D1117] px-3 py-1.5 text-xs"
                            >
                              <span className="truncate text-[#F0F6FC]">
                                {item.title}
                              </span>
                              <span className="ml-2 shrink-0 capitalize text-[#8B949E]">
                                {item.type}
                              </span>
                            </li>
                          ))}
                        </ul>
                      ) : null}
                      <Link
                        to={revisionTargetUrl}
                        className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-amber-500/15 px-4 py-2 text-sm font-semibold text-amber-300 transition hover:bg-amber-500/25"
                      >
                        Review Now
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    </div>
                  )}
                </div>

                {/* Recommended Next Topic Card */}
                <div className="rounded-xl border border-[#30363D] bg-[#1C2128] p-5">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-[#22C55E]" />
                    <h2 className="text-base font-semibold text-[#F0F6FC]">
                      Recommended Next Topic
                    </h2>
                  </div>

                  {data.recommendedTopic ? (
                    <div className="mt-4 space-y-3">
                      <div>
                        <h3 className="text-base font-bold text-[#F0F6FC]">
                          {data.recommendedTopic.title}
                        </h3>
                        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                          {data.recommendedTopic.module ? (
                            <span className="inline-flex items-center gap-1 rounded-md bg-[#0D1117] px-2.5 py-1 text-[#8B949E]">
                              <BookOpen className="h-3 w-3 text-[#38BDF8]" />
                              {data.recommendedTopic.module}
                            </span>
                          ) : null}
                          {data.recommendedTopic.difficulty ? (
                            <span
                              className={`rounded-full border px-2.5 py-0.5 font-medium ${getDifficultyBadgeStyle(
                                data.recommendedTopic.difficulty
                              )}`}
                            >
                              {data.recommendedTopic.difficulty}
                            </span>
                          ) : null}
                        </div>
                      </div>

                      {data.recommendedTopic.reason ? (
                        <p className="rounded-lg bg-[#0D1117] p-3 text-xs leading-relaxed text-[#8B949E]">
                          {data.recommendedTopic.reason}
                        </p>
                      ) : null}

                      <Link
                        to={
                          data.recommendedTopic.url ||
                          `/notes/${data.recommendedTopic.slug || data.recommendedTopic.id}`
                        }
                        className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#22C55E] px-4 py-2.5 text-sm font-semibold text-[#0D1117] transition hover:bg-[#22C55E]/90"
                      >
                        Continue Learning
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    </div>
                  ) : (
                    <div className="mt-4 rounded-lg border border-dashed border-[#30363D] bg-[#0D1117]/60 p-4 text-center">
                      <p className="text-sm font-medium text-[#8B949E]">
                        No recommendation available yet.
                      </p>
                      <Link
                        to="/roadmap"
                        className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-[#22C55E] hover:underline"
                      >
                        Browse curriculum
                        <ArrowRight className="h-3 w-3" />
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Recommended Practice Problems & Weak DSA Topics */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              {/* Recommended Practice Problems */}
              <div className="rounded-xl border border-[#30363D] bg-[#1C2128] p-5">
                <div className="mb-4 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Target className="h-5 w-5 text-[#22C55E]" />
                    <h2 className="text-base font-semibold text-[#F0F6FC]">
                      Recommended Practice Problems
                    </h2>
                  </div>
                  <Link
                    to="/practice"
                    className="text-xs font-medium text-[#38BDF8] hover:underline"
                  >
                    All problems
                  </Link>
                </div>

                {data.recommendedProblems.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-[#30363D] bg-[#0D1117]/60 p-5 text-center">
                    <p className="text-sm text-[#8B949E]">
                      Complete or open your recommended topic to unlock targeted practice problems.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {data.recommendedProblems.map((prob) => (
                      <Link
                        key={prob.id || prob.slug}
                        to={`/practice/${prob.slug}`}
                        className="flex items-center justify-between gap-3 rounded-lg border border-[#30363D] bg-[#0D1117] px-3.5 py-2.5 transition hover:border-[#22C55E]/50"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-[#F0F6FC]">
                            {prob.title}
                          </p>
                          <div className="mt-1 flex items-center gap-2 text-xs text-[#8B949E]">
                            <span
                              className={`rounded-full border px-2 py-0.5 text-[11px] font-medium ${getDifficultyBadgeStyle(
                                prob.difficulty
                              )}`}
                            >
                              {prob.difficulty}
                            </span>
                            {prob.needsRetry && (
                              <span className="text-amber-300">Needs retry</span>
                            )}
                            {prob.xpReward ? <span>+{prob.xpReward} XP</span> : null}
                          </div>
                        </div>
                        <ArrowRight className="h-4 w-4 shrink-0 text-[#8B949E]" />
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              {/* Weak DSA Topics */}
              <div className="rounded-xl border border-[#30363D] bg-[#1C2128] p-5">
                <div className="mb-4 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 text-rose-400" />
                    <h2 className="text-base font-semibold text-[#F0F6FC]">
                      Weak DSA Topics
                    </h2>
                  </div>
                  <Link
                    to="/revision"
                    className="text-xs font-medium text-[#38BDF8] hover:underline"
                  >
                    Revision Mode
                  </Link>
                </div>

                {data.weakTopics.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-[#30363D] bg-[#0D1117]/60 p-5 text-center">
                    <p className="text-sm font-medium text-[#F0F6FC]">
                      No weak topics detected yet
                    </p>
                    <p className="mt-1 text-xs text-[#8B949E]">
                      Topics with &lt; 60% acceptance rate across your submissions appear here for targeted practice.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {data.weakTopics.map((wt) => (
                      <div
                        key={wt.topicId}
                        className="flex items-center justify-between gap-3 rounded-lg border border-[#30363D] bg-[#0D1117] px-3.5 py-2.5"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-[#F0F6FC]">
                            {wt.topicName}
                          </p>
                          <p className="mt-0.5 text-xs text-[#8B949E]">
                            {wt.acceptanceRate}% acceptance ({wt.failedSubmissions} failed of{' '}
                            {wt.totalSubmissions})
                          </p>
                        </div>
                        <Link
                          to="/revision?filter=incorrect"
                          className="shrink-0 rounded-md border border-rose-500/30 bg-rose-500/10 px-2.5 py-1 text-xs font-medium text-rose-300 hover:bg-rose-500/20"
                        >
                          Practice
                        </Link>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
