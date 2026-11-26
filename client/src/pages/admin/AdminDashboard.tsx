import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Activity,
  AlertCircle,
  ArrowRight,
  BarChart3,
  Code2,
  Flame,
  Plus,
  RefreshCw,
  Send,
  TrendingUp,
  Users,
} from 'lucide-react';
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import DifficultyBadge from '@/components/common/DifficultyBadge';
import EmptyState from '@/components/common/EmptyState';
import { CardSkeleton, TableSkeleton } from '@/components/common/LoadingSkeleton';
import { adminApi, ApiClientError } from '@/services/api';
import type {
  AdminDashboardStats,
  AdminSubmissionTrendPoint,
  Problem,
  Submission,
  User,
} from '@/types';
import {
  cn,
  formatDate,
  formatNumber,
  formatRelativeTime,
  getLanguageLabel,
  getStatusColorClass,
} from '@/utils/helpers';

type TrendWindow = 7 | 14 | 30;

function extractSubmissionUser(submission: Submission): { name: string; email?: string } {
  const candidate = submission.user ?? submission.userId;
  if (candidate && typeof candidate === 'object') {
    const userObj = candidate as Partial<User>;
    return {
      name: userObj.name || userObj.username || 'Unknown User',
      email: userObj.email,
    };
  }
  return { name: typeof candidate === 'string' ? candidate : 'Unknown User' };
}

function extractSubmissionProblem(submission: Submission): {
  title: string;
  difficulty?: string;
} {
  const candidate = submission.problem ?? submission.problemId;
  if (candidate && typeof candidate === 'object') {
    const problemObj = candidate as Partial<Problem>;
    return {
      title: problemObj.title || 'Untitled Problem',
      difficulty: problemObj.difficulty,
    };
  }
  return { title: typeof candidate === 'string' ? candidate : 'Unknown Problem' };
}

function deriveTrendsFromSubmissions(submissions: Submission[]): AdminSubmissionTrendPoint[] {
  if (!submissions.length) return [];
  const grouped = new Map<string, { total: number; accepted: number }>();

  for (const sub of submissions) {
    const rawDate = sub.submittedAt || sub.createdAt;
    const dayKey = rawDate ? rawDate.slice(0, 10) : '';
    if (!dayKey) continue;
    const entry = grouped.get(dayKey) ?? { total: 0, accepted: 0 };
    entry.total += 1;
    if ((sub.verdict || sub.status) === 'Accepted') {
      entry.accepted += 1;
    }
    grouped.set(dayKey, entry);
  }

  return Array.from(grouped.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, counts]) => ({
      date,
      label: formatDate(date, 'MMM d'),
      total: counts.total,
      accepted: counts.accepted,
    }));
}

