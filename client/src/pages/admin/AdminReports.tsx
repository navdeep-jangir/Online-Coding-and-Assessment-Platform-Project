import { useCallback, useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Activity,
  AlertCircle,
  BookOpen,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Download,
  FileJson,
  RefreshCw,
  Shield,
  Users,
} from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import toast from 'react-hot-toast';
import { exportToCsv, exportToJson } from '@/components/admin/exportUtils';
import DifficultyBadge from '@/components/common/DifficultyBadge';
import EmptyState from '@/components/common/EmptyState';
import { CardSkeleton, TableSkeleton } from '@/components/common/LoadingSkeleton';
import Pagination from '@/components/common/Pagination';
import SearchInput from '@/components/common/SearchInput';
import { adminApi, ApiClientError } from '@/services/api';
import type { AdminAuditLog, AdminReportsData, PaginationMeta, User } from '@/types';
import { cn, formatDate, formatNumber, formatRelativeTime, getLanguageLabel } from '@/utils/helpers';

type DateRangeOption = '7d' | '30d' | '90d' | 'all';

const VERDICT_COLORS: Record<string, string> = {
  Accepted: '#22C55E',
  'Wrong Answer': '#EF4444',
  'Time Limit Exceeded': '#F59E0B',
  'Memory Limit Exceeded': '#FB923C',
  'Runtime Error': '#F43F5E',
  'Compilation Error': '#A855F7',
};

const TARGET_TYPES = ['All', 'Problem', 'User', 'Module', 'Topic', 'Note', 'DailyChallenge'];

function resolveAuditAdmin(admin: AdminAuditLog['admin']): { name: string; email?: string } {
  if (admin && typeof admin === 'object') {
    const adminObj = admin as Partial<User>;
    return {
      name: adminObj.name || 'Admin',
      email: adminObj.email,
    };
  }
  return { name: typeof admin === 'string' ? admin : 'System' };
}

