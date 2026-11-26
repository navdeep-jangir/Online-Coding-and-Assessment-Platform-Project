import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import {
  Activity,
  Award,
  BarChart3,
  BookOpen,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Code2,
  FileText,
  FlaskConical,
  LayoutDashboard,
  Layers,
  ListChecks,
  Menu,
  Settings,
  ShieldCheck,
  Trophy,
  Users,
  X,
} from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import api from '@/services/api';
import { AdminProblemsSection } from '@/components/admin/AdminProblemsSection';
import { AdminCurriculumSection } from '@/components/admin/AdminCurriculumSection';
import {
  AdminAchievementsSection,
  AdminAuditLogsSection,
  AdminDailyChallengesSection,
  AdminSettingsSection,
  AdminStudentsSection,
  AdminSubmissionsSection,
} from '@/components/admin/AdminOperationsSection';
import LeaderboardPage from '@/pages/LeaderboardPage';
import { formatDate } from '@/utils/helpers';

type AdminTab =
  | 'overview'
  | 'students'
  | 'problems'
  | 'testcases'
  | 'curriculum'
  | 'notes'
  | 'daily'
  | 'submissions'
  | 'leaderboard'
  | 'achievements'
  | 'reports'
  | 'audit'
  | 'settings';

interface AdminStatsPayload {
  totalUsers: number;
  totalStudents: number;
  activeUsers: number;
  inactiveUsers: number;
  totalProblems: number;
  totalModules: number;
  totalConcepts: number;
  problemsByDifficulty: { easy: number; medium: number; hard: number };
  totalSubmissions: number;
  acceptedSubmissions: number;
  acceptanceRate: number;
  dailyActiveUsers: number;
  submissionsToday: number;
  dailyChallengeParticipation?: { assignedToday: number; completedToday: number };
  languageDistribution?: Array<{ language: string; count: number }>;
  recentRegistrations?: Array<{
    _id: string;
    name: string;
    collegeName?: string;
    preferredLanguage?: string;
    createdAt: string;
  }>;
  recentSubmissions?: Array<{
    _id: string;
    userName: string;
    problemTitle: string;
    language: string;
    verdict: string;
    submittedAt: string;
  }>;
  judge0Health?: { status: string; url?: string };
}