export default function AdminDashboard() {
  const navigate = useNavigate();

  const [stats, setStats] = useState<AdminDashboardStats | null>(null);
  const [trends, setTrends] = useState<AdminSubmissionTrendPoint[]>([]);
  const [trendWindow, setTrendWindow] = useState<TrendWindow>(14);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadDashboard = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const [statsResult, reportsResult] = await Promise.allSettled([
        adminApi.getDashboardStats(),
        adminApi.getReports({ range: '30d' }),
      ]);

      if (statsResult.status === 'rejected') {
        throw statsResult.reason;
      }

      const dashboardStats = statsResult.value.data;
      setStats(dashboardStats);

      if (dashboardStats.submissionTrends && dashboardStats.submissionTrends.length > 0) {
        setTrends(
          dashboardStats.submissionTrends.map((point) => ({
            ...point,
            label: point.label || formatDate(point.date, 'MMM d'),
          }))
        );
      } else if (
        reportsResult.status === 'fulfilled' &&
        reportsResult.value.data?.submissionStats?.dailyTrends?.length
      ) {
        setTrends(
          reportsResult.value.data.submissionStats.dailyTrends.map((point) => ({
            ...point,
            label: point.label || formatDate(point.date, 'MMM d'),
          }))
        );
      } else {
        setTrends(deriveTrendsFromSubmissions(dashboardStats.recentSubmissions || []));
      }
    } catch (err) {
      const message =
        err instanceof ApiClientError
          ? err.message
          : 'Failed to load admin dashboard statistics.';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  const visibleTrends = useMemo(() => {
    if (!trends.length) return [];
    return trends.slice(-trendWindow);
  }, [trends, trendWindow]);

  const statCards = useMemo(() => {
    const totalUsers = stats?.totalUsers ?? 0;
    const activeToday = stats?.activeUsersToday ?? 0;
    const activePct =
      totalUsers > 0 ? Math.round((activeToday / totalUsers) * 1000) / 10 : 0;

    return [
      {
        title: 'Total Users',
        value: formatNumber(totalUsers),
        subtitle: `${stats?.recentUsers?.length ?? 0} recent signups`,
        icon: Users,
        accentClass: 'text-[#38BDF8] bg-[#38BDF8]/10 border-[#38BDF8]/25',
      },
      {
        title: 'Total Problems',
        value: formatNumber(stats?.totalProblems ?? 0),
        subtitle: `${stats?.totalModules ?? 0} modules · ${stats?.totalTopics ?? 0} topics`,
        icon: Code2,
        accentClass: 'text-[#22C55E] bg-[#22C55E]/10 border-[#22C55E]/25',
      },
      {
        title: 'Total Submissions',
        value: formatNumber(stats?.totalSubmissions ?? 0),
        subtitle: `${(stats?.acceptanceRate ?? 0).toFixed(1)}% acceptance rate`,
        icon: Send,
        accentClass: 'text-[#A855F7] bg-[#A855F7]/10 border-[#A855F7]/25',
      },
      {
        title: 'Active Today',
        value: formatNumber(activeToday),
        subtitle: `${activePct}% of user base active`,
        icon: Flame,
        accentClass: 'text-[#F59E0B] bg-[#F59E0B]/10 border-[#F59E0B]/25',
      },
    ];
  }, [stats]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
        <div className="h-80 rounded-2xl border border-[#30363D] bg-[#1C2128] p-6">
          <div className="skeleton-shimmer h-full w-full rounded-xl bg-slate-800/70" />
        </div>
        <TableSkeleton rows={6} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-500/30 bg-[#1C2128] p-8 text-center">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl border border-red-500/30 bg-red-500/10 text-red-400">
          <AlertCircle className="h-6 w-6" aria-hidden="true" />
        </div>
        <h2 className="text-lg font-semibold text-[#F0F6FC]">Unable to load dashboard</h2>
        <p className="mt-1 text-sm text-[#8B949E]">{error}</p>
        <button
          type="button"
          onClick={() => void loadDashboard()}
          className="mt-4 inline-flex items-center gap-2 rounded-lg bg-[#22C55E] px-4 py-2 text-sm font-semibold text-[#0D1117] transition hover:bg-[#22C55E]/90"
        >
          <RefreshCw className="h-4 w-4" aria-hidden="true" />
          Retry
        </button>
      </div>
    );
  }

  const recentSubmissions = stats?.recentSubmissions ?? [];

  return (
    <div className="space-y-6">
      {/* Header & Quick Actions */}
      <div className="flex flex-col gap-4 rounded-2xl border border-[#30363D] bg-[#1C2128] p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-[#F0F6FC]">Platform Overview</h2>
          <p className="mt-0.5 text-sm text-[#8B949E]">
            Monitor CodeClimb learner activity, submissions, and curriculum health.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => navigate('/admin/problems/new')}
            className="inline-flex items-center gap-2 rounded-xl bg-[#22C55E] px-4 py-2 text-sm font-semibold text-[#0D1117] transition hover:bg-[#22C55E]/90"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            Add Problem
          </button>

          <button
            type="button"
            onClick={() => navigate('/admin/users')}
            className="inline-flex items-center gap-2 rounded-xl border border-[#30363D] bg-[#0D1117] px-3.5 py-2 text-sm font-medium text-[#F0F6FC] transition hover:border-[#484F58] hover:bg-[#161B22]"
          >
            <Users className="h-4 w-4 text-[#38BDF8]" aria-hidden="true" />
            Manage Users
          </button>

          <button
            type="button"
            onClick={() => navigate('/admin/reports')}
            className="inline-flex items-center gap-2 rounded-xl border border-[#30363D] bg-[#0D1117] px-3.5 py-2 text-sm font-medium text-[#F0F6FC] transition hover:border-[#484F58] hover:bg-[#161B22]"
          >
            <BarChart3 className="h-4 w-4 text-[#22C55E]" aria-hidden="true" />
            View Reports
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {statCards.map((card, index) => {
          const Icon = card.icon;
          return (
            <motion.div
              key={card.title}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, delay: index * 0.05 }}
              className="rounded-2xl border border-[#30363D] bg-[#1C2128] p-5 transition hover:border-[#484F58]"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-[#8B949E]">
                    {card.title}
                  </p>
                  <p className="mt-2 text-3xl font-bold tracking-tight text-[#F0F6FC]">
                    {card.value}
                  </p>
                </div>
                <div
                  className={cn(
                    'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border',
                    card.accentClass
                  )}
                >
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </div>
              </div>
              <p className="mt-3 text-xs text-[#8B949E]">{card.subtitle}</p>
            </motion.div>
          );
        })}
      </div>

      {/* Submission Trend Chart */}
      <section className="rounded-2xl border border-[#30363D] bg-[#1C2128] p-5">
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#22C55E]/30 bg-[#22C55E]/10 text-[#22C55E]">
              <TrendingUp className="h-4 w-4" aria-hidden="true" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-[#F0F6FC]">Submission Trends</h3>
              <p className="text-xs text-[#8B949E]">
                Daily total vs accepted code submissions
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {([7, 14, 30] as TrendWindow[]).map((days) => (
              <button
                key={days}
                type="button"
                onClick={() => setTrendWindow(days)}
                className={cn(
                  'rounded-lg px-3 py-1.5 text-xs font-medium transition',
                  trendWindow === days
                    ? 'border border-[#22C55E]/40 bg-[#22C55E]/15 text-[#22C55E]'
                    : 'border border-[#30363D] bg-[#0D1117] text-[#8B949E] hover:text-[#F0F6FC]'
                )}
              >
                {days}D
              </button>
            ))}
          </div>
        </div>

        {visibleTrends.length > 0 ? (
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={visibleTrends} margin={{ top: 8, right: 16, left: -12, bottom: 4 }}>
                <CartesianGrid stroke="#30363D" strokeDasharray="3 3" vertical={false} />
                <XAxis
                  dataKey="label"
                  stroke="#8B949E"
                  fontSize={12}
                  tickLine={false}
                  axisLine={{ stroke: '#30363D' }}
                />
                <YAxis
                  stroke="#8B949E"
                  fontSize={12}
                  allowDecimals={false}
                  tickLine={false}
                  axisLine={{ stroke: '#30363D' }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#161B22',
                    borderColor: '#30363D',
                    borderRadius: '0.75rem',
                    color: '#F0F6FC',
                    fontSize: '12px',
                  }}
                  labelStyle={{ color: '#F0F6FC', fontWeight: 600 }}
                />
                <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                <Line
                  type="monotone"
                  dataKey="total"
                  name="Total Submissions"
                  stroke="#38BDF8"
                  strokeWidth={2.5}
                  dot={{ r: 3, fill: '#38BDF8' }}
                  activeDot={{ r: 5 }}
                />
                <Line
                  type="monotone"
                  dataKey="accepted"
                  name="Accepted"
                  stroke="#22C55E"
                  strokeWidth={2.5}
                  dot={{ r: 3, fill: '#22C55E' }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <EmptyState
            compact
            icon={Activity}
            title="No submission trend data yet"
            description="Submission volume over time will populate once learners start submitting solutions."
          />
        )}
      </section>

      {/* Recent Submissions Table */}
      <section className="rounded-2xl border border-[#30363D] bg-[#1C2128] overflow-hidden">
        <div className="flex items-center justify-between border-b border-[#30363D] px-5 py-4">
          <div>
            <h3 className="text-base font-semibold text-[#F0F6FC]">Recent Submissions</h3>
            <p className="text-xs text-[#8B949E]">
              Latest judge executions across all problems
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigate('/admin/reports')}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-[#22C55E] transition hover:underline"
          >
            Full analytics
            <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
          </button>
        </div>

        {recentSubmissions.length === 0 ? (
          <div className="p-6">
            <EmptyState
              compact
              icon={Send}
              title="No recent submissions"
              description="Recent student submissions will appear here in real time."
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead>
                <tr className="border-b border-[#30363D] bg-[#161B22] text-xs uppercase tracking-wider text-[#8B949E]">
                  <th className="px-5 py-3 font-medium">User</th>
                  <th className="px-5 py-3 font-medium">Problem</th>
                  <th className="px-5 py-3 font-medium">Language</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 font-medium">Tests</th>
                  <th className="px-5 py-3 font-medium">Runtime</th>
                  <th className="px-5 py-3 font-medium text-right">Submitted</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#30363D]/70">
                {recentSubmissions.map((sub) => {
                  const userInfo = extractSubmissionUser(sub);
                  const problemInfo = extractSubmissionProblem(sub);
                  const verdict = sub.verdict || sub.status || 'Pending';
                  const runtime = sub.runtime ?? sub.executionTimeMs;

                  return (
                    <tr
                      key={sub._id}
                      className="transition hover:bg-[#0D1117]/60"
                    >
                      <td className="px-5 py-3.5">
                        <div className="font-medium text-[#F0F6FC]">{userInfo.name}</div>
                        {userInfo.email && (
                          <div className="text-xs text-[#8B949E]">{userInfo.email}</div>
                        )}
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-[#F0F6FC]">
                            {problemInfo.title}
                          </span>
                          {problemInfo.difficulty && (
                            <DifficultyBadge
                              difficulty={problemInfo.difficulty}
                              size="sm"
                              showDot={false}
                            />
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="rounded-md border border-[#30363D] bg-[#0D1117] px-2 py-0.5 font-mono text-xs text-[#C9D1D9]">
                          {getLanguageLabel(sub.language)}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span
                          className={cn(
                            'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium',
                            getStatusColorClass(verdict)
                          )}
                        >
                          {verdict}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-xs text-[#8B949E]">
                        {sub.passedTestCases}/{sub.totalTestCases}
                      </td>
                      <td className="px-5 py-3.5 font-mono text-xs text-[#C9D1D9]">
                        {runtime !== undefined ? `${runtime} ms` : '—'}
                      </td>
                      <td className="px-5 py-3.5 text-right text-xs text-[#8B949E]">
                        {formatRelativeTime(sub.submittedAt || sub.createdAt)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