export default function AdminReports() {
  const [range, setRange] = useState<DateRangeOption>('30d');
  const [reports, setReports] = useState<AdminReportsData | null>(null);
  const [isLoadingReports, setIsLoadingReports] = useState(true);
  const [reportsError, setReportsError] = useState<string | null>(null);

  const [topicSearch, setTopicSearch] = useState('');

  // Audit logs state
  const [auditLogs, setAuditLogs] = useState<AdminAuditLog[]>([]);
  const [auditPagination, setAuditPagination] = useState<PaginationMeta>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
    hasNextPage: false,
    hasPrevPage: false,
  });
  const [auditTargetFilter, setAuditTargetFilter] = useState('All');
  const [auditSearch, setAuditSearch] = useState('');
  const [auditPage, setAuditPage] = useState(1);
  const [isLoadingLogs, setIsLoadingLogs] = useState(true);
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

  const loadReports = useCallback(async () => {
    setIsLoadingReports(true);
    setReportsError(null);
    try {
      const response = await adminApi.getReports({ range });
      setReports(response.data);
    } catch (err) {
      const message =
        err instanceof ApiClientError ? err.message : 'Failed to load analytics reports.';
      setReportsError(message);
    } finally {
      setIsLoadingReports(false);
    }
  }, [range]);

  const loadAuditLogs = useCallback(async () => {
    setIsLoadingLogs(true);
    try {
      const response = await adminApi.getAuditLogs({
        page: auditPage,
        limit: 10,
        targetType: auditTargetFilter !== 'All' ? auditTargetFilter : undefined,
        search: auditSearch || undefined,
      });
      setAuditLogs(response.data.data ?? []);
      setAuditPagination(response.data.pagination);
    } catch {
      setAuditLogs([]);
    } finally {
      setIsLoadingLogs(false);
    }
  }, [auditPage, auditTargetFilter, auditSearch]);

  useEffect(() => {
    void loadReports();
  }, [loadReports]);

  useEffect(() => {
    void loadAuditLogs();
  }, [loadAuditLogs]);

  const filteredTopics = useMemo(() => {
    const items = reports?.topicCompletionRates ?? [];
    if (!topicSearch.trim()) return items;
    const query = topicSearch.toLowerCase();
    return items.filter(
      (item) =>
        item.topicTitle.toLowerCase().includes(query) ||
        (item.moduleTitle && item.moduleTitle.toLowerCase().includes(query))
    );
  }, [reports?.topicCompletionRates, topicSearch]);

  const chartTopicData = useMemo(() => filteredTopics.slice(0, 12), [filteredTopics]);

  const handleExportSubmissionsCsv = () => {
    if (!reports) return;
    const headers = ['Date', 'Total Submissions', 'Accepted Submissions', 'Acceptance Rate (%)'];
    const rows = reports.submissionStats.dailyTrends.map((row) => [
      row.date,
      row.total,
      row.accepted,
      row.total > 0 ? ((row.accepted / row.total) * 100).toFixed(1) : '0.0',
    ]);
    exportToCsv(`codeclimb-submission-report-${range}`, headers, rows);
    toast.success('Submission statistics exported to CSV');
  };

  const handleExportTopicsCsv = () => {
    if (!reports) return;
    const headers = [
      'Topic',
      'Module',
      'Difficulty',
      'Completed Users',
      'Total Users',
      'Completion Rate (%)',
    ];
    const rows = reports.topicCompletionRates.map((row) => [
      row.topicTitle,
      row.moduleTitle || '',
      row.difficulty || '',
      row.completedUsers,
      row.totalUsers,
      row.completionRate.toFixed(1),
    ]);
    exportToCsv('codeclimb-topic-completion-report', headers, rows);
    toast.success('Topic completion report exported to CSV');
  };

  const handleExportAuditLogsCsv = () => {
    const headers = ['Timestamp', 'Admin Name', 'Admin Email', 'Action', 'Target Type', 'Target ID', 'Details'];
    const rows = auditLogs.map((log) => {
      const admin = resolveAuditAdmin(log.admin);
      return [
        log.createdAt,
        admin.name,
        admin.email || '',
        log.action,
        log.targetType,
        log.targetId || '',
        log.details ? JSON.stringify(log.details) : '',
      ];
    });
    exportToCsv(`codeclimb-audit-logs-page-${auditPage}`, headers, rows);
    toast.success('Audit logs exported to CSV');
  };

  const handleExportFullJson = () => {
    exportToJson(`codeclimb-admin-report-${range}`, {
      generatedAt: new Date().toISOString(),
      range,
      reports,
      auditLogs,
    });
    toast.success('Full JSON report downloaded');
  };

  return (
    <div className="space-y-6">
      {/* Header & Export Bar */}
      <div className="flex flex-col gap-4 rounded-2xl border border-[#30363D] bg-[#1C2128] p-5 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-[#F0F6FC]">Reports & Audit Logs</h2>
          <p className="mt-0.5 text-sm text-[#8B949E]">
            Submission metrics, curriculum completion rates, user activity, and administrative audit history.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center rounded-xl border border-[#30363D] bg-[#0D1117] p-1">
            {(['7d', '30d', '90d', 'all'] as DateRangeOption[]).map((opt) => (
              <button
                key={opt}
                type="button"
                onClick={() => setRange(opt)}
                className={cn(
                  'rounded-lg px-2.5 py-1 text-xs font-medium uppercase transition',
                  range === opt
                    ? 'bg-[#22C55E] text-[#0D1117] font-semibold'
                    : 'text-[#8B949E] hover:text-[#F0F6FC]'
                )}
              >
                {opt}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => {
              void loadReports();
              void loadAuditLogs();
            }}
            className="inline-flex items-center gap-1.5 rounded-xl border border-[#30363D] bg-[#0D1117] px-3 py-2 text-xs font-medium text-[#F0F6FC] transition hover:border-[#484F58]"
          >
            <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
            Refresh
          </button>

          <button
            type="button"
            onClick={handleExportSubmissionsCsv}
            disabled={!reports}
            className="inline-flex items-center gap-1.5 rounded-xl border border-[#30363D] bg-[#0D1117] px-3 py-2 text-xs font-medium text-[#F0F6FC] transition hover:border-[#22C55E]/50 hover:text-[#22C55E] disabled:opacity-40"
          >
            <Download className="h-3.5 w-3.5" aria-hidden="true" />
            Submissions CSV
          </button>

          <button
            type="button"
            onClick={handleExportTopicsCsv}
            disabled={!reports}
            className="inline-flex items-center gap-1.5 rounded-xl border border-[#30363D] bg-[#0D1117] px-3 py-2 text-xs font-medium text-[#F0F6FC] transition hover:border-[#22C55E]/50 hover:text-[#22C55E] disabled:opacity-40"
          >
            <Download className="h-3.5 w-3.5" aria-hidden="true" />
            Topics CSV
          </button>

          <button
            type="button"
            onClick={handleExportFullJson}
            disabled={!reports}
            className="inline-flex items-center gap-1.5 rounded-xl bg-[#22C55E] px-3.5 py-2 text-xs font-semibold text-[#0D1117] transition hover:bg-[#22C55E]/90 disabled:opacity-40"
          >
            <FileJson className="h-3.5 w-3.5" aria-hidden="true" />
            Export JSON
          </button>
        </div>
      </div>

      {/* Reports Loading / Error / Content */}
      {isLoadingReports ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
          </div>
          <TableSkeleton rows={5} />
        </div>
      ) : reportsError ? (
        <div className="rounded-2xl border border-red-500/30 bg-[#1C2128] p-8 text-center">
          <AlertCircle className="mx-auto mb-3 h-10 w-10 text-red-400" aria-hidden="true" />
          <h3 className="text-base font-semibold text-[#F0F6FC]">Could not load reports</h3>
          <p className="mt-1 text-sm text-[#8B949E]">{reportsError}</p>
          <button
            type="button"
            onClick={() => void loadReports()}
            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-[#22C55E] px-4 py-2 text-sm font-semibold text-[#0D1117]"
          >
            Retry
          </button>
        </div>
      ) : reports ? (
        <>
          {/* User Activity Overview KPI Strip */}
          <section className="space-y-3">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-[#22C55E]" aria-hidden="true" />
              <h3 className="text-sm font-semibold uppercase tracking-wider text-[#8B949E]">
                User Activity & Submission KPIs
              </h3>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {[
                {
                  label: 'Total Submissions',
                  value: formatNumber(reports.submissionStats.total),
                  meta: `${formatNumber(reports.submissionStats.accepted)} accepted`,
                  icon: Activity,
                },
                {
                  label: 'Acceptance Rate',
                  value: `${reports.submissionStats.acceptanceRate.toFixed(1)}%`,
                  meta: reports.submissionStats.avgRuntimeMs
                    ? `Avg runtime ${Math.round(reports.submissionStats.avgRuntimeMs)} ms`
                    : 'Across evaluated runs',
                  icon: CheckCircle2,
                },
                {
                  label: 'Active Users (7D / 30D)',
                  value: `${formatNumber(reports.userActivityOverview.activeLast7Days)} / ${formatNumber(reports.userActivityOverview.activeLast30Days)}`,
                  meta: `${formatNumber(reports.userActivityOverview.activeToday)} active today`,
                  icon: Users,
                },
                {
                  label: 'Avg User XP & Signups',
                  value: `${formatNumber(Math.round(reports.userActivityOverview.averageXp))} XP`,
                  meta: `+${formatNumber(reports.userActivityOverview.newUsersLast7Days)} joined last 7d`,
                  icon: BookOpen,
                },
              ].map((kpi, idx) => {
                const Icon = kpi.icon;
                return (
                  <motion.div
                    key={kpi.label}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.04 }}
                    className="rounded-2xl border border-[#30363D] bg-[#1C2128] p-5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-[#8B949E]">{kpi.label}</span>
                      <Icon className="h-4 w-4 text-[#22C55E]" aria-hidden="true" />
                    </div>
                    <p className="mt-2 text-2xl font-bold text-[#F0F6FC]">{kpi.value}</p>
                    <p className="mt-1.5 text-xs text-[#8B949E]">{kpi.meta}</p>
                  </motion.div>
                );
              })}
            </div>
          </section>

          {/* Charts Grid: Verdict Breakdown & Language Distribution */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <section className="rounded-2xl border border-[#30363D] bg-[#1C2128] p-5">
              <h3 className="text-base font-semibold text-[#F0F6FC]">Verdict Distribution</h3>
              <p className="mb-4 text-xs text-[#8B949E]">
                Breakdown of submission outcomes across the selected period
              </p>

              {reports.submissionStats.byVerdict.length > 0 ? (
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={reports.submissionStats.byVerdict}
                      margin={{ top: 8, right: 12, left: -12, bottom: 20 }}
                    >
                      <CartesianGrid stroke="#30363D" strokeDasharray="3 3" vertical={false} />
                      <XAxis
                        dataKey="verdict"
                        stroke="#8B949E"
                        fontSize={11}
                        angle={-15}
                        textAnchor="end"
                        interval={0}
                      />
                      <YAxis stroke="#8B949E" fontSize={12} allowDecimals={false} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#161B22',
                          borderColor: '#30363D',
                          borderRadius: '0.75rem',
                          color: '#F0F6FC',
                          fontSize: '12px',
                        }}
                      />
                      <Bar dataKey="count" name="Submissions" radius={[6, 6, 0, 0]}>
                        {reports.submissionStats.byVerdict.map((entry) => (
                          <Cell
                            key={entry.verdict}
                            fill={VERDICT_COLORS[entry.verdict] ?? '#38BDF8'}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <EmptyState compact title="No verdict data" description="No submissions recorded." />
              )}
            </section>

            <section className="rounded-2xl border border-[#30363D] bg-[#1C2128] p-5">
              <h3 className="text-base font-semibold text-[#F0F6FC]">Language Usage</h3>
              <p className="mb-4 text-xs text-[#8B949E]">
                Total vs accepted submissions by programming language
              </p>

              {reports.submissionStats.byLanguage.length > 0 ? (
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={reports.submissionStats.byLanguage.map((item) => ({
                        ...item,
                        label: getLanguageLabel(item.language),
                      }))}
                      margin={{ top: 8, right: 12, left: -12, bottom: 8 }}
                    >
                      <CartesianGrid stroke="#30363D" strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="label" stroke="#8B949E" fontSize={12} />
                      <YAxis stroke="#8B949E" fontSize={12} allowDecimals={false} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#161B22',
                          borderColor: '#30363D',
                          borderRadius: '0.75rem',
                          color: '#F0F6FC',
                          fontSize: '12px',
                        }}
                      />
                      <Legend wrapperStyle={{ fontSize: '12px' }} />
                      <Bar
                        dataKey="submissions"
                        name="Total"
                        fill="#38BDF8"
                        radius={[6, 6, 0, 0]}
                      />
                      <Bar
                        dataKey="accepted"
                        name="Accepted"
                        fill="#22C55E"
                        radius={[6, 6, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <EmptyState compact title="No language data" description="No submissions recorded." />
              )}
            </section>
          </div>

          {/* Daily Active Users & Submissions Overview */}
          <section className="rounded-2xl border border-[#30363D] bg-[#1C2128] p-5">
            <h3 className="text-base font-semibold text-[#F0F6FC]">User Activity Overview</h3>
            <p className="mb-4 text-xs text-[#8B949E]">
              Daily active learners and submission activity trend
            </p>

            {reports.userActivityOverview.dailyActiveTrend.length > 0 ? (
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={reports.userActivityOverview.dailyActiveTrend.map((d) => ({
                      ...d,
                      label: formatDate(d.date, 'MMM d'),
                    }))}
                    margin={{ top: 8, right: 16, left: -12, bottom: 4 }}
                  >
                    <CartesianGrid stroke="#30363D" strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="label" stroke="#8B949E" fontSize={12} />
                    <YAxis stroke="#8B949E" fontSize={12} allowDecimals={false} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#161B22',
                        borderColor: '#30363D',
                        borderRadius: '0.75rem',
                        color: '#F0F6FC',
                        fontSize: '12px',
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: '12px' }} />
                    <Line
                      type="monotone"
                      dataKey="activeUsers"
                      name="Active Users"
                      stroke="#22C55E"
                      strokeWidth={2.5}
                      dot={{ r: 3 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="submissions"
                      name="Submissions"
                      stroke="#38BDF8"
                      strokeWidth={2}
                      dot={{ r: 3 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <EmptyState
                compact
                title="No activity timeline yet"
                description="Daily active user counts will render as activity accumulates."
              />
            )}
          </section>

          {/* Topic Completion Rates */}
          <section className="rounded-2xl border border-[#30363D] bg-[#1C2128] p-5 space-y-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-base font-semibold text-[#F0F6FC]">Topic Completion Rates</h3>
                <p className="text-xs text-[#8B949E]">
                  Percentage of active learners completing each curriculum topic
                </p>
              </div>
              <SearchInput
                value={topicSearch}
                onChange={setTopicSearch}
                placeholder="Filter topics or modules..."
                className="w-full sm:w-64"
              />
            </div>

            {chartTopicData.length > 0 && (
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={chartTopicData}
                    margin={{ top: 8, right: 16, left: -12, bottom: 24 }}
                  >
                    <CartesianGrid stroke="#30363D" strokeDasharray="3 3" vertical={false} />
                    <XAxis
                      dataKey="topicTitle"
                      stroke="#8B949E"
                      fontSize={11}
                      angle={-15}
                      textAnchor="end"
                      interval={0}
                    />
                    <YAxis stroke="#8B949E" fontSize={12} domain={[0, 100]} unit="%" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#161B22',
                        borderColor: '#30363D',
                        borderRadius: '0.75rem',
                        color: '#F0F6FC',
                        fontSize: '12px',
                      }}
                    />
                    <Bar
                      dataKey="completionRate"
                      name="Completion Rate (%)"
                      fill="#22C55E"
                      radius={[6, 6, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {filteredTopics.length === 0 ? (
              <EmptyState
                compact
                title="No matching topics"
                description="Try clearing your topic filter or adding curriculum topics."
              />
            ) : (
              <div className="overflow-x-auto rounded-xl border border-[#30363D]">
                <table className="w-full min-w-[640px] text-left text-sm">
                  <thead>
                    <tr className="border-b border-[#30363D] bg-[#161B22] text-xs uppercase tracking-wider text-[#8B949E]">
                      <th className="px-4 py-3 font-medium">Topic</th>
                      <th className="px-4 py-3 font-medium">Module</th>
                      <th className="px-4 py-3 font-medium">Difficulty</th>
                      <th className="px-4 py-3 font-medium">Completed / Users</th>
                      <th className="px-4 py-3 font-medium">Completion Rate</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#30363D]/70">
                    {filteredTopics.map((topic) => (
                      <tr key={topic.topicId} className="hover:bg-[#0D1117]/60">
                        <td className="px-4 py-3 font-medium text-[#F0F6FC]">
                          {topic.topicTitle}
                        </td>
                        <td className="px-4 py-3 text-xs text-[#8B949E]">
                          {topic.moduleTitle || '—'}
                        </td>
                        <td className="px-4 py-3">
                          {topic.difficulty ? (
                            <DifficultyBadge difficulty={topic.difficulty} size="sm" />
                          ) : (
                            <span className="text-xs text-[#8B949E]">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-xs text-[#C9D1D9]">
                          {topic.completedUsers} / {topic.totalUsers}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="h-2 w-28 overflow-hidden rounded-full bg-[#0D1117]">
                              <div
                                className="h-full rounded-full bg-[#22C55E]"
                                style={{
                                  width: `${Math.min(100, Math.max(0, topic.completionRate))}%`,
                                }}
                              />
                            </div>
                            <span className="text-xs font-semibold text-[#F0F6FC]">
                              {topic.completionRate.toFixed(1)}%
                            </span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      ) : null}

      {/* Audit Log Viewer */}
      <section className="rounded-2xl border border-[#30363D] bg-[#1C2128] overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-[#30363D] p-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#22C55E]/30 bg-[#22C55E]/10 text-[#22C55E]">
              <Shield className="h-4 w-4" aria-hidden="true" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-[#F0F6FC]">Admin Audit Log</h3>
              <p className="text-xs text-[#8B949E]">
                Immutable record of administrative actions and content updates
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <SearchInput
              value={auditSearch}
              onChange={(val) => {
                setAuditSearch(val);
                setAuditPage(1);
              }}
              placeholder="Search action or admin..."
              className="w-full sm:w-56"
            />

            <select
              value={auditTargetFilter}
              onChange={(e) => {
                setAuditTargetFilter(e.target.value);
                setAuditPage(1);
              }}
              aria-label="Filter audit logs by target type"
              className="h-10 rounded-lg border border-[#30363D] bg-[#161B22] px-3 text-sm text-[#F0F6FC] focus:border-[#22C55E] focus:outline-none"
            >
              {TARGET_TYPES.map((target) => (
                <option key={target} value={target}>
                  {target === 'All' ? 'All Targets' : target}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={handleExportAuditLogsCsv}
              disabled={auditLogs.length === 0}
              className="inline-flex h-10 items-center gap-1.5 rounded-lg border border-[#30363D] bg-[#0D1117] px-3 text-xs font-medium text-[#F0F6FC] transition hover:border-[#22C55E]/50 hover:text-[#22C55E] disabled:opacity-40"
            >
              <Download className="h-3.5 w-3.5" aria-hidden="true" />
              Export Logs
            </button>
          </div>
        </div>

        {isLoadingLogs ? (
          <div className="p-5">
            <TableSkeleton rows={5} />
          </div>
        ) : auditLogs.length === 0 ? (
          <div className="p-6">
            <EmptyState
              compact
              icon={Shield}
              title="No audit log entries"
              description="Administrative actions such as problem edits, user changes, and module updates will be recorded here."
            />
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-left text-sm">
                <thead>
                  <tr className="border-b border-[#30363D] bg-[#161B22] text-xs uppercase tracking-wider text-[#8B949E]">
                    <th className="px-5 py-3 font-medium">Timestamp</th>
                    <th className="px-5 py-3 font-medium">Admin</th>
                    <th className="px-5 py-3 font-medium">Action</th>
                    <th className="px-5 py-3 font-medium">Target</th>
                    <th className="px-5 py-3 font-medium text-right">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#30363D]/70">
                  {auditLogs.map((log) => {
                    const admin = resolveAuditAdmin(log.admin);
                    const isExpanded = expandedLogId === log._id;

                    return (
                      <tr key={log._id} className="hover:bg-[#0D1117]/50 align-top">
                        <td className="px-5 py-3.5 whitespace-nowrap">
                          <div className="text-xs font-medium text-[#F0F6FC]">
                            {formatDate(log.createdAt, 'MMM d, yyyy HH:mm')}
                          </div>
                          <div className="text-[11px] text-[#8B949E]">
                            {formatRelativeTime(log.createdAt)}
                          </div>
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="text-xs font-medium text-[#F0F6FC]">{admin.name}</div>
                          {admin.email && (
                            <div className="text-[11px] text-[#8B949E]">{admin.email}</div>
                          )}
                        </td>
                        <td className="px-5 py-3.5">
                          <span className="inline-flex items-center rounded-md border border-[#22C55E]/30 bg-[#22C55E]/10 px-2 py-0.5 font-mono text-xs text-[#22C55E]">
                            {log.action}
                          </span>
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="text-xs font-medium text-[#F0F6FC]">
                            {log.targetType}
                          </div>
                          {log.targetId && (
                            <div className="font-mono text-[11px] text-[#8B949E]">
                              {log.targetId}
                            </div>
                          )}
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          {log.details && Object.keys(log.details).length > 0 ? (
                            <div className="inline-flex flex-col items-end">
                              <button
                                type="button"
                                onClick={() =>
                                  setExpandedLogId(isExpanded ? null : log._id)
                                }
                                className="inline-flex items-center gap-1 rounded-md border border-[#30363D] bg-[#0D1117] px-2.5 py-1 text-xs text-[#8B949E] transition hover:text-[#F0F6FC]"
                              >
                                {isExpanded ? 'Hide' : 'Inspect'}
                                {isExpanded ? (
                                  <ChevronUp className="h-3.5 w-3.5" aria-hidden="true" />
                                ) : (
                                  <ChevronDown className="h-3.5 w-3.5" aria-hidden="true" />
                                )}
                              </button>
                              {isExpanded && (
                                <pre className="mt-2 max-w-md overflow-x-auto rounded-lg border border-[#30363D] bg-[#0D1117] p-2.5 text-left font-mono text-[11px] text-[#C9D1D9]">
                                  {JSON.stringify(log.details, null, 2)}
                                </pre>
                              )}
                            </div>
                          ) : (
                            <span className="text-xs text-[#8B949E]">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {auditPagination.totalPages > 1 && (
              <div className="border-t border-[#30363D] px-5 py-3.5">
                <Pagination
                  currentPage={auditPagination.page}
                  totalPages={auditPagination.totalPages}
                  totalItems={auditPagination.total}
                  pageSize={auditPagination.limit}
                  onPageChange={setAuditPage}
                />
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
}
