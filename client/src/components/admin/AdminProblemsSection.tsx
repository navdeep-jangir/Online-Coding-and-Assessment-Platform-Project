import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import {
  Archive,
  CheckCircle2,
  Edit3,
  Eye,
  FlaskConical,
  ListChecks,
  Play,
  Plus,
  Search,
  Send,
  Trash2,
  X,
} from 'lucide-react';
import api from '@/services/api';
import { DifficultyBadge } from '@/components/common/DifficultyBadge';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { MarkdownPreview } from '@/components/admin/MarkdownPreview';

interface TopicOption {
  _id: string;
  title: string;
  slug: string;
}

interface AdminProblemRow {
  _id: string;
  title: string;
  slug: string;
  description: string;
  inputFormat: string;
  outputFormat: string;
  constraints: string;
  examples: Array<{ input: string; output: string; explanation?: string }>;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  topics: TopicOption[];
  tags: string[];
  hints: string[];
  editorial: string;
  timeLimit: number;
  memoryLimit: number;
  starterCode: { c: string; cpp: string; java: string; python: string };
  referenceSolutions?: { c?: string; cpp?: string; java?: string; python?: string };
  validationStatus?: {
    c?: string;
    cpp?: string;
    java?: string;
    python?: string;
    isValidated?: boolean;
    lastValidatedAt?: string | null;
  };
  requiresRevalidation?: boolean;
  isPublished: boolean;
  isArchived: boolean;
  sampleCount: number;
  hiddenCount: number;
}

interface TestCaseRow {
  _id: string;
  input: string;
  expectedOutput: string;
  isSample: boolean;
  order: number;
  explanation?: string;
}

interface ValidationCaseResult {
  index: number;
  isSample: boolean;
  verdict: string;
  input: string;
  expectedOutput: string;
  actualOutput: string;
  stderr?: string;
  compileOutput?: string;
  runtimeMs: number;
}

