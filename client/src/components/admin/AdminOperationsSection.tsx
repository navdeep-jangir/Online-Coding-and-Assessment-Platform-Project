import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import {
  Award,
  Calendar,
  Download,
  Eye,
  FileText,
  KeyRound,
  LogOut,
  Plus,
  Printer,
  Search,
  UserCheck,
  UserX,
  X,
} from 'lucide-react';
import api, { authApi } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { formatDate } from '@/utils/helpers';

interface AdminUserRow {
  _id: string;
  name: string;
  email: string;
  role: string;
  collegeName?: string;
  preferredLanguage?: string;
  xp: number;
  currentStreak?: number;
  isActive: boolean;
  createdAt: string;
}

interface StudentDetailData {
  user: AdminUserRow;
  stats: {
    completedTopics: number;
    uniqueSolved: number;
    totalSubmissions: number;
    acceptedSubmissions: number;
    acceptanceRate: number;
    revisionsQueued: number;
    revisionsCompleted: number;
    dailyChallengesCompleted: number;
  };
  achievements: Array<{ _id: string; title: string; xpReward: number; earnedAt: string }>;
}

export function AdminStudentsSection({ initialMode = 'students' }: { initialMode?: 'students' | 'reports' }) {
  const [users, setUsers] = useState<AdminUserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedStudent, setSelectedStudent] = useState<StudentDetailData | null>(null);
  const [deactivateTarget, setDeactivateTarget] = useState<AdminUserRow | null>(null);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = { page, limit: 15, role: 'student' };
      if (search.trim()) params.search = search.trim();
      if (statusFilter !== 'all') params.isActive = statusFilter;
      const res = await api.get('/admin/users', { params });
      setUsers(Array.isArray(res.data?.data) ? res.data.data : []);
      setTotalPages(Number(res.data?.pagination?.totalPages || 1));
    } catch {
      toast.error('Failed to load students.');
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter]);

  useEffect(() => {
    void loadUsers();
  }, [loadUsers]);

  const openProfile = async (u: AdminUserRow) => {
    try {
      const res = await api.get(`/admin/users/${u._id}`);
      setSelectedStudent(res.data?.data || null);
    } catch {
      toast.error('Failed to load student details.');
    }
  };

  const handleExportStudentCsv = async (u: AdminUserRow) => {
    try {
      const res = await api.get(`/admin/users/${u._id}/export`, { responseType: 'blob' });
      const blob = new Blob([res.data], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `student-report-${u.name.replace(/\s+/g, '-').toLowerCase()}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success('Student CSV report downloaded.');
    } catch {
      toast.error('Failed to export student report.');
    }
  };

  const handleDeactivate = async () => {
    if (!deactivateTarget) return;
    try {
      await api.put(`/admin/users/${deactivateTarget._id}/deactivate`, { confirm: true });
      toast.success(`Deactivated ${deactivateTarget.name}.`);
      setDeactivateTarget(null);
      await loadUsers();
    } catch {
      toast.error('Failed to deactivate student.');
    }
  };

  const handleActivate = async (u: AdminUserRow) => {
    try {
      await api.put(`/admin/users/${u._id}/activate`);
      toast.success(`Activated ${u.name}.`);
      await loadUsers();
    } catch {
      toast.error('Failed to activate student.');
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-[#F0F6FC]">
          {initialMode === 'reports' ? 'Individual Student Performance Reports' : 'Student Management'}
        </h2>
        <p className="text-xs text-[#8B949E]">
          Inspect student learning progress, XP, achievements, export CSV/printable reports, and manage account status.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 rounded-xl border border-[#30363D] bg-[#161B22] p-4 sm:grid-cols-2">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-[#8B949E]" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search student name or email..."
            className="w-full rounded-lg border border-[#30363D] bg-[#0D1117] py-2 pl-9 pr-3 text-xs text-[#F0F6FC]"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
          className="rounded-lg border border-[#30363D] bg-[#0D1117] px-3 py-2 text-xs text-[#F0F6FC]"
        >
          <option value="all">All Accounts</option>
          <option value="true">Active Only</option>
          <option value="false">Deactivated Only</option>
        </select>
      </div>

      <div className="overflow-x-auto rounded-xl border border-[#30363D] bg-[#161B22]">
        <table className="w-full min-w-[700px] text-left text-xs">
          <thead>
            <tr className="border-b border-[#30363D] text-[#8B949E]">
              <th className="px-4 py-3">Student</th>
              <th className="px-4 py-3">College</th>
              <th className="px-4 py-3">XP / Streak</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#30363D]/60">
            {loading ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-[#8B949E]">
                  Loading students...
                </td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-[#8B949E]">
                  No students found.
                </td>
              </tr>
            ) : (
              users.map((u) => (
                <tr key={u._id} className="hover:bg-[#0D1117]/40">
                  <td className="px-4 py-3">
                    <p className="font-semibold text-[#F0F6FC]">{u.name}</p>
                    <p className="text-[11px] text-[#8B949E]">{u.email}</p>
                  </td>
                  <td className="px-4 py-3 text-[#C9D1D9]">{u.collegeName || '—'}</td>
                  <td className="px-4 py-3 font-mono text-[#38BDF8]">
                    {u.xp} XP • {u.currentStreak || 0}d
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2.5 py-0.5 ${
                        u.isActive !== false
                          ? 'bg-[#22C55E]/15 text-[#22C55E]'
                          : 'bg-rose-500/15 text-rose-300'
                      }`}
                    >
                      {u.isActive !== false ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1.5">
                      <button
                        type="button"
                        onClick={() => void openProfile(u)}
                        className="inline-flex items-center gap-1 rounded border border-[#30363D] bg-[#0D1117] px-2.5 py-1 text-[#F0F6FC]"
                      >
                        <Eye className="h-3 w-3" />
                        Profile &amp; Report
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleExportStudentCsv(u)}
                        className="inline-flex items-center gap-1 rounded border border-[#30363D] bg-[#0D1117] px-2.5 py-1 text-[#38BDF8]"
                      >
                        <Download className="h-3 w-3" />
                        CSV
                      </button>
                      {u.isActive !== false ? (
                        <button
                          type="button"
                          onClick={() => setDeactivateTarget(u)}
                          className="inline-flex items-center gap-1 rounded border border-[#30363D] bg-[#0D1117] px-2.5 py-1 text-rose-300"
                        >
                          <UserX className="h-3 w-3" />
                          Deactivate
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => void handleActivate(u)}
                          className="inline-flex items-center gap-1 rounded border border-[#22C55E]/40 bg-[#22C55E]/10 px-2.5 py-1 text-[#22C55E]"
                        >
                          <UserCheck className="h-3 w-3" />
                          Activate
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between text-xs text-[#8B949E]">
          <span>
            Page {page} of {totalPages}
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
              className="rounded border border-[#30363D] px-3 py-1 disabled:opacity-40"
            >
              Prev
            </button>
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="rounded border border-[#30363D] px-3 py-1 disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Student Detail & Printable Report Modal */}
      {selectedStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-[#30363D] bg-[#161B22] p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[#30363D] pb-3">
              <div>
                <h3 className="text-lg font-bold text-[#F0F6FC]">{selectedStudent.user.name}</h3>
                <p className="text-xs text-[#8B949E]">
                  {selectedStudent.user.collegeName || 'CodeClimb Student'} • Preferred:{' '}
                  {(selectedStudent.user.preferredLanguage || 'cpp').toUpperCase()}
                </p>
              </div>
              <div className="flex items-center gap-2 print:hidden">
                <button
                  type="button"
                  onClick={() => void handleExportStudentCsv(selectedStudent.user)}
                  className="inline-flex items-center gap-1 rounded border border-[#30363D] px-3 py-1.5 text-xs text-[#38BDF8]"
                >
                  <Download className="h-3.5 w-3.5" />
                  Export CSV
                </button>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-1 rounded border border-[#30363D] px-3 py-1.5 text-xs text-[#F0F6FC]"
                >
                  <Printer className="h-3.5 w-3.5" />
                  Print
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedStudent(null)}
                  aria-label="Close modal"
                  className="rounded p-1 text-[#8B949E] hover:text-[#F0F6FC]"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="rounded-lg border border-[#30363D] bg-[#0D1117] p-3">
                <p className="text-[11px] text-[#8B949E]">Solved</p>
                <p className="text-lg font-bold text-[#22C55E]">{selectedStudent.stats.uniqueSolved}</p>
              </div>
              <div className="rounded-lg border border-[#30363D] bg-[#0D1117] p-3">
                <p className="text-[11px] text-[#8B949E]">Acceptance</p>
                <p className="text-lg font-bold text-[#38BDF8]">{selectedStudent.stats.acceptanceRate}%</p>
              </div>
              <div className="rounded-lg border border-[#30363D] bg-[#0D1117] p-3">
                <p className="text-[11px] text-[#8B949E]">Topics Done</p>
                <p className="text-lg font-bold text-[#F0F6FC]">{selectedStudent.stats.completedTopics}</p>
              </div>
              <div className="rounded-lg border border-[#30363D] bg-[#0D1117] p-3">
                <p className="text-[11px] text-[#8B949E]">Daily Challenges</p>
                <p className="text-lg font-bold text-amber-300">{selectedStudent.stats.dailyChallengesCompleted}</p>
              </div>
            </div>

            <div className="rounded-lg border border-[#30363D] bg-[#0D1117] p-4 text-xs text-[#C9D1D9]">
              <p>
                Submissions: {selectedStudent.stats.acceptedSubmissions} accepted /{' '}
                {selectedStudent.stats.totalSubmissions} total • Revisions:{' '}
                {selectedStudent.stats.revisionsCompleted} completed /{' '}
                {selectedStudent.stats.revisionsQueued} queued • XP: {selectedStudent.user.xp}
              </p>
            </div>

            <div>
              <h4 className="mb-2 text-xs font-semibold uppercase text-[#8B949E]">
                Unlocked Achievements ({selectedStudent.achievements.length})
              </h4>
              <div className="flex flex-wrap gap-2">
                {selectedStudent.achievements.map((a) => (
                  <span
                    key={a._id}
                    className="rounded-full border border-[#22C55E]/30 bg-[#22C55E]/10 px-3 py-1 text-xs text-[#22C55E]"
                  >
                    {a.title} (+{a.xpReward} XP)
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        isOpen={Boolean(deactivateTarget)}
        title="Deactivate Student Account"
        description={`Deactivate "${deactivateTarget?.name}"? Historical submissions and progress will be preserved.`}
        confirmText="Deactivate"
        onConfirm={() => void handleDeactivate()}
        onClose={() => setDeactivateTarget(null)}
      />
    </div>
  );
}

export function AdminSubmissionsSection() {
  const [data, setData] = useState<{
    totalSubmissions: number;
    acceptedSubmissions: number;
    acceptanceRate: number;
    internalErrorCount: number;
    submissions: Array<{
      _id: string;
      studentName: string;
      problemTitle: string;
      difficulty: string;
      language: string;
      verdict: string;
      passedTestCases: number;
      totalTestCases: number;
      runtime: number;
      memory: number;
      submittedAt: string;
    }>;
  } | null>(null);
  const [search, setSearch] = useState('');
  const [language, setLanguage] = useState('');
  const [status, setStatus] = useState('');

  const load = useCallback(async () => {
    try {
      const res = await api.get('/admin/submissions', {
        params: {
          days: 30,
          limit: 30,
          ...(search.trim() ? { search: search.trim() } : {}),
          ...(language ? { language } : {}),
          ...(status ? { status } : {}),
        },
      });
      setData(res.data?.data || null);
    } catch {
      toast.error('Failed to load submissions.');
    }
  }, [search, language, status]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-[#F0F6FC]">Submission Monitoring</h2>
        <p className="text-xs text-[#8B949E]">
          Platform-wide Judge0 submission verdicts, runtime, and service reliability (private code omitted).
        </p>
      </div>

      {data && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-xl border border-[#30363D] bg-[#161B22] p-4">
            <p className="text-xs text-[#8B949E]">Total (30d)</p>
            <p className="mt-1 text-xl font-bold">{data.totalSubmissions}</p>
          </div>
          <div className="rounded-xl border border-[#30363D] bg-[#161B22] p-4">
            <p className="text-xs text-[#8B949E]">Accepted</p>
            <p className="mt-1 text-xl font-bold text-[#22C55E]">{data.acceptedSubmissions}</p>
          </div>
          <div className="rounded-xl border border-[#30363D] bg-[#161B22] p-4">
            <p className="text-xs text-[#8B949E]">Acceptance Rate</p>
            <p className="mt-1 text-xl font-bold text-[#38BDF8]">{data.acceptanceRate}%</p>
          </div>
          <div className="rounded-xl border border-[#30363D] bg-[#161B22] p-4">
            <p className="text-xs text-[#8B949E]">Judge0 Failures</p>
            <p className="mt-1 text-xl font-bold text-rose-400">{data.internalErrorCount}</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-3 rounded-xl border border-[#30363D] bg-[#161B22] p-4 sm:grid-cols-3">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search student or problem..."
          className="rounded-lg border border-[#30363D] bg-[#0D1117] px-3 py-2 text-xs text-[#F0F6FC]"
        />
        <select
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
          className="rounded-lg border border-[#30363D] bg-[#0D1117] px-3 py-2 text-xs text-[#F0F6FC]"
        >
          <option value="">All Languages</option>
          <option value="c">C</option>
          <option value="cpp">C++</option>
          <option value="java">Java</option>
          <option value="python">Python</option>
        </select>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="rounded-lg border border-[#30363D] bg-[#0D1117] px-3 py-2 text-xs text-[#F0F6FC]"
        >
          <option value="">All Verdicts</option>
          <option value="Accepted">Accepted</option>
          <option value="Wrong Answer">Wrong Answer</option>
          <option value="Compilation Error">Compilation Error</option>
          <option value="Runtime Error">Runtime Error</option>
        </select>
      </div>

      <div className="overflow-x-auto rounded-xl border border-[#30363D] bg-[#161B22]">
        <table className="w-full min-w-[700px] text-left text-xs">
          <thead>
            <tr className="border-b border-[#30363D] text-[#8B949E]">
              <th className="px-4 py-3">Student</th>
              <th className="px-4 py-3">Problem</th>
              <th className="px-4 py-3">Lang</th>
              <th className="px-4 py-3">Verdict</th>
              <th className="px-4 py-3">Tests</th>
              <th className="px-4 py-3">Runtime / Mem</th>
              <th className="px-4 py-3">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#30363D]/60">
            {(data?.submissions || []).map((s) => (
              <tr key={s._id} className="hover:bg-[#0D1117]/40">
                <td className="px-4 py-3 font-medium text-[#F0F6FC]">{s.studentName}</td>
                <td className="px-4 py-3 text-[#C9D1D9]">{s.problemTitle}</td>
                <td className="px-4 py-3 font-mono text-[#8B949E]">{s.language}</td>
                <td className="px-4 py-3">
                  <span className={s.verdict === 'Accepted' ? 'text-[#22C55E]' : 'text-rose-400'}>
                    {s.verdict}
                  </span>
                </td>
                <td className="px-4 py-3 font-mono text-[#8B949E]">
                  {s.passedTestCases}/{s.totalTestCases}
                </td>
                <td className="px-4 py-3 font-mono text-[#8B949E]">
                  {s.runtime} ms / {Math.round(s.memory)} KB
                </td>
                <td className="px-4 py-3 text-[#8B949E]">{formatDate(s.submittedAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function AdminDailyChallengesSection() {
  const [info, setInfo] = useState<{
    todayIST: string;
    todayStats: { assignedCount: number; completedCount: number };
    challenges: Array<{
      _id: string;
      date: string;
      difficulty: string;
      problem?: { _id: string; title: string; slug: string; difficulty: string };
    }>;
  } | null>(null);
  const [problems, setProblems] = useState<Array<{ _id: string; title: string; difficulty: string }>>([]);
  const [date, setDate] = useState('');
  const [problemId, setProblemId] = useState('');

  const load = useCallback(async () => {
    try {
      const [dcRes, pRes] = await Promise.all([
        api.get('/admin/daily-challenges'),
        api.get('/admin/problems', { params: { limit: 100, status: 'published' } }),
      ]);
      setInfo(dcRes.data?.data || null);
      setProblems(Array.isArray(pRes.data?.data) ? pRes.data.data : []);
    } catch {
      toast.error('Failed to load daily challenges.');
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const handleAssign = async () => {
    if (!date || !problemId) {
      toast.error('Select a future date and problem.');
      return;
    }
    try {
      await api.post('/daily-challenges/assign', { date, problemId });
      toast.success(`Scheduled challenge for ${date}.`);
      setDate('');
      await load();
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Failed to schedule challenge.';
      toast.error(msg);
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-[#F0F6FC]">Daily Challenge Management</h2>
        <p className="text-xs text-[#8B949E]">
          View today&apos;s IST participation and schedule future global fallback challenges without overwriting active student assignments.
        </p>
      </div>

      {info && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-[#30363D] bg-[#161B22] p-4">
            <p className="text-xs text-[#8B949E]">Today (IST)</p>
            <p className="mt-1 font-mono text-lg font-bold text-[#22C55E]">{info.todayIST}</p>
          </div>
          <div className="rounded-xl border border-[#30363D] bg-[#161B22] p-4">
            <p className="text-xs text-[#8B949E]">Students Assigned Today</p>
            <p className="mt-1 text-lg font-bold">{info.todayStats.assignedCount}</p>
          </div>
          <div className="rounded-xl border border-[#30363D] bg-[#161B22] p-4">
            <p className="text-xs text-[#8B949E]">Completed Today</p>
            <p className="mt-1 text-lg font-bold text-[#38BDF8]">{info.todayStats.completedCount}</p>
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-end gap-3 rounded-xl border border-[#30363D] bg-[#161B22] p-4">
        <div>
          <label className="mb-1 block text-xs text-[#8B949E]">Schedule Date (YYYY-MM-DD)</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="rounded-lg border border-[#30363D] bg-[#0D1117] px-3 py-2 text-xs text-[#F0F6FC]"
          />
        </div>
        <div className="flex-1 min-w-[220px]">
          <label className="mb-1 block text-xs text-[#8B949E]">Problem</label>
          <select
            value={problemId}
            onChange={(e) => setProblemId(e.target.value)}
            className="w-full rounded-lg border border-[#30363D] bg-[#0D1117] px-3 py-2 text-xs text-[#F0F6FC]"
          >
            <option value="">Select published problem...</option>
            {problems.map((p) => (
              <option key={p._id} value={p._id}>
                {p.title} ({p.difficulty})
              </option>
            ))}
          </select>
        </div>
        <button
          type="button"
          onClick={() => void handleAssign()}
          className="inline-flex items-center gap-1.5 rounded-lg bg-[#22C55E] px-4 py-2 text-xs font-semibold text-[#0D1117]"
        >
          <Calendar className="h-3.5 w-3.5" />
          Schedule Challenge
        </button>
      </div>

      <div className="space-y-2 rounded-xl border border-[#30363D] bg-[#161B22] p-4">
        <h3 className="text-sm font-semibold text-[#F0F6FC]">Recent &amp; Scheduled Challenges</h3>
        {(info?.challenges || []).map((c) => (
          <div
            key={c._id}
            className="flex items-center justify-between rounded-lg border border-[#30363D] bg-[#0D1117] px-3.5 py-2.5 text-xs"
          >
            <span className="font-mono text-[#8B949E]">{c.date}</span>
            <span className="font-semibold text-[#F0F6FC]">{c.problem?.title || 'Problem'}</span>
            <span className="text-[#38BDF8]">{c.problem?.difficulty || c.difficulty}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function AdminAchievementsSection() {
  const [achievements, setAchievements] = useState<
    Array<{
      _id: string;
      key: string;
      title: string;
      description: string;
      xpReward: number;
      earnedCount: number;
      criteria: { type: string; threshold: number };
    }>
  >([]);
  const [newAch, setNewAch] = useState({
    key: '',
    title: '',
    description: '',
    xpReward: 25,
    type: 'accepted_count',
    threshold: 5,
  });

  const load = useCallback(async () => {
    try {
      const res = await api.get('/admin/achievements');
      setAchievements(Array.isArray(res.data?.data) ? res.data.data : []);
    } catch {
      toast.error('Failed to load achievements.');
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const handleCreate = async () => {
    if (!newAch.key.trim() || !newAch.title.trim()) {
      toast.error('Key and title are required.');
      return;
    }
    try {
      await api.post('/admin/achievements', {
        key: newAch.key.trim().toLowerCase(),
        title: newAch.title.trim(),
        description: newAch.description.trim() || newAch.title.trim(),
        xpReward: Number(newAch.xpReward),
        criteria: { type: newAch.type, threshold: Number(newAch.threshold) },
      });
      toast.success('Achievement created!');
      setNewAch({ key: '', title: '', description: '', xpReward: 25, type: 'accepted_count', threshold: 5 });
      await load();
    } catch {
      toast.error('Failed to create achievement.');
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-[#F0F6FC]">Achievement Management</h2>
        <p className="text-xs text-[#8B949E]">
          Configure achievement criteria and XP rewards while preserving all earned student badges.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-2 rounded-xl border border-[#30363D] bg-[#161B22] p-4 sm:grid-cols-5">
        <input
          type="text"
          placeholder="Key (e.g. stack_pro)"
          value={newAch.key}
          onChange={(e) => setNewAch({ ...newAch, key: e.target.value })}
          className="rounded border border-[#30363D] bg-[#0D1117] px-2.5 py-1.5 text-xs text-[#F0F6FC]"
        />
        <input
          type="text"
          placeholder="Title"
          value={newAch.title}
          onChange={(e) => setNewAch({ ...newAch, title: e.target.value })}
          className="rounded border border-[#30363D] bg-[#0D1117] px-2.5 py-1.5 text-xs text-[#F0F6FC]"
        />
        <select
          value={newAch.type}
          onChange={(e) => setNewAch({ ...newAch, type: e.target.value })}
          className="rounded border border-[#30363D] bg-[#0D1117] px-2.5 py-1.5 text-xs text-[#F0F6FC]"
        >
          <option value="accepted_count">Solved Count</option>
          <option value="daily_count">Daily Challenges</option>
          <option value="streak">Streak Days</option>
          <option value="language_count">Languages Used</option>
        </select>
        <input
          type="number"
          placeholder="Threshold"
          value={newAch.threshold}
          onChange={(e) => setNewAch({ ...newAch, threshold: Number(e.target.value) })}
          className="rounded border border-[#30363D] bg-[#0D1117] px-2.5 py-1.5 text-xs text-[#F0F6FC]"
        />
        <button
          type="button"
          onClick={() => void handleCreate()}
          className="inline-flex items-center justify-center gap-1 rounded bg-[#22C55E] px-3 py-1.5 text-xs font-semibold text-[#0D1117]"
        >
          <Plus className="h-3.5 w-3.5" />
          Add Badge
        </button>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {achievements.map((a) => (
          <div key={a._id} className="rounded-xl border border-[#30363D] bg-[#161B22] p-4">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#F0F6FC]">
                <Award className="h-4 w-4 text-amber-400" />
                {a.title}
              </span>
              <span className="text-xs font-mono text-[#22C55E]">+{a.xpReward} XP</span>
            </div>
            <p className="mt-1 text-xs text-[#8B949E]">{a.description}</p>
            <p className="mt-2 text-[11px] text-[#8B949E]">
              {a.criteria.type} &ge; {a.criteria.threshold} • {a.earnedCount} unlocked
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

export function AdminAuditLogsSection() {
  const [logs, setLogs] = useState<
    Array<{
      _id: string;
      action: string;
      targetType: string;
      targetId?: string;
      details?: Record<string, unknown>;
      createdAt: string;
      admin?: { name?: string };
    }>
  >([]);
  const [actionFilter, setActionFilter] = useState('');
  const [targetFilter, setTargetFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const load = useCallback(async () => {
    try {
      const res = await api.get('/admin/audit-log', {
        params: {
          page,
          limit: 20,
          ...(actionFilter ? { action: actionFilter } : {}),
          ...(targetFilter ? { targetType: targetFilter } : {}),
        },
      });
      setLogs(Array.isArray(res.data?.data) ? res.data.data : []);
      setTotalPages(Number(res.data?.pagination?.totalPages || 1));
    } catch {
      toast.error('Failed to load audit logs.');
    }
  }, [page, actionFilter, targetFilter]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-[#F0F6FC]">Administrator Audit Logs</h2>
        <p className="text-xs text-[#8B949E]">
          Immutable record of administrative actions (credentials and secrets are never logged).
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 rounded-xl border border-[#30363D] bg-[#161B22] p-4 sm:grid-cols-2">
        <input
          type="text"
          value={actionFilter}
          onChange={(e) => {
            setActionFilter(e.target.value);
            setPage(1);
          }}
          placeholder="Filter by action (e.g. CREATE_PROBLEM)..."
          className="rounded-lg border border-[#30363D] bg-[#0D1117] px-3 py-2 text-xs text-[#F0F6FC]"
        />
        <select
          value={targetFilter}
          onChange={(e) => {
            setTargetFilter(e.target.value);
            setPage(1);
          }}
          className="rounded-lg border border-[#30363D] bg-[#0D1117] px-3 py-2 text-xs text-[#F0F6FC]"
        >
          <option value="">All Targets</option>
          <option value="Problem">Problem</option>
          <option value="TestCase">TestCase</option>
          <option value="Topic">Topic</option>
          <option value="Note">Note</option>
          <option value="User">User</option>
          <option value="Achievement">Achievement</option>
          <option value="DailyChallenge">DailyChallenge</option>
        </select>
      </div>

      <div className="space-y-2">
        {logs.map((log) => (
          <div
            key={log._id}
            className="flex flex-col justify-between gap-2 rounded-xl border border-[#30363D] bg-[#161B22] p-4 sm:flex-row sm:items-center"
          >
            <div className="space-y-1 text-xs">
              <div className="flex flex-wrap items-center gap-2">
                <FileText className="h-3.5 w-3.5 text-[#38BDF8]" />
                <span className="font-mono font-semibold text-[#22C55E]">{log.action}</span>
                <span className="rounded bg-[#0D1117] px-2 py-0.5 text-[#8B949E]">{log.targetType}</span>
                <span className="text-[#8B949E]">by {log.admin?.name || 'Admin'}</span>
              </div>
              {log.details && Object.keys(log.details).length > 0 && (
                <p className="font-mono text-[11px] text-[#8B949E]">
                  {JSON.stringify(log.details)}
                </p>
              )}
            </div>
            <span className="shrink-0 text-xs text-[#8B949E]">{formatDate(log.createdAt)}</span>
          </div>
        ))}
      </div>

      {totalPages > 1 && (
        <div className="flex justify-between text-xs text-[#8B949E]">
          <span>
            Page {page} of {totalPages}
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
              className="rounded border border-[#30363D] px-3 py-1 disabled:opacity-40"
            >
              Prev
            </button>
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="rounded border border-[#30363D] px-3 py-1 disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export function AdminSettingsSection() {
  const { user, logout } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [saving, setSaving] = useState(false);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      toast.error('New password must be at least 6 characters.');
      return;
    }
    setSaving(true);
    try {
      await authApi.changePassword({ currentPassword, newPassword });
      toast.success('Administrator password updated!');
      setCurrentPassword('');
      setNewPassword('');
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Failed to change password.';
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-xl space-y-6">
      <div>
        <h2 className="text-xl font-bold text-[#F0F6FC]">Administrator Settings</h2>
        <p className="text-xs text-[#8B949E]">
          Signed in as {user?.name} ({user?.role})
        </p>
      </div>

      <form
        onSubmit={(e) => void handleChangePassword(e)}
        className="space-y-4 rounded-xl border border-[#30363D] bg-[#161B22] p-5"
      >
        <h3 className="flex items-center gap-2 text-sm font-semibold text-[#F0F6FC]">
          <KeyRound className="h-4 w-4 text-[#22C55E]" />
          Change Administrator Password
        </h3>
        <input
          type="password"
          required
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          placeholder="Current password"
          className="w-full rounded-lg border border-[#30363D] bg-[#0D1117] px-3 py-2 text-xs text-[#F0F6FC]"
        />
        <input
          type="password"
          required
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          placeholder="New password (min 6 chars)"
          className="w-full rounded-lg border border-[#30363D] bg-[#0D1117] px-3 py-2 text-xs text-[#F0F6FC]"
        />
        <button
          type="submit"
          disabled={saving}
          className="rounded-lg bg-[#22C55E] px-4 py-2 text-xs font-semibold text-[#0D1117]"
        >
          {saving ? 'Updating...' : 'Update Password'}
        </button>
      </form>

      <div className="rounded-xl border border-[#30363D] bg-[#161B22] p-5">
        <button
          type="button"
          onClick={() => void logout()}
          className="inline-flex items-center gap-2 rounded-lg border border-rose-500/40 bg-rose-500/10 px-4 py-2 text-xs font-semibold text-rose-300"
        >
          <LogOut className="h-4 w-4" />
          Sign Out of Admin Panel
        </button>
      </div>
    </div>
  );
}
