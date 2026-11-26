import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertCircle,
  ArrowRight,
  Award,
  BarChart3,
  Calendar,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Code2,
  Download,
  ExternalLink,
  Eye,
  Flame,
  Layers,
  Percent,
  Printer,
  RefreshCw,
  Search,
  Sparkles,
  TrendingDown,
  TrendingUp,
  Trophy,
  X,
} from 'lucide-react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart as RechartsPieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import api from '../services/api';
import StatsCard from '../components/dashboard/StatsCard';
import ActivityChart, { type ActivityDataPoint } from '../components/dashboard/ActivityChart';

interface DifficultySlice {
  name: string;
  value: number;
  total?: number;
  color: string;
}

interface TopicPerformanceItem {
  id: string;
  slug: string;
  name: string;
  solved: number;
  attempts: number;
  acceptanceRate: number;
  url?: string;
}

interface LanguageSlice {
  name: string;
  value: number;
  percentage: number;
  color: string;
}

interface CalendarDay {
  date: string;
  count: number;
  level: 0 | 1 | 2 | 3 | 4;
}

interface SubmissionHistoryRow {
  id: string;
  problemId: string;
  problemSlug: string;
  problemTitle: string;
  difficulty: string;
  language: string;
  verdict: string;
  passedTestCases: number;
  totalTestCases: number;
  runtime: string;
  memory: string;
  submittedAt: string;
  code?: string;
  errorMessage?: string;
  compilerOutput?: string;
  url?: string;
}

interface AchievementItem {
  _id: string;
  key: string;
  title: string;
  description: string;
  iconName: string;
  xpReward: number;
  earned: boolean;
  earnedAt?: string | null;
  progress: number;
  threshold: number;
  progressPct: number;
}

interface VerdictSlice {
  verdict: string;
  count: number;
  color: string;
}

interface XpGrowthPoint {
  date: string;
  xp: number;
  delta: number;
}

interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface PerformanceData {
  userName: string;
  preferredLanguage: string;
  overview: {
    totalSolved: number;
    totalSubmissions: number;
    acceptedSubmissions: number;
    incorrectSubmissions: number;
    acceptanceRate: number;
    currentStreak: number;
    longestStreak: number;
    averageRuntime: string;
    activeDays: number;
    xp: number;
    rank: number | null;
  };
  difficultyBreakdown: DifficultySlice[];
  topicPerformance: TopicPerformanceItem[];
  languageDistribution: LanguageSlice[];
  weeklyActivity: ActivityDataPoint[];
  monthlyCalendar: CalendarDay[];
  verdictDistribution: VerdictSlice[];
  xpGrowth: XpGrowthPoint[];
  roadmapCompletion: {
    completedTopics: number;
    totalTopics: number;
    percentage: number;
  };
  dailyChallengeStats: {
    completed: number;
    totalAttempts: number;
    totalXp: number;
  };
  revisionStats: {
    total: number;
    completed: number;
    dueToday: number;
  };
  achievements: AchievementItem[];
  recommendedNext: {
    topicTitle: string | null;
    topicSlug: string | null;
    reason: string;
  } | null;
  strongTopics: TopicPerformanceItem[];
  weakTopics: TopicPerformanceItem[];
  submissionHistory: SubmissionHistoryRow[];
  pagination: PaginationMeta;
  serverPaginated: boolean;
}

type UnknownRecord = Record<string, unknown>;

const PAGE_SIZE = 10;

const DIFFICULTY_COLORS: Record<string, string> = {
  easy: '#22C55E',
  medium: '#F59E0B',
  hard: '#EF4444',
};

const LANGUAGE_PALETTE = [
  '#22C55E',
  '#38BDF8',
  '#F59E0B',
  '#A855F7',
  '#EC4899',
  '#14B8A6',
  '#6366F1',
];

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

function computeHeatmapLevel(count: number, maxCount: number): 0 | 1 | 2 | 3 | 4 {
  if (count <= 0) return 0;
  if (maxCount <= 1) return 4;
  const ratio = count / maxCount;
  if (ratio <= 0.25) return 1;
  if (ratio <= 0.5) return 2;
  if (ratio <= 0.75) return 3;
  return 4;
}

function parseTopicItem(item: UnknownRecord, idx: number): TopicPerformanceItem {
  const topicObj = asRecord(item.topic);
  const id = asString(topicObj?._id ?? topicObj?.id ?? item.topicId ?? item._id ?? item.id ?? idx);
  const slug = asString(topicObj?.slug ?? item.slug ?? item.topicSlug ?? id);
  const name = asString(
    topicObj?.title ??
      topicObj?.name ??
      item.topicName ??
      item.name ??
      item.title ??
      item.topic,
    `Topic ${idx + 1}`
  );
  const solved = asNumber(item.solved ?? item.accepted ?? item.completed, 0);
  const attempts = asNumber(
    item.attempts ?? item.totalSubmissions ?? item.submissions ?? item.total,
    solved
  );
  const rawRate = item.acceptanceRate ?? item.accuracy ?? item.rate;
  const acceptanceRate =
    rawRate !== undefined
      ? Math.round(asNumber(rawRate, 0) * 10) / 10
      : attempts > 0
        ? Math.round((solved / attempts) * 1000) / 10
        : 0;

  return {
    id,
    slug,
    name,
    solved,
    attempts,
    acceptanceRate,
    url: asString(item.url ?? topicObj?.url) || undefined,
  };
}