export function AdminProblemsSection({ initialMode = 'problems' }: { initialMode?: 'problems' | 'testcases' }) {
  const [problems, setProblems] = useState<AdminProblemRow[]>([]);
  const [topics, setTopics] = useState<TopicOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [difficulty, setDifficulty] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Create/Edit Problem Modal
  const [editingProblem, setEditingProblem] = useState<Partial<AdminProblemRow> | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [savingProblem, setSavingProblem] = useState(false);

  // Test Cases Modal
  const [tcProblem, setTcProblem] = useState<AdminProblemRow | null>(null);
  const [testCases, setTestCases] = useState<TestCaseRow[]>([]);
  const [newTc, setNewTc] = useState({ input: '', expectedOutput: '', isSample: true, explanation: '' });
  const [deleteTcTarget, setDeleteTcTarget] = useState<TestCaseRow | null>(null);

  // Reference Solution Validation Modal
  const [valProblem, setValProblem] = useState<AdminProblemRow | null>(null);
  const [valLang, setValLang] = useState<'c' | 'cpp' | 'java' | 'python'>('python');
  const [valCode, setValCode] = useState('');
  const [validating, setValidating] = useState(false);
  const [valResults, setValResults] = useState<{
    allPassed: boolean;
    passedCount: number;
    totalCases: number;
    results: ValidationCaseResult[];
  } | null>(null);

  // Archive confirm
  const [archiveTarget, setArchiveTarget] = useState<AdminProblemRow | null>(null);

  const loadProblems = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/problems', {
        params: {
          page,
          limit: 12,
          ...(search.trim() ? { search: search.trim() } : {}),
          ...(difficulty ? { difficulty } : {}),
          status: statusFilter,
        },
      });
      setProblems(Array.isArray(res.data?.data) ? res.data.data : []);
      setTotalPages(Number(res.data?.pagination?.totalPages || 1));
    } catch {
      toast.error('Failed to load problems.');
    } finally {
      setLoading(false);
    }
  }, [page, search, difficulty, statusFilter]);

  useEffect(() => {
    void loadProblems();
  }, [loadProblems]);

  useEffect(() => {
    api
      .get('/topics', { params: { limit: 400 } })
      .then((res) => {
        const list = Array.isArray(res.data?.data) ? res.data.data : [];
        setTopics(list);
      })
      .catch(() => {});
  }, []);

  const openCreateModal = () => {
    setShowPreview(false);
    setEditingProblem({
      title: '',
      slug: '',
      description: '',
      inputFormat: '',
      outputFormat: '',
      constraints: '',
      examples: [{ input: '', output: '', explanation: '' }],
      difficulty: 'Easy',
      topics: [],
      tags: [],
      hints: [],
      editorial: '',
      timeLimit: 2000,
      memoryLimit: 262144,
      starterCode: { c: '', cpp: '', java: '', python: '' },
      isPublished: false,
    });
  };

  const handleSaveProblem = async () => {
    if (!editingProblem?.title?.trim() || !editingProblem?.description?.trim()) {
      toast.error('Title and description are required.');
      return;
    }
    setSavingProblem(true);
    try {
      const slug =
        editingProblem.slug?.trim() ||
        editingProblem.title
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-|-$/g, '');

      const payload = {
        ...editingProblem,
        slug,
        topics: (editingProblem.topics || []).map((t) => (typeof t === 'string' ? t : t._id)),
      };

      if (editingProblem._id) {
        await api.put(`/problems/${editingProblem._id}`, payload);
        toast.success('Problem updated (saved as draft/edited).');
      } else {
        await api.post('/problems', { ...payload, isPublished: false });
        toast.success('Draft problem created!');
      }
      setEditingProblem(null);
      await loadProblems();
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Failed to save problem.';
      toast.error(msg);
    } finally {
      setSavingProblem(false);
    }
  };

  const handlePublish = async (prob: AdminProblemRow) => {
    try {
      await api.put(`/admin/problems/${prob._id}/publish`);
      toast.success(`Published "${prob.title}"!`);
      await loadProblems();
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Cannot publish problem.';
      toast.error(msg);
    }
  };

  const handleArchive = async () => {
    if (!archiveTarget) return;
    try {
      await api.delete(`/problems/${archiveTarget._id}`);
      toast.success(`Archived "${archiveTarget.title}".`);
      setArchiveTarget(null);
      await loadProblems();
    } catch {
      toast.error('Failed to archive problem.');
    }
  };

  const openTestCases = async (prob: AdminProblemRow) => {
    setTcProblem(prob);
    try {
      const res = await api.get(`/test-cases/problem/${prob._id}`);
      setTestCases(Array.isArray(res.data?.data) ? res.data.data : []);
    } catch {
      toast.error('Failed to load test cases.');
    }
  };

  const handleAddTestCase = async () => {
    if (!tcProblem) return;
    if (typeof newTc.expectedOutput !== 'string' || !newTc.expectedOutput.trim()) {
      toast.error('Expected output is required.');
      return;
    }
    try {
      await api.post('/test-cases', {
        problem: tcProblem._id,
        input: newTc.input,
        expectedOutput: newTc.expectedOutput,
        isSample: newTc.isSample,
        explanation: newTc.explanation,
        order: testCases.length,
      });
      toast.success('Test case added.');
      setNewTc({ input: '', expectedOutput: '', isSample: false, explanation: '' });
      await openTestCases(tcProblem);
      await loadProblems();
    } catch {
      toast.error('Failed to add test case.');
    }
  };

  const handleToggleTcSample = async (tc: TestCaseRow) => {
    if (!tcProblem) return;
    try {
      await api.put(`/test-cases/${tc._id}`, { isSample: !tc.isSample });
      await openTestCases(tcProblem);
      await loadProblems();
    } catch {
      toast.error('Failed to update test case.');
    }
  };

  const handleDeleteTestCase = async () => {
    if (!deleteTcTarget || !tcProblem) return;
    try {
      await api.delete(`/test-cases/${deleteTcTarget._id}`);
      toast.success('Test case removed.');
      setDeleteTcTarget(null);
      await openTestCases(tcProblem);
      await loadProblems();
    } catch {
      toast.error('Failed to delete test case.');
    }
  };

  const openValidation = (prob: AdminProblemRow) => {
    setValProblem(prob);
    setValLang('python');
    setValCode(prob.referenceSolutions?.python || prob.starterCode?.python || '');
    setValResults(null);
  };

  const handleRunValidation = async () => {
    if (!valProblem) return;
    if (!valCode.trim()) {
      toast.error('Enter a reference solution first.');
      return;
    }
    setValidating(true);
    try {
      const res = await api.post(`/admin/problems/${valProblem._id}/validate-solution`, {
        language: valLang,
        code: valCode,
      });
      setValResults(res.data?.data || null);
      if (res.data?.data?.allPassed) {
        toast.success('All test cases passed! Reference solution validated.');
      } else {
        toast.error('Some test cases failed. Check expected vs actual outputs.');
      }
      await loadProblems();
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Validation failed.';
      toast.error(msg);
    } finally {
      setValidating(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-xl font-bold text-[#F0F6FC]">
            {initialMode === 'testcases' ? 'Test Case & Reference Validation' : 'Coding Problems'}
          </h2>
          <p className="text-xs text-[#8B949E]">
            Create drafts, manage sample/hidden test cases, validate reference solutions via Judge0, and publish safely.
          </p>
        </div>
        <button
          type="button"
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 rounded-lg bg-[#22C55E] px-4 py-2 text-xs font-semibold text-[#0D1117] hover:bg-[#22C55E]/90"
        >
          <Plus className="h-4 w-4" />
          New Draft Problem
        </button>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 gap-3 rounded-xl border border-[#30363D] bg-[#161B22] p-4 sm:grid-cols-3">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-[#8B949E]" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search title, slug, tag..."
            className="w-full rounded-lg border border-[#30363D] bg-[#0D1117] py-2 pl-9 pr-3 text-xs text-[#F0F6FC] placeholder-[#8B949E] focus:border-[#22C55E] focus:outline-none"
          />
        </div>
        <select
          value={difficulty}
          onChange={(e) => {
            setDifficulty(e.target.value);
            setPage(1);
          }}
          className="rounded-lg border border-[#30363D] bg-[#0D1117] px-3 py-2 text-xs text-[#F0F6FC]"
        >
          <option value="">All Difficulties</option>
          <option value="Easy">Easy</option>
          <option value="Medium">Medium</option>
          <option value="Hard">Hard</option>
        </select>
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
          className="rounded-lg border border-[#30363D] bg-[#0D1117] px-3 py-2 text-xs text-[#F0F6FC]"
        >
          <option value="all">All Statuses</option>
          <option value="published">Published</option>
          <option value="draft">Drafts</option>
          <option value="archived">Archived</option>
        </select>
      </div>

      {/* Problems Table */}
      <div className="overflow-x-auto rounded-xl border border-[#30363D] bg-[#161B22]">
        <table className="w-full min-w-[760px] text-left text-xs">
          <thead>
            <tr className="border-b border-[#30363D] text-[#8B949E]">
              <th className="px-4 py-3">Problem</th>
              <th className="px-4 py-3">Difficulty</th>
              <th className="px-4 py-3">Test Cases</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Validation</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#30363D]/60">
            {loading ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-[#8B949E]">
                  Loading problems...
                </td>
              </tr>
            ) : problems.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-[#8B949E]">
                  No problems match your filters.
                </td>
              </tr>
            ) : (
              problems.map((p) => (
                <tr key={p._id} className="hover:bg-[#0D1117]/40">
                  <td className="px-4 py-3">
                    <p className="font-semibold text-[#F0F6FC]">{p.title}</p>
                    <p className="font-mono text-[11px] text-[#8B949E]">{p.slug}</p>
                  </td>
                  <td className="px-4 py-3">
                    <DifficultyBadge difficulty={p.difficulty} size="sm" />
                  </td>
                  <td className="px-4 py-3 text-[#C9D1D9]">
                    {p.sampleCount} sample / {p.hiddenCount} hidden
                  </td>
                  <td className="px-4 py-3">
                    {p.isArchived ? (
                      <span className="rounded-full bg-[#30363D] px-2.5 py-0.5 text-[#8B949E]">
                        Archived
                      </span>
                    ) : p.isPublished ? (
                      <span className="rounded-full bg-[#22C55E]/15 px-2.5 py-0.5 text-[#22C55E]">
                        Published
                      </span>
                    ) : (
                      <span className="rounded-full bg-amber-500/15 px-2.5 py-0.5 text-amber-300">
                        Draft
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {p.validationStatus?.isValidated && !p.requiresRevalidation ? (
                      <span className="inline-flex items-center gap-1 text-[#22C55E]">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Verified
                      </span>
                    ) : (
                      <span className="text-[#8B949E]">Untested</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          setShowPreview(false);
                          setEditingProblem(p);
                        }}
                        className="inline-flex items-center gap-1 rounded border border-[#30363D] bg-[#0D1117] px-2 py-1 text-[#F0F6FC] hover:border-[#38BDF8]"
                      >
                        <Edit3 className="h-3 w-3" />
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => void openTestCases(p)}
                        className="inline-flex items-center gap-1 rounded border border-[#30363D] bg-[#0D1117] px-2 py-1 text-[#F0F6FC] hover:border-[#22C55E]"
                      >
                        <ListChecks className="h-3 w-3" />
                        Tests
                      </button>
                      <button
                        type="button"
                        onClick={() => openValidation(p)}
                        className="inline-flex items-center gap-1 rounded border border-[#30363D] bg-[#0D1117] px-2 py-1 text-[#38BDF8] hover:border-[#38BDF8]"
                      >
                        <FlaskConical className="h-3 w-3" />
                        Validate
                      </button>
                      {!p.isPublished && !p.isArchived && (
                        <button
                          type="button"
                          onClick={() => void handlePublish(p)}
                          className="inline-flex items-center gap-1 rounded border border-[#22C55E]/40 bg-[#22C55E]/10 px-2 py-1 text-[#22C55E]"
                        >
                          <Send className="h-3 w-3" />
                          Publish
                        </button>
                      )}
                      {!p.isArchived && (
                        <button
                          type="button"
                          onClick={() => setArchiveTarget(p)}
                          className="inline-flex items-center gap-1 rounded border border-[#30363D] bg-[#0D1117] px-2 py-1 text-rose-300 hover:border-rose-500/40"
                        >
                          <Archive className="h-3 w-3" />
                          Archive
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

      {/* Pagination */}
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

      {/* Create/Edit Problem Modal */}
      {editingProblem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4">
          <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-2xl border border-[#30363D] bg-[#161B22] p-6">
            <div className="mb-4 flex items-center justify-between border-b border-[#30363D] pb-3">
              <h3 className="text-lg font-bold text-[#F0F6FC]">
                {editingProblem._id ? 'Edit Problem' : 'Create Draft Problem'}
              </h3>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowPreview((v) => !v)}
                  className="inline-flex items-center gap-1 rounded-lg border border-[#30363D] bg-[#0D1117] px-3 py-1.5 text-xs text-[#F0F6FC]"
                >
                  <Eye className="h-3.5 w-3.5" />
                  {showPreview ? 'Edit Form' : 'Preview'}
                </button>
                <button
                  type="button"
                  onClick={() => setEditingProblem(null)}
                  aria-label="Close modal"
                  className="rounded p-1 text-[#8B949E] hover:text-[#F0F6FC]"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {showPreview ? (
              <div className="space-y-4">
                <h4 className="text-xl font-bold">{editingProblem.title || 'Untitled Problem'}</h4>
                <MarkdownPreview content={editingProblem.description || ''} />
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <input
                  type="text"
                  placeholder="Title"
                  value={editingProblem.title || ''}
                  onChange={(e) => setEditingProblem({ ...editingProblem, title: e.target.value })}
                  className="rounded-lg border border-[#30363D] bg-[#0D1117] px-3 py-2 text-sm text-[#F0F6FC]"
                />
                <input
                  type="text"
                  placeholder="Unique slug (auto-generated if blank)"
                  value={editingProblem.slug || ''}
                  onChange={(e) => setEditingProblem({ ...editingProblem, slug: e.target.value })}
                  className="rounded-lg border border-[#30363D] bg-[#0D1117] px-3 py-2 text-sm text-[#F0F6FC]"
                />
                <select
                  value={editingProblem.difficulty || 'Easy'}
                  onChange={(e) =>
                    setEditingProblem({
                      ...editingProblem,
                      difficulty: e.target.value as 'Easy' | 'Medium' | 'Hard',
                    })
                  }
                  className="rounded-lg border border-[#30363D] bg-[#0D1117] px-3 py-2 text-sm text-[#F0F6FC]"
                >
                  <option value="Easy">Easy</option>
                  <option value="Medium">Medium</option>
                  <option value="Hard">Hard</option>
                </select>
                <input
                  type="text"
                  placeholder="Tags (comma-separated)"
                  value={(editingProblem.tags || []).join(', ')}
                  onChange={(e) =>
                    setEditingProblem({
                      ...editingProblem,
                      tags: e.target.value
                        .split(',')
                        .map((s) => s.trim())
                        .filter(Boolean),
                    })
                  }
                  className="rounded-lg border border-[#30363D] bg-[#0D1117] px-3 py-2 text-sm text-[#F0F6FC]"
                />
                <textarea
                  rows={4}
                  placeholder="Problem description (Markdown)"
                  value={editingProblem.description || ''}
                  onChange={(e) => setEditingProblem({ ...editingProblem, description: e.target.value })}
                  className="rounded-lg border border-[#30363D] bg-[#0D1117] p-3 text-xs text-[#F0F6FC] sm:col-span-2"
                />
                <textarea
                  rows={2}
                  placeholder="Input format"
                  value={editingProblem.inputFormat || ''}
                  onChange={(e) => setEditingProblem({ ...editingProblem, inputFormat: e.target.value })}
                  className="rounded-lg border border-[#30363D] bg-[#0D1117] p-3 text-xs text-[#F0F6FC]"
                />
                <textarea
                  rows={2}
                  placeholder="Output format"
                  value={editingProblem.outputFormat || ''}
                  onChange={(e) => setEditingProblem({ ...editingProblem, outputFormat: e.target.value })}
                  className="rounded-lg border border-[#30363D] bg-[#0D1117] p-3 text-xs text-[#F0F6FC]"
                />
                <input
                  type="text"
                  placeholder="Constraints"
                  value={editingProblem.constraints || ''}
                  onChange={(e) => setEditingProblem({ ...editingProblem, constraints: e.target.value })}
                  className="rounded-lg border border-[#30363D] bg-[#0D1117] px-3 py-2 text-xs text-[#F0F6FC] sm:col-span-2"
                />
                <select
                  multiple
                  value={(editingProblem.topics || []).map((t) => (typeof t === 'string' ? t : t._id))}
                  onChange={(e) => {
                    const selected = Array.from(e.target.selectedOptions).map((o) => ({
                      _id: o.value,
                      title: o.text,
                      slug: '',
                    }));
                    setEditingProblem({ ...editingProblem, topics: selected });
                  }}
                  className="h-28 rounded-lg border border-[#30363D] bg-[#0D1117] p-2 text-xs text-[#F0F6FC] sm:col-span-2"
                >
                  {topics.map((t) => (
                    <option key={t._id} value={t._id}>
                      {t.title}
                    </option>
                  ))}
                </select>
                <textarea
                  rows={2}
                  placeholder="Python starter code"
                  value={editingProblem.starterCode?.python || ''}
                  onChange={(e) =>
                    setEditingProblem({
                      ...editingProblem,
                      starterCode: {
                        c: editingProblem.starterCode?.c || '',
                        cpp: editingProblem.starterCode?.cpp || '',
                        java: editingProblem.starterCode?.java || '',
                        python: e.target.value,
                      },
                    })
                  }
                  className="rounded-lg border border-[#30363D] bg-[#0D1117] p-3 font-mono text-xs text-[#F0F6FC]"
                />
                <textarea
                  rows={2}
                  placeholder="C++ starter code"
                  value={editingProblem.starterCode?.cpp || ''}
                  onChange={(e) =>
                    setEditingProblem({
                      ...editingProblem,
                      starterCode: {
                        c: editingProblem.starterCode?.c || '',
                        cpp: e.target.value,
                        java: editingProblem.starterCode?.java || '',
                        python: editingProblem.starterCode?.python || '',
                      },
                    })
                  }
                  className="rounded-lg border border-[#30363D] bg-[#0D1117] p-3 font-mono text-xs text-[#F0F6FC]"
                />
              </div>
            )}

            <div className="mt-5 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setEditingProblem(null)}
                className="rounded-lg border border-[#30363D] px-4 py-2 text-xs text-[#8B949E]"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={savingProblem}
                onClick={() => void handleSaveProblem()}
                className="rounded-lg bg-[#22C55E] px-4 py-2 text-xs font-semibold text-[#0D1117]"
              >
                {savingProblem ? 'Saving...' : 'Save Draft'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Test Cases Modal */}
      {tcProblem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4">
          <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-[#30363D] bg-[#161B22] p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[#30363D] pb-3">
              <div>
                <h3 className="text-base font-bold text-[#F0F6FC]">Test Cases — {tcProblem.title}</h3>
                <p className="text-xs text-[#8B949E]">
                  Hidden cases are never returned to student APIs.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setTcProblem(null)}
                aria-label="Close modal"
                className="rounded p-1 text-[#8B949E] hover:text-[#F0F6FC]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 gap-2 rounded-xl border border-[#30363D] bg-[#0D1117] p-3 sm:grid-cols-2">
              <textarea
                rows={2}
                placeholder="Input (stdin)"
                value={newTc.input}
                onChange={(e) => setNewTc({ ...newTc, input: e.target.value })}
                className="rounded border border-[#30363D] bg-[#161B22] p-2 font-mono text-xs text-[#F0F6FC]"
              />
              <textarea
                rows={2}
                placeholder="Expected output (stdout)"
                value={newTc.expectedOutput}
                onChange={(e) => setNewTc({ ...newTc, expectedOutput: e.target.value })}
                className="rounded border border-[#30363D] bg-[#161B22] p-2 font-mono text-xs text-[#F0F6FC]"
              />
              <label className="flex items-center gap-2 text-xs text-[#C9D1D9]">
                <input
                  type="checkbox"
                  checked={newTc.isSample}
                  onChange={(e) => setNewTc({ ...newTc, isSample: e.target.checked })}
                />
                Public Sample Test Case
              </label>
              <button
                type="button"
                onClick={() => void handleAddTestCase()}
                className="rounded-lg bg-[#22C55E] px-3 py-1.5 text-xs font-semibold text-[#0D1117]"
              >
                Add Test Case
              </button>
            </div>

            <div className="space-y-2">
              {testCases.map((tc, idx) => (
                <div
                  key={tc._id}
                  className="flex flex-col justify-between gap-2 rounded-lg border border-[#30363D] bg-[#0D1117] p-3 sm:flex-row sm:items-center"
                >
                  <div className="space-y-1 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-[#F0F6FC]">Case #{idx + 1}</span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[11px] ${
                          tc.isSample
                            ? 'bg-sky-500/15 text-sky-300'
                            : 'bg-purple-500/15 text-purple-300'
                        }`}
                      >
                        {tc.isSample ? 'Sample' : 'Hidden'}
                      </span>
                    </div>
                    <p className="font-mono text-[#8B949E]">
                      In: {JSON.stringify(tc.input)} → Out: {JSON.stringify(tc.expectedOutput)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => void handleToggleTcSample(tc)}
                      className="rounded border border-[#30363D] px-2.5 py-1 text-xs text-[#F0F6FC]"
                    >
                      Make {tc.isSample ? 'Hidden' : 'Sample'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteTcTarget(tc)}
                      className="rounded border border-[#30363D] p-1 text-rose-300"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Reference Solution Validation Modal */}
      {valProblem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4">
          <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-[#30363D] bg-[#161B22] p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[#30363D] pb-3">
              <h3 className="text-base font-bold text-[#F0F6FC]">
                Validate Reference Solution — {valProblem.title}
              </h3>
              <button
                type="button"
                onClick={() => setValProblem(null)}
                aria-label="Close modal"
                className="rounded p-1 text-[#8B949E] hover:text-[#F0F6FC]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex items-center gap-3">
              <select
                value={valLang}
                onChange={(e) => {
                  const l = e.target.value as 'c' | 'cpp' | 'java' | 'python';
                  setValLang(l);
                  setValCode(valProblem.referenceSolutions?.[l] || valProblem.starterCode?.[l] || '');
                }}
                className="rounded-lg border border-[#30363D] bg-[#0D1117] px-3 py-2 text-xs text-[#F0F6FC]"
              >
                <option value="python">Python</option>
                <option value="cpp">C++</option>
                <option value="java">Java</option>
                <option value="c">C</option>
              </select>
              <button
                type="button"
                disabled={validating}
                onClick={() => void handleRunValidation()}
                className="inline-flex items-center gap-1.5 rounded-lg bg-[#22C55E] px-4 py-2 text-xs font-semibold text-[#0D1117]"
              >
                <Play className="h-3.5 w-3.5" />
                {validating ? 'Running Judge0...' : 'Run & Validate All Cases'}
              </button>
            </div>

            <textarea
              rows={8}
              value={valCode}
              onChange={(e) => setValCode(e.target.value)}
              placeholder="Paste reference solution..."
              className="w-full rounded-xl border border-[#30363D] bg-[#0D1117] p-3 font-mono text-xs text-[#F0F6FC]"
            />

            {valResults && (
              <div className="space-y-2 rounded-xl border border-[#30363D] bg-[#0D1117] p-4">
                <p
                  className={`text-sm font-bold ${
                    valResults.allPassed ? 'text-[#22C55E]' : 'text-rose-400'
                  }`}
                >
                  Passed {valResults.passedCount} / {valResults.totalCases} test cases
                </p>
                {valResults.results.map((r) => (
                  <div key={r.index} className="rounded border border-[#30363D] p-2 text-xs">
                    <span className="font-semibold">
                      Case #{r.index} ({r.isSample ? 'Sample' : 'Hidden'}):{' '}
                    </span>
                    <span className={r.verdict === 'Accepted' ? 'text-[#22C55E]' : 'text-rose-400'}>
                      {r.verdict}
                    </span>{' '}
                    <span className="text-[#8B949E]">
                      ({r.runtimeMs} ms) — Expected: {JSON.stringify(r.expectedOutput)} | Actual:{' '}
                      {JSON.stringify(r.actualOutput)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      <ConfirmDialog
        isOpen={Boolean(archiveTarget)}
        title="Archive Coding Problem"
        description={`Archive "${archiveTarget?.title}"? Historical student submissions will be preserved.`}
        confirmText="Archive"
        onConfirm={() => void handleArchive()}
        onClose={() => setArchiveTarget(null)}
      />

      <ConfirmDialog
        isOpen={Boolean(deleteTcTarget)}
        title="Remove Test Case"
        description="Remove this test case? The problem will require revalidation before publishing."
        confirmText="Remove"
        onConfirm={() => void handleDeleteTestCase()}
        onClose={() => setDeleteTcTarget(null)}
      />
    </div>
  );
}