const NAV_ITEMS: Array<{ id: AdminTab; label: string; icon: ReactNode }> = [
  { id: 'overview', label: 'Overview', icon: <LayoutDashboard className="h-4 w-4" /> },
  { id: 'students', label: 'Students', icon: <Users className="h-4 w-4" /> },
  { id: 'problems', label: 'Coding Problems', icon: <Code2 className="h-4 w-4" /> },
  { id: 'testcases', label: 'Test Cases', icon: <FlaskConical className="h-4 w-4" /> },
  { id: 'curriculum', label: 'DSA Curriculum', icon: <Layers className="h-4 w-4" /> },
  { id: 'notes', label: 'Notes & Resources', icon: <BookOpen className="h-4 w-4" /> },
  { id: 'daily', label: 'Daily Challenges', icon: <Calendar className="h-4 w-4" /> },
  { id: 'submissions', label: 'Submissions', icon: <ListChecks className="h-4 w-4" /> },
  { id: 'leaderboard', label: 'Leaderboard', icon: <Trophy className="h-4 w-4" /> },
  { id: 'achievements', label: 'Achievements', icon: <Award className="h-4 w-4" /> },
  { id: 'reports', label: 'Performance Reports', icon: <BarChart3 className="h-4 w-4" /> },
  { id: 'audit', label: 'Audit Logs', icon: <FileText className="h-4 w-4" /> },
  { id: 'settings', label: 'Settings', icon: <Settings className="h-4 w-4" /> },
];

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [stats, setStats] = useState<AdminStatsPayload | null>(null);
  const [loadingStats, setLoadingStats] = useState(true);

  const loadStats = useCallback(async () => {
    setLoadingStats(true);
    try {
      const res = await api.get('/admin/stats');
      setStats(res.data?.data || null);
    } catch {
      setStats(null);
    } finally {
      setLoadingStats(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'overview') {
      void loadStats();
    }
  }, [activeTab, loadStats]);

  const diffChartData = stats
    ? [
        { name: 'Easy', count: stats.problemsByDifficulty.easy, color: '#22C55E' },
        { name: 'Medium', count: stats.problemsByDifficulty.medium, color: '#F59E0B' },
        { name: 'Hard', count: stats.problemsByDifficulty.hard, color: '#EF4444' },
      ]
    : [];

  return (
    <div className="flex min-h-screen bg-[#0D1117] text-[#F0F6FC]">
      {/* Mobile Sidebar Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Collapsible Admin Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex flex-col border-r border-[#30363D] bg-[#161B22] transition-all lg:static ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        } ${collapsed ? 'w-16' : 'w-64'}`}
      >
        <div className="flex items-center justify-between border-b border-[#30363D] px-4 py-4">
          {!collapsed && (
            <Link to="/dashboard" className="flex items-center gap-2 font-bold text-[#F0F6FC]">
              <ShieldCheck className="h-5 w-5 text-[#22C55E]" />
              <span>CodeClimb Admin</span>
            </Link>
          )}
          <button
            type="button"
            onClick={() => setCollapsed((c) => !c)}
            className="hidden rounded p-1 text-[#8B949E] hover:text-[#F0F6FC] lg:inline-flex"
            aria-label="Toggle sidebar"
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
          <button
            type="button"
            onClick={() => setMobileOpen(false)}
            className="rounded p-1 text-[#8B949E] hover:text-[#F0F6FC] lg:hidden"
            aria-label="Close admin menu"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto p-2">
          {NAV_ITEMS.map((item) => {
            const active = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setActiveTab(item.id);
                  setMobileOpen(false);
                }}
                title={item.label}
                className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-xs font-medium transition ${
                  active
                    ? 'bg-[#22C55E]/15 text-[#22C55E]'
                    : 'text-[#8B949E] hover:bg-[#0D1117] hover:text-[#F0F6FC]'
                }`}
              >
                {item.icon}
                {!collapsed && <span>{item.label}</span>}
              </button>
            );
          })}
        </nav>
      </aside>

      {/* Main Workspace */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-[#30363D] bg-[#161B22]/80 px-4 py-3 lg:px-8">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              className="rounded-lg border border-[#30363D] p-2 text-[#8B949E] lg:hidden"
              aria-label="Open admin menu"
            >
              <Menu className="h-4 w-4" />
            </button>
            <h1 className="text-base font-semibold text-[#F0F6FC]">
              {NAV_ITEMS.find((i) => i.id === activeTab)?.label || 'Admin Panel'}
            </h1>
          </div>
          <Link
            to="/dashboard"
            className="rounded-lg border border-[#30363D] bg-[#0D1117] px-3 py-1.5 text-xs text-[#8B949E] hover:text-[#F0F6FC]"
          >
            Student View
          </Link>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Quick Actions */}
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('problems')}
                  className="rounded-lg bg-[#22C55E] px-3.5 py-2 text-xs font-semibold text-[#0D1117]"
                >
                  + Manage Coding Problems
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('students')}
                  className="rounded-lg border border-[#30363D] bg-[#161B22] px-3.5 py-2 text-xs font-medium text-[#F0F6FC]"
                >
                  Manage Students
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('curriculum')}
                  className="rounded-lg border border-[#30363D] bg-[#161B22] px-3.5 py-2 text-xs font-medium text-[#F0F6FC]"
                >
                  Edit DSA Curriculum
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('audit')}
                  className="rounded-lg border border-[#30363D] bg-[#161B22] px-3.5 py-2 text-xs font-medium text-[#F0F6FC]"
                >
                  View Audit Logs
                </button>
              </div>

              {loadingStats ? (
                <p className="text-sm text-[#8B949E]">Loading platform statistics...</p>
              ) : stats ? (
                <>
                  <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                    <div className="rounded-xl border border-[#30363D] bg-[#161B22] p-4">
                      <p className="text-xs text-[#8B949E]">Registered Students</p>
                      <p className="mt-1 text-2xl font-bold text-[#F0F6FC]">{stats.totalStudents}</p>
                      <p className="text-xs text-[#22C55E]">{stats.activeUsers} active accounts</p>
                    </div>
                    <div className="rounded-xl border border-[#30363D] bg-[#161B22] p-4">
                      <p className="text-xs text-[#8B949E]">Curriculum &amp; Problems</p>
                      <p className="mt-1 text-2xl font-bold text-[#38BDF8]">{stats.totalProblems}</p>
                      <p className="text-xs text-[#8B949E]">
                        {stats.totalModules} modules • {stats.totalConcepts} concepts
                      </p>
                    </div>
                    <div className="rounded-xl border border-[#30363D] bg-[#161B22] p-4">
                      <p className="text-xs text-[#8B949E]">Submissions &amp; Accuracy</p>
                      <p className="mt-1 text-2xl font-bold text-[#22C55E]">{stats.acceptanceRate}%</p>
                      <p className="text-xs text-[#8B949E]">
                        {stats.acceptedSubmissions} / {stats.totalSubmissions} accepted
                      </p>
                    </div>
                    <div className="rounded-xl border border-[#30363D] bg-[#161B22] p-4">
                      <p className="text-xs text-[#8B949E]">Execution Service (Judge0)</p>
                      <p
                        className={`mt-1 flex items-center gap-1.5 text-lg font-bold ${
                          stats.judge0Health?.status === 'healthy' ? 'text-[#22C55E]' : 'text-amber-300'
                        }`}
                      >
                        <Activity className="h-4 w-4" />
                        {stats.judge0Health?.status || 'unknown'}
                      </p>
                      <p className="text-xs text-[#8B949E]">
                        DAU: {stats.dailyActiveUsers} • DC: {stats.dailyChallengeParticipation?.completedToday ?? 0} done
                      </p>
                    </div>
                  </div>

                  {/* Charts */}
                  <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                    <div className="rounded-xl border border-[#30363D] bg-[#161B22] p-5">
                      <h3 className="mb-3 text-sm font-semibold">Problem Difficulty Distribution</h3>
                      <div className="h-52">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={diffChartData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#30363D" />
                            <XAxis dataKey="name" tick={{ fill: '#8B949E', fontSize: 12 }} />
                            <YAxis tick={{ fill: '#8B949E', fontSize: 12 }} />
                            <Tooltip />
                            <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                              {diffChartData.map((d) => (
                                <Cell key={d.name} fill={d.color} />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    <div className="rounded-xl border border-[#30363D] bg-[#161B22] p-5">
                      <h3 className="mb-3 text-sm font-semibold">Language Distribution</h3>
                      <div className="h-52">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={stats.languageDistribution || []}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#30363D" />
                            <XAxis dataKey="language" tick={{ fill: '#8B949E', fontSize: 12 }} />
                            <YAxis allowDecimals={false} tick={{ fill: '#8B949E', fontSize: 12 }} />
                            <Tooltip />
                            <Bar dataKey="count" fill="#38BDF8" radius={[6, 6, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </div>

                  {/* Recent Registrations & Submissions */}
                  <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                    <div className="rounded-xl border border-[#30363D] bg-[#161B22] p-5">
                      <h3 className="mb-3 text-sm font-semibold">Recent Student Registrations</h3>
                      <div className="space-y-2">
                        {(stats.recentRegistrations || []).map((u) => (
                          <div
                            key={u._id}
                            className="flex items-center justify-between rounded-lg bg-[#0D1117] px-3 py-2 text-xs"
                          >
                            <div>
                              <p className="font-medium text-[#F0F6FC]">{u.name}</p>
                              <p className="text-[#8B949E]">{u.collegeName || 'CodeClimb'}</p>
                            </div>
                            <span className="text-[#8B949E]">{formatDate(u.createdAt)}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="rounded-xl border border-[#30363D] bg-[#161B22] p-5">
                      <h3 className="mb-3 text-sm font-semibold">Recent Submissions</h3>
                      <div className="space-y-2">
                        {(stats.recentSubmissions || []).map((s) => (
                          <div
                            key={s._id}
                            className="flex items-center justify-between rounded-lg bg-[#0D1117] px-3 py-2 text-xs"
                          >
                            <div>
                              <p className="font-medium text-[#F0F6FC]">
                                {s.userName} • {s.problemTitle}
                              </p>
                              <p className="text-[#8B949E]">{s.language}</p>
                            </div>
                            <span
                              className={
                                s.verdict === 'Accepted' ? 'text-[#22C55E]' : 'text-rose-400'
                              }
                            >
                              {s.verdict}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <p className="text-sm text-rose-400">Failed to load admin overview.</p>
              )}
            </div>
          )}

          {activeTab === 'students' && <AdminStudentsSection initialMode="students" />}
          {activeTab === 'reports' && <AdminStudentsSection initialMode="reports" />}
          {activeTab === 'problems' && <AdminProblemsSection initialMode="problems" />}
          {activeTab === 'testcases' && <AdminProblemsSection initialMode="testcases" />}
          {activeTab === 'curriculum' && <AdminCurriculumSection initialMode="curriculum" />}
          {activeTab === 'notes' && <AdminCurriculumSection initialMode="notes" />}
          {activeTab === 'daily' && <AdminDailyChallengesSection />}
          {activeTab === 'submissions' && <AdminSubmissionsSection />}
          {activeTab === 'leaderboard' && <LeaderboardPage />}
          {activeTab === 'achievements' && <AdminAchievementsSection />}
          {activeTab === 'audit' && <AdminAuditLogsSection />}
          {activeTab === 'settings' && <AdminSettingsSection />}
        </main>
      </div>
    </div>
  );
}