function parsePerformanceResponse(response: unknown, requestedPage: number): PerformanceData {
  const payload = unwrapApiBody(response);
  const overviewObj =
    asRecord(payload.overview) ??
    asRecord(payload.summary) ??
    asRecord(payload.stats) ??
    payload;

  const totalSolved = asNumber(
    overviewObj.totalSolved ?? overviewObj.problemsSolved ?? overviewObj.solved,
    0
  );
  const totalSubmissions = asNumber(
    overviewObj.totalSubmissions ?? overviewObj.submissionsCount ?? overviewObj.submissions,
    0
  );
  const acceptedSubmissions = asNumber(
    overviewObj.acceptedSubmissions ?? overviewObj.acceptedCount ?? overviewObj.accepted,
    0
  );
  const rawAccRate = overviewObj.acceptanceRate ?? overviewObj.accuracy;
  const acceptanceRate =
    rawAccRate !== undefined
      ? Math.round(asNumber(rawAccRate, 0) * 10) / 10
      : totalSubmissions > 0
        ? Math.round(((acceptedSubmissions || totalSolved) / totalSubmissions) * 1000) / 10
        : 0;

  const streakObj = asRecord(overviewObj.streak) ?? asRecord(payload.streak);
  const currentStreak = asNumber(
    streakObj?.current ?? overviewObj.currentStreak ?? payload.currentStreak,
    0
  );
  const longestStreak = asNumber(
    streakObj?.longest ?? overviewObj.longestStreak ?? payload.longestStreak,
    0
  );
  const avgRuntimeRaw = overviewObj.averageRuntime ?? overviewObj.avgRuntime;
  const averageRuntime =
    typeof avgRuntimeRaw === 'number'
      ? `${Math.round(avgRuntimeRaw)} ms`
      : asString(avgRuntimeRaw, '—');
  const activeDays = asNumber(
    overviewObj.activeDays ?? payload.activeDays,
    0
  );

  // Problems by difficulty
  const diffRaw =
    payload.problemsByDifficulty ??
    payload.difficultyBreakdown ??
    payload.byDifficulty ??
    overviewObj.difficultyBreakdown;
  let difficultyBreakdown: DifficultySlice[] = [];
  if (Array.isArray(diffRaw)) {
    difficultyBreakdown = diffRaw
      .map((item) => asRecord(item))
      .filter((item): item is UnknownRecord => item !== null)
      .map((item) => {
        const label = asString(item.difficulty ?? item.name ?? item.label, 'Unknown');
        const key = label.toLowerCase();
        return {
          name: label.charAt(0).toUpperCase() + label.slice(1),
          value: asNumber(item.solved ?? item.count ?? item.value, 0),
          total: item.total !== undefined ? asNumber(item.total, 0) : undefined,
          color: DIFFICULTY_COLORS[key] ?? '#38BDF8',
        };
      });
  } else {
    const diffObj = asRecord(diffRaw);
    if (diffObj) {
      const levels: Array<'easy' | 'medium' | 'hard'> = ['easy', 'medium', 'hard'];
      difficultyBreakdown = levels.map((lvl) => {
        const cap = lvl.charAt(0).toUpperCase() + lvl.slice(1);
        const entry = diffObj[lvl] ?? diffObj[cap];
        const entryObj = asRecord(entry);
        const value = entryObj
          ? asNumber(entryObj.solved ?? entryObj.count ?? entryObj.value, 0)
          : asNumber(entry, 0);
        const total =
          entryObj && entryObj.total !== undefined
            ? asNumber(entryObj.total, 0)
            : undefined;
        return {
          name: cap,
          value,
          total,
          color: DIFFICULTY_COLORS[lvl],
        };
      });
    }
  }

  // Topic performance
  const rawTopics =
    payload.topicPerformance ??
    payload.topicsPerformance ??
    payload.byTopic ??
    payload.topics;
  const topicPerformance: TopicPerformanceItem[] = Array.isArray(rawTopics)
    ? rawTopics
        .map((item) => asRecord(item))
        .filter((item): item is UnknownRecord => item !== null)
        .map(parseTopicItem)
    : [];

  // Language distribution
  const rawLangs =
    payload.languageDistribution ??
    payload.languages ??
    payload.byLanguage;
  let languageDistribution: LanguageSlice[] = [];
  if (Array.isArray(rawLangs)) {
    const parsedLangs = rawLangs
      .map((item) => asRecord(item))
      .filter((item): item is UnknownRecord => item !== null)
      .map((item, idx) => ({
        name: asString(item.language ?? item.name ?? item.label, `Language ${idx + 1}`),
        value: asNumber(item.count ?? item.submissions ?? item.solved ?? item.value, 0),
        percentage: asNumber(item.percentage, 0),
        color: LANGUAGE_PALETTE[idx % LANGUAGE_PALETTE.length],
      }))
      .filter((l) => l.value > 0);

    const sumLang = parsedLangs.reduce((acc, item) => acc + item.value, 0);
    languageDistribution = parsedLangs.map((item) => ({
      ...item,
      percentage:
        item.percentage > 0
          ? Math.round(item.percentage * 10) / 10
          : sumLang > 0
            ? Math.round((item.value / sumLang) * 1000) / 10
            : 0,
    }));
  } else {
    const langObj = asRecord(rawLangs);
    if (langObj) {
      const entries = Object.entries(langObj)
        .map(([name, val], idx) => ({
          name,
          value: asNumber(val, 0),
          color: LANGUAGE_PALETTE[idx % LANGUAGE_PALETTE.length],
        }))
        .filter((l) => l.value > 0);
      const sumLang = entries.reduce((acc, item) => acc + item.value, 0);
      languageDistribution = entries.map((item) => ({
        ...item,
        percentage: sumLang > 0 ? Math.round((item.value / sumLang) * 1000) / 10 : 0,
      }));
    }
  }

  // Weekly activity (12 weeks)
  const rawWeekly =
    payload.weeklyActivity ??
    payload.weeklyTrend ??
    payload.last12Weeks ??
    asRecord(payload.activity)?.weekly;
  const weeklyActivity: ActivityDataPoint[] = Array.isArray(rawWeekly)
    ? rawWeekly
        .map((item) => asRecord(item))
        .filter((item): item is UnknownRecord => item !== null)
        .map((item, idx) => ({
          date: asString(item.startDate ?? item.date),
          week: asString(item.week ?? item.label ?? `W${idx + 1}`),
          label: asString(item.label ?? item.week ?? item.startDate ?? `W${idx + 1}`),
          submissions: asNumber(item.submissions ?? item.count ?? item.total, 0),
          accepted:
            item.accepted !== undefined || item.solved !== undefined
              ? asNumber(item.accepted ?? item.solved, 0)
              : undefined,
        }))
    : [];

  // Monthly activity calendar heatmap
  const rawCalendar =
    payload.monthlyCalendar ??
    payload.calendarHeatmap ??
    payload.activityCalendar ??
    payload.monthlyActivity ??
    payload.heatmap ??
    payload.dailyActivity;
  let monthlyCalendar: CalendarDay[] = [];
  if (Array.isArray(rawCalendar)) {
    const rawDays = rawCalendar
      .map((item) => asRecord(item))
      .filter((item): item is UnknownRecord => item !== null)
      .map((item) => ({
        date: asString(item.date ?? item.day),
        count: asNumber(item.count ?? item.submissions ?? item.solved ?? item.value, 0),
        explicitLevel: item.level !== undefined ? asNumber(item.level, -1) : -1,
      }))
      .filter((d) => d.date !== '');

    const maxCount = rawDays.reduce((m, d) => Math.max(m, d.count), 0);
    monthlyCalendar = rawDays.map((d) => ({
      date: d.date,
      count: d.count,
      level:
        d.explicitLevel >= 0 && d.explicitLevel <= 4
          ? (d.explicitLevel as 0 | 1 | 2 | 3 | 4)
          : computeHeatmapLevel(d.count, maxCount),
    }));
  }

  // Strong & Weak topics
  const rawStrong = payload.strongTopics;
  const rawWeak = payload.weakTopics;
  const strongTopics: TopicPerformanceItem[] = Array.isArray(rawStrong)
    ? rawStrong
        .map((item) => asRecord(item))
        .filter((item): item is UnknownRecord => item !== null)
        .map(parseTopicItem)
    : topicPerformance
        .filter((t) => t.attempts > 0 && t.acceptanceRate >= 70)
        .sort((a, b) => b.acceptanceRate - a.acceptanceRate)
        .slice(0, 5);

  const weakTopics: TopicPerformanceItem[] = Array.isArray(rawWeak)
    ? rawWeak
        .map((item) => asRecord(item))
        .filter((item): item is UnknownRecord => item !== null)
        .map(parseTopicItem)
    : topicPerformance
        .filter((t) => t.attempts > 0 && t.acceptanceRate < 60)
        .sort((a, b) => a.acceptanceRate - b.acceptanceRate)
        .slice(0, 5);

  const verdictDistribution: VerdictSlice[] = Array.isArray(payload.verdictDistribution)
    ? payload.verdictDistribution
        .map((item) => asRecord(item))
        .filter((item): item is UnknownRecord => item !== null)
        .map((item) => {
          const v = asString(item.verdict, 'Pending');
          const lower = v.toLowerCase();
          const color = lower.includes('accept')
            ? '#22C55E'
            : lower.includes('time')
              ? '#F59E0B'
              : lower.includes('compil')
                ? '#A855F7'
                : '#EF4444';
          return {
            verdict: v,
            count: asNumber(item.count, 0),
            color,
          };
        })
    : [];

  const xpGrowth: XpGrowthPoint[] = Array.isArray(payload.xpGrowth)
    ? payload.xpGrowth
        .map((item) => asRecord(item))
        .filter((item): item is UnknownRecord => item !== null)
        .map((item) => ({
          date: asString(item.date),
          xp: asNumber(item.xp, 0),
          delta: asNumber(item.delta, 0),
        }))
    : [];

  const roadmapObj = asRecord(payload.roadmapCompletion);
  const dcObj = asRecord(payload.dailyChallengeStats);
  const revObj = asRecord(payload.revisionStats);
  const recObj = asRecord(payload.recommendedNext);

  const achievements: AchievementItem[] = Array.isArray(payload.achievements)
    ? payload.achievements
        .map((item) => asRecord(item))
        .filter((item): item is UnknownRecord => item !== null)
        .map((item, idx) => ({
          _id: asString(item._id ?? idx),
          key: asString(item.key),
          title: asString(item.title, 'Achievement'),
          description: asString(item.description),
          iconName: asString(item.iconName, 'Award'),
          xpReward: asNumber(item.xpReward, 0),
          earned: Boolean(item.earned),
          earnedAt: asString(item.earnedAt) || null,
          progress: asNumber(item.progress, 0),
          threshold: asNumber(item.threshold, 1),
          progressPct: asNumber(item.progressPct, 0),
        }))
    : [];

  // Submission history + pagination
  const rawSubContainer = payload.submissionHistory ?? payload.submissions;
  const subContainerObj = asRecord(rawSubContainer);
  const rawSubList = Array.isArray(rawSubContainer)
    ? rawSubContainer
    : subContainerObj?.items ??
      subContainerObj?.data ??
      subContainerObj?.docs ??
      subContainerObj?.submissions ??
      [];

  const submissionHistory: SubmissionHistoryRow[] = Array.isArray(rawSubList)
    ? rawSubList
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
          const memoryVal = item.memory ?? item.memoryUsage;
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
            difficulty: asString(
              probObj?.difficulty ?? item.difficulty,
              '—'
            ),
            language: asString(item.language ?? item.lang, '—'),
            verdict: asString(item.verdict ?? item.status, 'Pending'),
            passedTestCases: asNumber(item.passedTestCases, 0),
            totalTestCases: asNumber(item.totalTestCases, 0),
            runtime:
              typeof runtimeVal === 'number'
                ? `${runtimeVal} ms`
                : asString(runtimeVal, '—'),
            memory:
              typeof memoryVal === 'number'
                ? `${Math.round(memoryVal)} KB`
                : asString(memoryVal, '—'),
            submittedAt: asString(
              item.submittedAt ?? item.createdAt ?? item.date
            ),
            code: asString(item.code) || undefined,
            errorMessage: asString(item.errorMessage) || undefined,
            compilerOutput: asString(item.compilerOutput) || undefined,
            url: asString(item.url ?? probObj?.url) || undefined,
          };
        })
    : [];

  const pagObj =
    asRecord(payload.pagination) ??
    asRecord(subContainerObj?.pagination) ??
    subContainerObj;
  const totalFromMeta = asNumber(
    pagObj?.total ?? pagObj?.totalDocs ?? pagObj?.totalItems,
    submissionHistory.length
  );
  const limitFromMeta = asNumber(pagObj?.limit ?? pagObj?.pageSize, PAGE_SIZE);
  const totalPagesFromMeta = asNumber(
    pagObj?.totalPages ?? pagObj?.pages,
    Math.max(1, Math.ceil(totalFromMeta / Math.max(1, limitFromMeta)))
  );
  const pageFromMeta = asNumber(pagObj?.page ?? pagObj?.currentPage, requestedPage);
  const serverPaginated =
    Boolean(pagObj && (pagObj.totalPages !== undefined || pagObj.total !== undefined)) &&
    totalFromMeta > submissionHistory.length;

  return {
    userName: asString(payload.userName, 'Student'),
    preferredLanguage: asString(payload.preferredLanguage, 'cpp'),
    overview: {
      totalSolved,
      totalSubmissions,
      acceptedSubmissions,
      incorrectSubmissions: asNumber(
        overviewObj.incorrectSubmissions,
        Math.max(0, totalSubmissions - acceptedSubmissions)
      ),
      acceptanceRate,
      currentStreak,
      longestStreak,
      averageRuntime,
      activeDays,
      xp: asNumber(overviewObj.xp, 0),
      rank: overviewObj.rank !== null && overviewObj.rank !== undefined ? asNumber(overviewObj.rank, 0) : null,
    },
    difficultyBreakdown,
    topicPerformance,
    languageDistribution,
    weeklyActivity,
    monthlyCalendar,
    verdictDistribution,
    xpGrowth,
    roadmapCompletion: {
      completedTopics: asNumber(roadmapObj?.completedTopics, 0),
      totalTopics: asNumber(roadmapObj?.totalTopics, 0),
      percentage: asNumber(roadmapObj?.percentage, 0),
    },
    dailyChallengeStats: {
      completed: asNumber(dcObj?.completed, 0),
      totalAttempts: asNumber(dcObj?.totalAttempts, 0),
      totalXp: asNumber(dcObj?.totalXp, 0),
    },
    revisionStats: {
      total: asNumber(revObj?.total, 0),
      completed: asNumber(revObj?.completed, 0),
      dueToday: asNumber(revObj?.dueToday, 0),
    },
    achievements,
    recommendedNext: recObj
      ? {
          topicTitle: asString(recObj.topicTitle) || null,
          topicSlug: asString(recObj.topicSlug) || null,
          reason: asString(recObj.reason),
        }
      : null,
    strongTopics,
    weakTopics,
    submissionHistory,
    pagination: {
      page: pageFromMeta,
      limit: limitFromMeta,
      total: totalFromMeta,
      totalPages: totalPagesFromMeta,
    },
    serverPaginated,
  };
}

function getHeatmapCellClass(level: 0 | 1 | 2 | 3 | 4): string {
  switch (level) {
    case 1:
      return 'bg-[#22C55E]/25 border-[#22C55E]/30';
    case 2:
      return 'bg-[#22C55E]/50 border-[#22C55E]/50';
    case 3:
      return 'bg-[#22C55E]/75 border-[#22C55E]/75';
    case 4:
      return 'bg-[#22C55E] border-[#22C55E]';
    default:
      return 'bg-[#161B22] border-[#30363D]';
  }
}

function getVerdictBadgeClass(verdict: string): string {
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

function getDifficultyTextClass(difficulty: string): string {
  const lower = difficulty.toLowerCase();
  if (lower === 'easy') return 'text-[#22C55E]';
  if (lower === 'medium') return 'text-amber-400';
  if (lower === 'hard') return 'text-red-400';
  return 'text-[#8B949E]';
}

function escapeCsvCell(value: string | number): string {
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function formatDateTime(value: string): string {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

interface ChartTooltipItem {
  name?: string;
  value?: number | string;
  color?: string;
  payload?: UnknownRecord;
}

interface ChartTooltipProps {
  active?: boolean;
  payload?: ChartTooltipItem[];
  label?: string | number;
}

function DarkChartTooltip({ active, payload, label }: ChartTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;
  const first = payload[0];
  return (
    <div className="rounded-lg border border-[#30363D] bg-[#161B22] px-3 py-2 text-xs shadow-xl">
      {label ? (
        <p className="mb-1 font-semibold text-[#F0F6FC]">{String(label)}</p>
      ) : null}
      {payload.map((entry, idx) => (
        <div key={idx} className="flex items-center justify-between gap-4">
          <span className="text-[#8B949E]">{entry.name ?? first?.name}</span>
          <span className="font-mono font-semibold text-[#F0F6FC]">
            {typeof entry.value === 'number'
              ? entry.value.toLocaleString()
              : entry.value}
          </span>
        </div>
      ))}
    </div>
  );
}

function PerformanceSkeleton() {
  return (
    <div className="space-y-6 animate-pulse" aria-busy="true" aria-label="Loading performance analytics">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <div className="h-8 w-64 rounded-lg bg-[#1C2128]" />
          <div className="h-4 w-80 rounded bg-[#1C2128]" />
        </div>
        <div className="flex gap-2">
          <div className="h-10 w-32 rounded-lg bg-[#1C2128]" />
          <div className="h-10 w-32 rounded-lg bg-[#1C2128]" />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[0, 1, 2, 3].map((idx) => (
          <div
            key={idx}
            className="h-32 rounded-xl border border-[#30363D] bg-[#1C2128] p-5"
          />
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {[0, 1, 2].map((idx) => (
          <div
            key={idx}
            className="h-72 rounded-xl border border-[#30363D] bg-[#1C2128] p-5"
          />
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="h-80 rounded-xl border border-[#30363D] bg-[#1C2128] p-5" />
        <div className="h-80 rounded-xl border border-[#30363D] bg-[#1C2128] p-5" />
      </div>
    </div>
  );
}

export default function PerformancePage() {
  const [data, setData] = useState<PerformanceData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [range, setRange] = useState<'7d' | '30d' | 'all'>('all');
  const [page, setPage] = useState<number>(1);
  const [subSearch, setSubSearch] = useState<string>('');
  const [subLanguage, setSubLanguage] = useState<string>('all');
  const [subVerdict, setSubVerdict] = useState<string>('all');
  const [subSort, setSubSort] = useState<'newest' | 'oldest' | 'runtime'>('newest');
  const [selectedSubmission, setSelectedSubmission] = useState<SubmissionHistoryRow | null>(null);
  const [hoveredDay, setHoveredDay] = useState<CalendarDay | null>(null);

  const fetchPerformance = useCallback(
    async (targetPage: number) => {
      setLoading(true);
      setError(null);
      try {
        const response = await api.get('/progress/performance', {
          params: {
            page: targetPage,
            limit: PAGE_SIZE,
            range,
            ...(subSearch.trim() ? { search: subSearch.trim() } : {}),
            ...(subLanguage !== 'all' ? { language: subLanguage } : {}),
            ...(subVerdict !== 'all' ? { verdict: subVerdict } : {}),
            sortBy: subSort,
          },
        });
        const parsed = parsePerformanceResponse(response, targetPage);
        setData(parsed);
      } catch (err: unknown) {
        const errObj = asRecord(err);
        const errResp = asRecord(errObj?.response);
        const errData = asRecord(errResp?.data);
        setError(
          asString(
            errData?.message ?? errObj?.message,
            'Failed to load performance analytics.'
          )
        );
      } finally {
        setLoading(false);
      }
    },
    [range, subSearch, subLanguage, subVerdict, subSort]
  );

  useEffect(() => {
    void fetchPerformance(page);
  }, [fetchPerformance, page]);

  const totalDifficultySolved = useMemo(() => {
    if (!data) return 0;
    return data.difficultyBreakdown.reduce((acc, item) => acc + item.value, 0);
  }, [data]);

  const paginatedSubmissions = useMemo(() => {
    if (!data) return [];
    if (data.serverPaginated) {
      return data.submissionHistory;
    }
    const start = (page - 1) * PAGE_SIZE;
    return data.submissionHistory.slice(start, start + PAGE_SIZE);
  }, [data, page]);

  const totalPages = useMemo(() => {
    if (!data) return 1;
    if (data.serverPaginated) {
      return Math.max(1, data.pagination.totalPages);
    }
    return Math.max(1, Math.ceil(data.submissionHistory.length / PAGE_SIZE));
  }, [data]);

  const totalSubmissionsCount = useMemo(() => {
    if (!data) return 0;
    return data.serverPaginated
      ? data.pagination.total
      : data.submissionHistory.length;
  }, [data]);

  const handlePageChange = (nextPage: number) => {
    if (nextPage < 1 || nextPage > totalPages || nextPage === page) return;
    setPage(nextPage);
  };

  const handleExportCsv = async () => {
    if (!data) return;
    try {
      const res = await api.get('/progress/export', {
        params: { range },
        responseType: 'blob',
      });
      const blob = new Blob([res.data], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute(
        'download',
        `codeclimb-progress-report-${range}-${new Date().toISOString().slice(0, 10)}.csv`
      );
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch {
      // Fallback client CSV if export endpoint fails
      const lines: string[] = [];
      lines.push('Section,Metric,Value');
      lines.push(['Overview', 'Problems Solved', data.overview.totalSolved].map(escapeCsvCell).join(','));
      lines.push(['Overview', 'Total Submissions', data.overview.totalSubmissions].map(escapeCsvCell).join(','));
      lines.push(['Overview', 'Acceptance Rate (%)', data.overview.acceptanceRate].map(escapeCsvCell).join(','));
      const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `codeclimb-performance-${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
  };

  const handlePrintReport = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-[#0D1117] px-4 py-6 text-[#F0F6FC] sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        {loading && !data ? (
          <PerformanceSkeleton />
        ) : error && !data ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-red-500/30 bg-[#1C2128] px-6 py-16 text-center">
            <AlertCircle className="mb-3 h-10 w-10 text-red-400" />
            <h2 className="text-lg font-semibold text-[#F0F6FC]">
              Unable to load performance analytics
            </h2>
            <p className="mt-1 max-w-md text-sm text-[#8B949E]">{error}</p>
            <button
              type="button"
              onClick={() => void fetchPerformance(page)}
              className="mt-5 inline-flex items-center gap-2 rounded-lg bg-[#22C55E] px-4 py-2 text-sm font-semibold text-[#0D1117] transition hover:bg-[#22C55E]/90"
            >
              <RefreshCw className="h-4 w-4" />
              Retry
            </button>
          </div>
        ) : !data ? null : (
          <div className="space-y-6">
            {/* Header & Export Actions */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-[#F0F6FC] sm:text-3xl">
                  Performance Analytics
                </h1>
                <p className="mt-1 text-sm text-[#8B949E]">
                  Detailed breakdown of your problem-solving accuracy, topic mastery, and coding cadence.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2.5 print:hidden">
                <div className="inline-flex rounded-lg border border-[#30363D] bg-[#1C2128] p-0.5">
                  {[
                    { id: '7d' as const, label: 'Last 7 Days' },
                    { id: '30d' as const, label: 'Last 30 Days' },
                    { id: 'all' as const, label: 'All Time' },
                  ].map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => {
                        setRange(opt.id);
                        setPage(1);
                      }}
                      className={`rounded-md px-3 py-1.5 text-xs font-medium transition ${
                        range === opt.id
                          ? 'bg-[#22C55E] text-[#0D1117]'
                          : 'text-[#8B949E] hover:text-[#F0F6FC]'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => void handleExportCsv()}
                  className="inline-flex items-center gap-2 rounded-lg border border-[#30363D] bg-[#1C2128] px-4 py-2 text-sm font-medium text-[#F0F6FC] transition hover:border-[#22C55E]/50 hover:bg-[#21262D]"
                >
                  <Download className="h-4 w-4 text-[#22C55E]" />
                  Export CSV
                </button>
                <button
                  type="button"
                  onClick={handlePrintReport}
                  className="inline-flex items-center gap-2 rounded-lg bg-[#22C55E] px-4 py-2 text-sm font-semibold text-[#0D1117] transition hover:bg-[#22C55E]/90"
                >
                  <Printer className="h-4 w-4" />
                  Print Report
                </button>
              </div>
            </div>

            {/* Overall Stats Cards */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <StatsCard
                icon={CheckCircle2}
                label="Problems Solved"
                value={data.overview.totalSolved}
                variant="accent"
                subtitle={`${data.overview.totalSubmissions.toLocaleString()} total submissions`}
              />
              <StatsCard
                icon={Percent}
                label="Acceptance Rate"
                value={data.overview.acceptanceRate}
                suffix="%"
                decimals={1}
                variant="secondary"
                subtitle={
                  data.overview.acceptedSubmissions > 0
                    ? `${data.overview.acceptedSubmissions.toLocaleString()} accepted runs`
                    : 'Across all submitted attempts'
                }
              />
              <StatsCard
                icon={Flame}
                label="Current Streak"
                value={data.overview.currentStreak}
                suffix={data.overview.currentStreak === 1 ? ' day' : ' days'}
                variant="warning"
                subtitle={`Longest: ${data.overview.longestStreak} days`}
              />
              <StatsCard
                icon={Award}
                label="Active Coding Days"
                value={data.overview.activeDays}
                variant="purple"
                subtitle={`Avg runtime: ${data.overview.averageRuntime}`}
              />
            </div>

            {/* Charts Row 1: Difficulty Donut, Language Pie, Topic Bar */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              {/* Problems by Difficulty Donut Chart */}
              <div className="rounded-xl border border-[#30363D] bg-[#1C2128] p-5">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <h2 className="text-base font-semibold text-[#F0F6FC]">
                      Problems by Difficulty
                    </h2>
                    <p className="text-xs text-[#8B949E]">Solved distribution</p>
                  </div>
                  <Layers className="h-4 w-4 text-[#8B949E]" />
                </div>

                {totalDifficultySolved === 0 ? (
                  <div className="flex h-60 flex-col items-center justify-center rounded-lg border border-dashed border-[#30363D] bg-[#0D1117]/60 text-center">
                    <p className="text-sm text-[#8B949E]">No solved problems yet</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="relative h-52 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <RechartsPieChart>
                          <Pie
                            data={data.difficultyBreakdown}
                            dataKey="value"
                            nameKey="name"
                            cx="50%"
                            cy="50%"
                            innerRadius={56}
                            outerRadius={82}
                            paddingAngle={4}
                            stroke="none"
                          >
                            {data.difficultyBreakdown.map((slice) => (
                              <Cell key={slice.name} fill={slice.color} />
                            ))}
                          </Pie>
                          <Tooltip content={<DarkChartTooltip />} />
                        </RechartsPieChart>
                      </ResponsiveContainer>
                      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-2xl font-bold text-[#F0F6FC]">
                          {totalDifficultySolved}
                        </span>
                        <span className="text-xs text-[#8B949E]">Solved</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-center">
                      {data.difficultyBreakdown.map((slice) => (
                        <div
                          key={slice.name}
                          className="rounded-lg bg-[#0D1117] px-2 py-2"
                        >
                          <div className="flex items-center justify-center gap-1.5 text-xs text-[#8B949E]">
                            <span
                              className="h-2 w-2 rounded-full"
                              style={{ backgroundColor: slice.color }}
                            />
                            {slice.name}
                          </div>
                          <p className="mt-1 font-mono text-sm font-bold text-[#F0F6FC]">
                            {slice.value}
                            {slice.total ? (
                              <span className="text-xs font-normal text-[#8B949E]">
                                /{slice.total}
                              </span>
                            ) : null}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Language Distribution Pie Chart */}
              <div className="rounded-xl border border-[#30363D] bg-[#1C2128] p-5">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <h2 className="text-base font-semibold text-[#F0F6FC]">
                      Language Distribution
                    </h2>
                    <p className="text-xs text-[#8B949E]">Submissions by language</p>
                  </div>
                  <Code2 className="h-4 w-4 text-[#8B949E]" />
                </div>

                {data.languageDistribution.length === 0 ? (
                  <div className="flex h-60 flex-col items-center justify-center rounded-lg border border-dashed border-[#30363D] bg-[#0D1117]/60 text-center">
                    <p className="text-sm text-[#8B949E]">No language data yet</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="h-52 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <RechartsPieChart>
                          <Pie
                            data={data.languageDistribution}
                            dataKey="value"
                            nameKey="name"
                            cx="50%"
                            cy="50%"
                            outerRadius={82}
                            paddingAngle={2}
                            stroke="none"
                          >
                            {data.languageDistribution.map((lang) => (
                              <Cell key={lang.name} fill={lang.color} />
                            ))}
                          </Pie>
                          <Tooltip content={<DarkChartTooltip />} />
                        </RechartsPieChart>
                      </ResponsiveContainer>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      {data.languageDistribution.slice(0, 6).map((lang) => (
                        <div
                          key={lang.name}
                          className="flex items-center justify-between rounded-lg bg-[#0D1117] px-3 py-1.5 text-xs"
                        >
                          <span className="flex items-center gap-1.5 truncate text-[#F0F6FC]">
                            <span
                              className="h-2.5 w-2.5 shrink-0 rounded-full"
                              style={{ backgroundColor: lang.color }}
                            />
                            <span className="truncate">{lang.name}</span>
                          </span>
                          <span className="ml-2 font-mono text-[#8B949E]">
                            {lang.percentage}%
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Topic-wise Performance Bar Chart */}
              <div className="rounded-xl border border-[#30363D] bg-[#1C2128] p-5">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <h2 className="text-base font-semibold text-[#F0F6FC]">
                      Topic-wise Performance
                    </h2>
                    <p className="text-xs text-[#8B949E]">Accuracy (%) per topic</p>
                  </div>
                  <BarChart3 className="h-4 w-4 text-[#8B949E]" />
                </div>

                {data.topicPerformance.length === 0 ? (
                  <div className="flex h-60 flex-col items-center justify-center rounded-lg border border-dashed border-[#30363D] bg-[#0D1117]/60 text-center">
                    <p className="text-sm text-[#8B949E]">No topic metrics available yet</p>
                  </div>
                ) : (
                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={data.topicPerformance.slice(0, 8)}
                        layout="vertical"
                        margin={{ top: 4, right: 16, left: 4, bottom: 4 }}
                      >
                        <CartesianGrid
                          stroke="#30363D"
                          strokeDasharray="3 3"
                          horizontal={false}
                        />
                        <XAxis
                          type="number"
                          domain={[0, 100]}
                          stroke="#8B949E"
                          fontSize={11}
                          tickLine={false}
                          axisLine={false}
                          unit="%"
                        />
                        <YAxis
                          type="category"
                          dataKey="name"
                          width={96}
                          stroke="#8B949E"
                          fontSize={11}
                          tickLine={false}
                          axisLine={false}
                        />
                        <Tooltip
                          content={<DarkChartTooltip />}
                          cursor={{ fill: 'rgba(240, 246, 252, 0.04)' }}
                        />
                        <Bar
                          dataKey="acceptanceRate"
                          name="Acceptance %"
                          fill="#22C55E"
                          radius={[0, 6, 6, 0]}
                          barSize={16}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>
            </div>

            {/* Row 2: 12-Week Activity Line Chart + Monthly Activity Calendar Heatmap */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <ActivityChart
                data={data.weeklyActivity}
                type="line"
                title="Weekly Activity Trend"
                subtitle="Submissions across the last 12 weeks"
                height={260}
                emptyMessage="No weekly trend data available yet."
              />

              {/* Monthly Activity Calendar Heatmap */}
              <div className="rounded-xl border border-[#30363D] bg-[#1C2128] p-5">
                <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h2 className="flex items-center gap-2 text-base font-semibold text-[#F0F6FC]">
                      <Calendar className="h-4 w-4 text-[#22C55E]" />
                      Monthly Activity Calendar
                    </h2>
                    <p className="mt-0.5 text-xs text-[#8B949E]">
                      {hoveredDay
                        ? `${hoveredDay.date}: ${hoveredDay.count} ${
                            hoveredDay.count === 1 ? 'submission' : 'submissions'
                          }`
                        : 'Hover over any day cell to inspect activity'}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 text-[11px] text-[#8B949E]">
                    <span>Less</span>
                    {([0, 1, 2, 3, 4] as const).map((lvl) => (
                      <span
                        key={lvl}
                        className={`h-3 w-3 rounded-sm border ${getHeatmapCellClass(lvl)}`}
                      />
                    ))}
                    <span>More</span>
                  </div>
                </div>

                {data.monthlyCalendar.length === 0 ? (
                  <div className="flex h-60 flex-col items-center justify-center rounded-lg border border-dashed border-[#30363D] bg-[#0D1117]/60 text-center">
                    <Calendar className="mb-2 h-8 w-8 text-[#8B949E]/60" />
                    <p className="text-sm text-[#8B949E]">
                      No daily calendar activity recorded yet.
                    </p>
                  </div>
                ) : (
                  <div className="rounded-lg border border-[#30363D] bg-[#0D1117] p-4">
                    <div
                      className={
                        data.monthlyCalendar.length > 42
                          ? 'flex flex-wrap gap-1.5'
                          : 'grid grid-cols-7 gap-2 sm:gap-2.5'
                      }
                    >
                      {data.monthlyCalendar.map((day) => (
                        <button
                          key={day.date}
                          type="button"
                          onMouseEnter={() => setHoveredDay(day)}
                          onFocus={() => setHoveredDay(day)}
                          onMouseLeave={() => setHoveredDay(null)}
                          title={`${day.date}: ${day.count} submissions`}
                          aria-label={`${day.date}: ${day.count} submissions`}
                          className={`${
                            data.monthlyCalendar.length > 42
                              ? 'h-4 w-4 rounded-sm'
                              : 'aspect-square w-full rounded-md'
                          } border transition-transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-[#22C55E]/60 ${getHeatmapCellClass(
                            day.level
                          )}`}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Row 3: Strong Topics & Weak Topics */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              {/* Strong Topics */}
              <div className="rounded-xl border border-[#30363D] bg-[#1C2128] p-5">
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-[#22C55E]" />
                    <div>
                      <h2 className="text-base font-semibold text-[#F0F6FC]">
                        Strong Topics
                      </h2>
                      <p className="text-xs text-[#8B949E]">
                        High acceptance rate areas
                      </p>
                    </div>
                  </div>
                </div>

                {data.strongTopics.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-[#30363D] bg-[#0D1117]/60 px-4 py-10 text-center text-sm text-[#8B949E]">
                    Complete more topic problems to identify your strengths.
                  </div>
                ) : (
                  <ul className="space-y-3">
                    {data.strongTopics.map((topic) => (
                      <li
                        key={topic.id}
                        className="rounded-lg border border-[#30363D] bg-[#0D1117] p-3.5"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-medium text-[#F0F6FC]">
                            {topic.name}
                          </span>
                          <span className="rounded-full bg-[#22C55E]/15 px-2.5 py-0.5 font-mono text-xs font-semibold text-[#22C55E]">
                            {topic.acceptanceRate}%
                          </span>
                        </div>
                        <div className="mt-2 flex items-center justify-between text-xs text-[#8B949E]">
                          <span>
                            {topic.solved} solved / {topic.attempts} attempts
                          </span>
                        </div>
                        <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-[#1C2128]">
                          <div
                            className="h-full rounded-full bg-[#22C55E]"
                            style={{
                              width: `${Math.min(100, Math.max(0, topic.acceptanceRate))}%`,
                            }}
                          />
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Weak Topics */}
              <div className="rounded-xl border border-[#30363D] bg-[#1C2128] p-5">
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <TrendingDown className="h-5 w-5 text-red-400" />
                    <div>
                      <h2 className="text-base font-semibold text-[#F0F6FC]">
                        Weak Topics
                      </h2>
                      <p className="text-xs text-[#8B949E]">
                        Lower acceptance rate — recommended for practice
                      </p>
                    </div>
                  </div>
                </div>

                {data.weakTopics.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-[#30363D] bg-[#0D1117]/60 px-4 py-10 text-center text-sm text-[#8B949E]">
                    No weak topics flagged right now. Keep climbing!
                  </div>
                ) : (
                  <ul className="space-y-3">
                    {data.weakTopics.map((topic) => (
                      <li
                        key={topic.id}
                        className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-[#30363D] bg-[#0D1117] p-3.5"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="truncate font-medium text-[#F0F6FC]">
                              {topic.name}
                            </span>
                            <span className="rounded-full bg-red-500/15 px-2 py-0.5 font-mono text-xs font-semibold text-red-400">
                              {topic.acceptanceRate}%
                            </span>
                          </div>
                          <p className="mt-1 text-xs text-[#8B949E]">
                            {topic.solved} solved / {topic.attempts} attempts
                          </p>
                        </div>

                        <Link
                          to={topic.url || `/practice?topic=${encodeURIComponent(topic.slug)}`}
                          className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-[#22C55E]/40 bg-[#22C55E]/15 px-3 py-1.5 text-xs font-semibold text-[#22C55E] transition hover:bg-[#22C55E] hover:text-[#0D1117]"
                        >
                          Practice
                          <ArrowRight className="h-3.5 w-3.5" />
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            {/* Print-Only Formal Header */}
            <div className="hidden border-b border-gray-300 pb-3 text-black print:block">
              <h2 className="text-xl font-bold">CodeClimb Student Performance Report</h2>
              <p className="text-xs">
                Student: {data.userName} • Generated: {new Date().toLocaleDateString()} • Period:{' '}
                {range === '7d' ? 'Last 7 Days' : range === '30d' ? 'Last 30 Days' : 'All Time'} •
                Preferred Language: {data.preferredLanguage.toUpperCase()}
              </p>
            </div>

            {/* Secondary Metrics: XP, Rank, Roadmap, Daily Challenge, Revision */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-xl border border-[#30363D] bg-[#1C2128] p-4">
                <p className="text-xs text-[#8B949E]">Total XP &amp; Global Rank</p>
                <p className="mt-1 text-xl font-bold text-[#38BDF8]">
                  {data.overview.xp.toLocaleString()} XP
                </p>
                <p className="mt-1 text-xs text-[#8B949E]">
                  Rank {data.overview.rank ? `#${data.overview.rank}` : 'Unranked'} •{' '}
                  {data.preferredLanguage.toUpperCase()} preferred
                </p>
              </div>
              <div className="rounded-xl border border-[#30363D] bg-[#1C2128] p-4">
                <p className="text-xs text-[#8B949E]">Roadmap Progress (Manual/Verified)</p>
                <p className="mt-1 text-xl font-bold text-[#22C55E]">
                  {data.roadmapCompletion.percentage}%
                </p>
                <p className="mt-1 text-xs text-[#8B949E]">
                  {data.roadmapCompletion.completedTopics} / {data.roadmapCompletion.totalTopics} concepts
                </p>
              </div>
              <div className="rounded-xl border border-[#30363D] bg-[#1C2128] p-4">
                <p className="text-xs text-[#8B949E]">Daily Challenge Performance</p>
                <p className="mt-1 text-xl font-bold text-[#F0F6FC]">
                  {data.dailyChallengeStats.completed} completed
                </p>
                <p className="mt-1 text-xs text-[#8B949E]">
                  +{data.dailyChallengeStats.totalXp} bonus XP earned
                </p>
              </div>
              <div className="rounded-xl border border-[#30363D] bg-[#1C2128] p-4">
                <p className="text-xs text-[#8B949E]">Smart Revision Summary</p>
                <p className="mt-1 text-xl font-bold text-amber-300">
                  {data.revisionStats.completed} revised
                </p>
                <p className="mt-1 text-xs text-[#8B949E]">
                  {data.revisionStats.dueToday} due today • {data.revisionStats.total} total queued
                </p>
              </div>
            </div>

            {/* Submission Verdict Distribution & XP Growth Over Time */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <div className="rounded-xl border border-[#30363D] bg-[#1C2128] p-5">
                <h2 className="text-base font-semibold text-[#F0F6FC]">
                  Submission Verdict Distribution
                </h2>
                <p className="mb-4 text-xs text-[#8B949E]">
                  Verified Judge0 outcomes ({data.overview.acceptedSubmissions} accepted,{' '}
                  {data.overview.incorrectSubmissions} non-accepted)
                </p>
                {data.verdictDistribution.length === 0 ? (
                  <div className="flex h-48 items-center justify-center rounded-lg border border-dashed border-[#30363D] bg-[#0D1117]/60 text-sm text-[#8B949E]">
                    No submission verdicts recorded in this period.
                  </div>
                ) : (
                  <div className="h-52">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={data.verdictDistribution}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#30363D" />
                        <XAxis dataKey="verdict" tick={{ fill: '#8B949E', fontSize: 11 }} />
                        <YAxis allowDecimals={false} tick={{ fill: '#8B949E', fontSize: 11 }} />
                        <Tooltip content={<DarkChartTooltip />} />
                        <Bar dataKey="count" name="Submissions" radius={[6, 6, 0, 0]}>
                          {data.verdictDistribution.map((entry) => (
                            <Cell key={entry.verdict} fill={entry.color} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>

              <div className="rounded-xl border border-[#30363D] bg-[#1C2128] p-5">
                <h2 className="text-base font-semibold text-[#F0F6FC]">XP Growth Over Time</h2>
                <p className="mb-4 text-xs text-[#8B949E]">
                  Cumulative XP from solved problems, daily challenges, and achievements
                </p>
                {data.xpGrowth.length === 0 ? (
                  <div className="flex h-48 items-center justify-center rounded-lg border border-dashed border-[#30363D] bg-[#0D1117]/60 text-sm text-[#8B949E]">
                    Solve problems to track your XP growth curve.
                  </div>
                ) : (
                  <div className="h-52">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={data.xpGrowth}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#30363D" />
                        <XAxis dataKey="date" tick={{ fill: '#8B949E', fontSize: 11 }} />
                        <YAxis tick={{ fill: '#8B949E', fontSize: 11 }} />
                        <Tooltip content={<DarkChartTooltip />} />
                        <Area
                          type="monotone"
                          dataKey="xp"
                          name="Total XP"
                          stroke="#38BDF8"
                          fill="#38BDF8"
                          fillOpacity={0.2}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>
            </div>

            {/* Achievements & Badges */}
            {data.achievements.length > 0 && (
              <div className="rounded-xl border border-[#30363D] bg-[#1C2128] p-5">
                <div className="mb-4 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Trophy className="h-5 w-5 text-amber-400" />
                    <div>
                      <h2 className="text-base font-semibold text-[#F0F6FC]">
                        Achievements &amp; Badges
                      </h2>
                      <p className="text-xs text-[#8B949E]">
                        {data.achievements.filter((a) => a.earned).length} of{' '}
                        {data.achievements.length} unlocked
                      </p>
                    </div>
                  </div>
                  {data.recommendedNext?.topicTitle && (
                    <Link
                      to={`/notes/${data.recommendedNext.topicSlug || ''}`}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-[#22C55E]/40 bg-[#22C55E]/10 px-3 py-1.5 text-xs font-medium text-[#22C55E] print:hidden"
                    >
                      <Sparkles className="h-3.5 w-3.5" />
                      Next: {data.recommendedNext.topicTitle}
                    </Link>
                  )}
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {data.achievements.map((ach) => (
                    <div
                      key={ach._id}
                      className={`rounded-lg border p-3.5 ${
                        ach.earned
                          ? 'border-[#22C55E]/40 bg-[#22C55E]/10'
                          : 'border-[#30363D] bg-[#0D1117]'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-semibold text-[#F0F6FC]">{ach.title}</span>
                        <span
                          className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                            ach.earned
                              ? 'bg-[#22C55E]/20 text-[#22C55E]'
                              : 'bg-[#161B22] text-[#8B949E]'
                          }`}
                        >
                          {ach.earned ? `Earned (+${ach.xpReward} XP)` : `+${ach.xpReward} XP`}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-[#8B949E]">{ach.description}</p>
                      <div className="mt-2.5">
                        <div className="flex justify-between text-[11px] text-[#8B949E]">
                          <span>
                            Progress: {ach.progress} / {ach.threshold}
                          </span>
                          <span>{ach.progressPct}%</span>
                        </div>
                        <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-[#161B22]">
                          <div
                            className={`h-full rounded-full ${
                              ach.earned ? 'bg-[#22C55E]' : 'bg-[#38BDF8]'
                            }`}
                            style={{ width: `${ach.progressPct}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Submission History Table with Search, Filters & Pagination */}
            <div className="rounded-xl border border-[#30363D] bg-[#1C2128] p-5">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-base font-semibold text-[#F0F6FC]">
                    Submission History
                  </h2>
                  <p className="text-xs text-[#8B949E]">
                    {totalSubmissionsCount > 0
                      ? `${totalSubmissionsCount.toLocaleString()} matching submissions`
                      : 'All recorded code submissions'}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2 print:hidden">
                  <div className="relative">
                    <Search className="pointer-events-none absolute left-2.5 top-2 h-3.5 w-3.5 text-[#8B949E]" />
                    <input
                      type="text"
                      value={subSearch}
                      onChange={(e) => {
                        setSubSearch(e.target.value);
                        setPage(1);
                      }}
                      placeholder="Search problem..."
                      className="rounded-lg border border-[#30363D] bg-[#0D1117] py-1.5 pl-8 pr-2.5 text-xs text-[#F0F6FC] placeholder-[#8B949E] focus:border-[#22C55E] focus:outline-none"
                    />
                  </div>
                  <select
                    value={subLanguage}
                    onChange={(e) => {
                      setSubLanguage(e.target.value);
                      setPage(1);
                    }}
                    aria-label="Filter submissions by language"
                    className="rounded-lg border border-[#30363D] bg-[#0D1117] px-2.5 py-1.5 text-xs text-[#F0F6FC] focus:border-[#22C55E] focus:outline-none"
                  >
                    <option value="all">All Languages</option>
                    <option value="c">C</option>
                    <option value="cpp">C++</option>
                    <option value="java">Java</option>
                    <option value="python">Python</option>
                  </select>
                  <select
                    value={subVerdict}
                    onChange={(e) => {
                      setSubVerdict(e.target.value);
                      setPage(1);
                    }}
                    aria-label="Filter submissions by verdict"
                    className="rounded-lg border border-[#30363D] bg-[#0D1117] px-2.5 py-1.5 text-xs text-[#F0F6FC] focus:border-[#22C55E] focus:outline-none"
                  >
                    <option value="all">All Verdicts</option>
                    <option value="accepted">Accepted</option>
                    <option value="wrong answer">Wrong Answer</option>
                    <option value="compilation error">Compilation Error</option>
                    <option value="runtime error">Runtime Error</option>
                    <option value="time limit exceeded">Time Limit Exceeded</option>
                  </select>
                  <select
                    value={subSort}
                    onChange={(e) => {
                      setSubSort(e.target.value as 'newest' | 'oldest' | 'runtime');
                      setPage(1);
                    }}
                    aria-label="Sort submissions"
                    className="rounded-lg border border-[#30363D] bg-[#0D1117] px-2.5 py-1.5 text-xs text-[#F0F6FC] focus:border-[#22C55E] focus:outline-none"
                  >
                    <option value="newest">Newest First</option>
                    <option value="oldest">Oldest First</option>
                    <option value="runtime">Fastest Runtime</option>
                  </select>
                </div>
              </div>

              {paginatedSubmissions.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-[#30363D] bg-[#0D1117]/60 px-4 py-12 text-center">
                  <Code2 className="mb-2 h-8 w-8 text-[#8B949E]/60" />
                  <p className="text-sm font-medium text-[#F0F6FC]">
                    No submission history found
                  </p>
                  <p className="mt-1 text-xs text-[#8B949E]">
                    Your submitted solutions will appear here once you start practicing.
                  </p>
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[680px] text-left text-sm">
                      <thead>
                        <tr className="border-b border-[#30363D] text-xs uppercase tracking-wider text-[#8B949E]">
                          <th className="pb-3 pr-4 font-medium">Problem</th>
                          <th className="pb-3 pr-4 font-medium">Difficulty</th>
                          <th className="pb-3 pr-4 font-medium">Language</th>
                          <th className="pb-3 pr-4 font-medium">Verdict</th>
                          <th className="pb-3 pr-4 font-medium">Tests</th>
                          <th className="pb-3 pr-4 font-medium">Runtime</th>
                          <th className="pb-3 pr-4 font-medium">Memory</th>
                          <th className="pb-3 pr-4 font-medium">Date</th>
                          <th className="pb-3 font-medium print:hidden">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#30363D]/60">
                        {paginatedSubmissions.map((sub) => (
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
                            <td
                              className={`py-3 pr-4 text-xs font-medium ${getDifficultyTextClass(
                                sub.difficulty
                              )}`}
                            >
                              {sub.difficulty}
                            </td>
                            <td className="py-3 pr-4">
                              <span className="rounded bg-[#0D1117] px-2 py-0.5 font-mono text-xs text-[#8B949E]">
                                {sub.language}
                              </span>
                            </td>
                            <td className="py-3 pr-4">
                              <span
                                className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-medium ${getVerdictBadgeClass(
                                  sub.verdict
                                )}`}
                              >
                                {sub.verdict}
                              </span>
                            </td>
                            <td className="py-3 pr-4 font-mono text-xs text-[#8B949E]">
                              {sub.totalTestCases > 0
                                ? `${sub.passedTestCases}/${sub.totalTestCases}`
                                : '—'}
                            </td>
                            <td className="py-3 pr-4 font-mono text-xs text-[#8B949E]">
                              {sub.runtime}
                            </td>
                            <td className="py-3 pr-4 font-mono text-xs text-[#8B949E]">
                              {sub.memory}
                            </td>
                            <td className="py-3 pr-4 text-xs text-[#8B949E]">
                              {formatDateTime(sub.submittedAt)}
                            </td>
                            <td className="py-3 print:hidden">
                              <div className="flex items-center gap-2">
                                {sub.code && (
                                  <button
                                    type="button"
                                    onClick={() => setSelectedSubmission(sub)}
                                    className="inline-flex items-center gap-1 rounded border border-[#30363D] bg-[#0D1117] px-2 py-1 text-xs text-[#F0F6FC] hover:border-[#38BDF8]/50"
                                  >
                                    <Eye className="h-3 w-3 text-[#38BDF8]" />
                                    Code
                                  </button>
                                )}
                                <Link
                                  to={`/practice/${sub.problemSlug || sub.problemId}`}
                                  className="inline-flex items-center gap-1 rounded border border-[#30363D] bg-[#0D1117] px-2 py-1 text-xs text-[#F0F6FC] hover:border-[#22C55E]/50"
                                >
                                  <ExternalLink className="h-3 w-3 text-[#22C55E]" />
                                  Open
                                </Link>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination Controls */}
                  {totalPages > 1 ? (
                    <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-[#30363D] pt-4 print:hidden">
                      <p className="text-xs text-[#8B949E]">
                        Page <span className="font-semibold text-[#F0F6FC]">{page}</span>{' '}
                        of <span className="font-semibold text-[#F0F6FC]">{totalPages}</span>
                      </p>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          disabled={page <= 1}
                          onClick={() => handlePageChange(page - 1)}
                          className="inline-flex items-center gap-1 rounded-lg border border-[#30363D] bg-[#0D1117] px-3 py-1.5 text-xs font-medium text-[#F0F6FC] transition hover:border-[#8B949E]/50 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          <ChevronLeft className="h-3.5 w-3.5" />
                          Previous
                        </button>
                        <button
                          type="button"
                          disabled={page >= totalPages}
                          onClick={() => handlePageChange(page + 1)}
                          className="inline-flex items-center gap-1 rounded-lg border border-[#30363D] bg-[#0D1117] px-3 py-1.5 text-xs font-medium text-[#F0F6FC] transition hover:border-[#8B949E]/50 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          Next
                          <ChevronRight className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  ) : null}
                </>
              )}
            </div>
          </div>
        )}

        {/* View Submission Code Modal */}
        {selectedSubmission && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 print:hidden"
            role="dialog"
            aria-modal="true"
            aria-label="Submission source code"
          >
            <div className="max-h-[85vh] w-full max-w-3xl overflow-hidden rounded-2xl border border-[#30363D] bg-[#161B22] shadow-2xl">
              <div className="flex items-center justify-between border-b border-[#30363D] px-5 py-3.5">
                <div>
                  <h3 className="text-base font-semibold text-[#F0F6FC]">
                    {selectedSubmission.problemTitle}
                  </h3>
                  <p className="text-xs text-[#8B949E]">
                    {selectedSubmission.language.toUpperCase()} • {selectedSubmission.verdict} •{' '}
                    {selectedSubmission.runtime} • {selectedSubmission.memory}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedSubmission(null)}
                  className="rounded-lg p-1.5 text-[#8B949E] hover:bg-[#30363D]/50 hover:text-[#F0F6FC]"
                  aria-label="Close modal"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="max-h-[65vh] overflow-y-auto p-5 space-y-3">
                <pre className="overflow-x-auto rounded-xl border border-[#30363D] bg-[#0D1117] p-4 font-mono text-xs leading-relaxed text-[#E6EDF3]">
                  <code>{selectedSubmission.code}</code>
                </pre>
                {(selectedSubmission.compilerOutput || selectedSubmission.errorMessage) && (
                  <pre className="overflow-x-auto rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 font-mono text-xs text-rose-200">
                    {selectedSubmission.compilerOutput || selectedSubmission.errorMessage}
                  </pre>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
