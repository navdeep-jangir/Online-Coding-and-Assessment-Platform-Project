import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Archive,
  ArchiveRestore,
  Code2,
  Edit3,
  Plus,
  RefreshCw,
} from 'lucide-react';
import toast from 'react-hot-toast';
import ConfirmDialog from '@/components/common/ConfirmDialog';
import DifficultyBadge from '@/components/common/DifficultyBadge';
import EmptyState from '@/components/common/EmptyState';
import { TableSkeleton } from '@/components/common/LoadingSkeleton';
import Pagination from '@/components/common/Pagination';
import SearchInput from '@/components/common/SearchInput';
import ProblemForm from '@/pages/admin/ProblemForm';
import { adminApi, ApiClientError, curriculumApi } from '@/services/api';
import type { Difficulty, PaginationMeta, Problem, Topic } from '@/types';
import { cn, formatNumber } from '@/utils/helpers';

type PublishedFilter = 'all' | 'published' | 'archived';

function resolveProblemTopicLabels(problem: Problem, topicMap: Map<string, Topic>): string[] {
  const labels: string[] = [];

  if (Array.isArray(problem.topics) && problem.topics.length > 0) {
    for (const item of problem.topics) {
      if (typeof item === 'string') {
        labels.push(topicMap.get(item)?.title ?? item);
      } else if (item && item.title) {
        labels.push(item.title);
      }
    }
  } else if (problem.topic) {
    if (typeof problem.topic === 'string') {
      labels.push(topicMap.get(problem.topic)?.title ?? problem.topic);
    } else if (problem.topic.title) {
      labels.push(problem.topic.title);
    }
  } else if (problem.topicId) {
    labels.push(topicMap.get(problem.topicId)?.title ?? problem.topicId);
  }

  return labels;
}

export default function ManageProblems() {
  const [problems, setProblems] = useState<Problem[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta>({
    page: 1,
    limit: 15,
    total: 0,
    totalPages: 1,
    hasNextPage: false,
    hasPrevPage: false,
  });

  const [search, setSearch] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState<Difficulty | ''>('');
  const [topicFilter, setTopicFilter] = useState('');
  const [publishedFilter, setPublishedFilter] = useState<PublishedFilter>('all');
  const [page, setPage] = useState(1);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form view state (supports Add & Edit pre-filled)
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProblem, setEditingProblem] = useState<Problem | null>(null);

  // Archive dialog state
  const [archiveTarget, setArchiveTarget] = useState<Problem | null>(null);
  const [isArchiving, setIsArchiving] = useState(false);

  const topicMap = useMemo(() => {
    const map = new Map<string, Topic>();
    for (const topic of topics) {
      map.set(topic._id, topic);
    }
    return map;
  }, [topics]);

  const loadTopics = useCallback(async () => {
    try {
      const response = await curriculumApi.getTopics();
      setTopics(response.data ?? []);
    } catch {
      // Non-fatal
    }
  }, []);

  const loadProblems = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await adminApi.getProblems({
        page,
        limit: 15,
        search: search || undefined,
        difficulty: difficultyFilter || undefined,
        topic: topicFilter || undefined,
        isPublished:
          publishedFilter === 'all'
            ? undefined
            : publishedFilter === 'published'
              ? true
              : false,
      });

      const payload = response.data;
      setProblems(payload.data ?? []);
      if (payload.pagination) {
        setPagination(payload.pagination);
      }
    } catch (err) {
      const message =
        err instanceof ApiClientError ? err.message : 'Failed to load problems.';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [page, search, difficultyFilter, topicFilter, publishedFilter]);

  useEffect(() => {
    void loadTopics();
  }, [loadTopics]);

  useEffect(() => {
    void loadProblems();
  }, [loadProblems]);

  const handleOpenAdd = () => {
    setEditingProblem(null);
    setIsFormOpen(true);
  };

  const handleOpenEdit = async (problem: Problem) => {
    setEditingProblem(problem);
    setIsFormOpen(true);
    try {
      const fullRes = await adminApi.getProblemById(problem._id);
      if (fullRes.data) {
        setEditingProblem(fullRes.data);
      }
    } catch {
      // Keep row problem data as fallback
    }
  };

  const handleConfirmArchive = async () => {
    if (!archiveTarget) return;
    setIsArchiving(true);
    const nextPublished = !archiveTarget.isPublished;

    try {
      try {
        await adminApi.archiveProblem(archiveTarget._id, nextPublished);
      } catch (err) {
        if (err instanceof ApiClientError && (err.statusCode === 404 || err.statusCode === 405)) {
          await adminApi.updateProblem(archiveTarget._id, { isPublished: nextPublished });
        } else {
          throw err;
        }
      }

      toast.success(
        nextPublished
          ? `"${archiveTarget.title}" has been published.`
          : `"${archiveTarget.title}" has been archived.`
      );
      setArchiveTarget(null);
      void loadProblems();
    } catch (err) {
      const message =
        err instanceof ApiClientError ? err.message : 'Failed to update problem status.';
      toast.error(message);
    } finally {
      setIsArchiving(false);
    }
  };

  if (isFormOpen) {
    return (
      <ProblemForm
        problem={editingProblem}
        problemId={editingProblem?._id}
        onSuccess={() => {
          setIsFormOpen(false);
          setEditingProblem(null);
          void loadProblems();
        }}
        onCancel={() => {
          setIsFormOpen(false);
          setEditingProblem(null);
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header & Filters */}
      <div className="rounded-2xl border border-[#30363D] bg-[#1C2128] p-5 space-y-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-[#F0F6FC]">Manage Problems</h2>
            <p className="mt-0.5 text-sm text-[#8B949E]">
              Create, edit, publish, and archive coding challenges with validated test suites.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => void loadProblems()}
              className="inline-flex items-center gap-1.5 rounded-xl border border-[#30363D] bg-[#0D1117] px-3 py-2 text-xs font-medium text-[#C9D1D9] transition hover:text-[#F0F6FC]"
            >
              <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
              Refresh
            </button>
            <button
              type="button"
              onClick={handleOpenAdd}
              className="inline-flex items-center gap-2 rounded-xl bg-[#22C55E] px-4 py-2 text-sm font-semibold text-[#0D1117] transition hover:bg-[#22C55E]/90"
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
              Add Problem
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-12">
          <div className="md:col-span-5">
            <SearchInput
              value={search}
              onChange={(val) => {
                setSearch(val);
                setPage(1);
              }}
              placeholder="Search by title, slug, or tag..."
            />
          </div>

          <div className="md:col-span-2">
            <select
              value={difficultyFilter}
              onChange={(e) => {
                setDifficultyFilter(e.target.value as Difficulty | '');
                setPage(1);
              }}
              aria-label="Filter by difficulty"
              className="h-10 w-full rounded-lg border border-[#30363D] bg-[#161B22] px-3 text-sm text-[#F0F6FC] focus:border-[#22C55E] focus:outline-none"
            >
              <option value="">All Difficulties</option>
              <option value="Easy">Easy</option>
              <option value="Medium">Medium</option>
              <option value="Hard">Hard</option>
            </select>
          </div>

          <div className="md:col-span-3">
            <select
              value={topicFilter}
              onChange={(e) => {
                setTopicFilter(e.target.value);
                setPage(1);
              }}
              aria-label="Filter by topic"
              className="h-10 w-full rounded-lg border border-[#30363D] bg-[#161B22] px-3 text-sm text-[#F0F6FC] focus:border-[#22C55E] focus:outline-none"
            >
              <option value="">All Topics</option>
              {topics.map((topic) => (
                <option key={topic._id} value={topic._id}>
                  {topic.title}
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-2">
            <select
              value={publishedFilter}
              onChange={(e) => {
                setPublishedFilter(e.target.value as PublishedFilter);
                setPage(1);
              }}
              aria-label="Filter by published status"
              className="h-10 w-full rounded-lg border border-[#30363D] bg-[#161B22] px-3 text-sm text-[#F0F6FC] focus:border-[#22C55E] focus:outline-none"
            >
              <option value="all">All Status</option>
              <option value="published">Published</option>
              <option value="archived">Archived</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-[#30363D] bg-[#1C2128] overflow-hidden">
        {isLoading ? (
          <div className="p-5">
            <TableSkeleton rows={7} />
          </div>
        ) : error ? (
          <div className="p-8 text-center">
            <p className="text-sm text-red-400">{error}</p>
            <button
              type="button"
              onClick={() => void loadProblems()}
              className="mt-3 rounded-lg bg-[#22C55E] px-4 py-2 text-xs font-semibold text-[#0D1117]"
            >
              Retry
            </button>
          </div>
        ) : problems.length === 0 ? (
          <div className="p-6">
            <EmptyState
              icon={Code2}
              title="No problems found"
              description="Adjust your filters or add a new problem to the CodeClimb problem bank."
              action={{
                label: 'Add Problem',
                onClick: handleOpenAdd,
                icon: Plus,
              }}
            />
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[780px] text-left text-sm">
                <thead>
                  <tr className="border-b border-[#30363D] bg-[#161B22] text-xs uppercase tracking-wider text-[#8B949E]">
                    <th className="px-5 py-3.5 font-medium">Title</th>
                    <th className="px-5 py-3.5 font-medium">Difficulty</th>
                    <th className="px-5 py-3.5 font-medium">Topic</th>
                    <th className="px-5 py-3.5 font-medium">Published</th>
                    <th className="px-5 py-3.5 font-medium">Submissions</th>
                    <th className="px-5 py-3.5 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#30363D]/70">
                  {problems.map((problem) => {
                    const topicLabels = resolveProblemTopicLabels(problem, topicMap);
                    const submissionsCount =
                      problem.totalSubmissions ?? problem.submissionCount ?? 0;

                    return (
                      <tr
                        key={problem._id}
                        className="transition hover:bg-[#0D1117]/60"
                      >
                        <td className="px-5 py-3.5">
                          <div className="font-medium text-[#F0F6FC]">
                            {problem.title}
                          </div>
                          <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-xs text-[#8B949E]">
                            <span className="font-mono">{problem.slug}</span>
                            {problem.tags?.slice(0, 2).map((tag) => (
                              <span
                                key={tag}
                                className="rounded bg-[#0D1117] px-1.5 py-0.5 text-[10px] text-[#8B949E] border border-[#30363D]"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        </td>

                        <td className="px-5 py-3.5">
                          <DifficultyBadge difficulty={problem.difficulty} size="sm" />
                        </td>

                        <td className="px-5 py-3.5">
                          {topicLabels.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {topicLabels.slice(0, 2).map((label) => (
                                <span
                                  key={label}
                                  className="rounded-md border border-[#30363D] bg-[#0D1117] px-2 py-0.5 text-xs text-[#C9D1D9]"
                                >
                                  {label}
                                </span>
                              ))}
                              {topicLabels.length > 2 && (
                                <span className="text-xs text-[#8B949E]">
                                  +{topicLabels.length - 2}
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-xs text-[#8B949E]">Unassigned</span>
                          )}
                        </td>

                        <td className="px-5 py-3.5">
                          <span
                            className={cn(
                              'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium',
                              problem.isPublished
                                ? 'border-[#22C55E]/30 bg-[#22C55E]/10 text-[#22C55E]'
                                : 'border-amber-500/30 bg-amber-500/10 text-amber-400'
                            )}
                          >
                            <span
                              className={cn(
                                'h-1.5 w-1.5 rounded-full',
                                problem.isPublished ? 'bg-[#22C55E]' : 'bg-amber-400'
                              )}
                            />
                            {problem.isPublished ? 'Published' : 'Archived'}
                          </span>
                        </td>

                        <td className="px-5 py-3.5">
                          <div className="text-sm font-medium text-[#F0F6FC]">
                            {formatNumber(submissionsCount)}
                          </div>
                          {problem.acceptanceRate !== undefined && (
                            <div className="text-[11px] text-[#8B949E]">
                              {problem.acceptanceRate.toFixed(1)}% AC
                            </div>
                          )}
                        </td>

                        <td className="px-5 py-3.5 text-right">
                          <div className="inline-flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => void handleOpenEdit(problem)}
                              className="inline-flex items-center gap-1 rounded-lg border border-[#30363D] bg-[#0D1117] px-2.5 py-1.5 text-xs font-medium text-[#F0F6FC] transition hover:border-[#22C55E]/50 hover:text-[#22C55E]"
                            >
                              <Edit3 className="h-3.5 w-3.5" aria-hidden="true" />
                              Edit
                            </button>

                            <button
                              type="button"
                              onClick={() => setArchiveTarget(problem)}
                              className={cn(
                                'inline-flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition',
                                problem.isPublished
                                  ? 'border-[#30363D] bg-[#0D1117] text-[#8B949E] hover:border-amber-500/40 hover:text-amber-400'
                                  : 'border-[#30363D] bg-[#0D1117] text-[#8B949E] hover:border-[#22C55E]/40 hover:text-[#22C55E]'
                              )}
                            >
                              {problem.isPublished ? (
                                <>
                                  <Archive className="h-3.5 w-3.5" aria-hidden="true" />
                                  Archive
                                </>
                              ) : (
                                <>
                                  <ArchiveRestore className="h-3.5 w-3.5" aria-hidden="true" />
                                  Publish
                                </>
                              )}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {pagination.totalPages > 1 && (
              <div className="border-t border-[#30363D] px-5 py-3.5">
                <Pagination
                  currentPage={pagination.page}
                  totalPages={pagination.totalPages}
                  totalItems={pagination.total}
                  pageSize={pagination.limit}
                  onPageChange={setPage}
                />
              </div>
            )}
          </>
        )}
      </div>

      {/* Archive / Restore Confirmation Dialog */}
      <ConfirmDialog
        isOpen={Boolean(archiveTarget)}
        onClose={() => setArchiveTarget(null)}
        onConfirm={handleConfirmArchive}
        isLoading={isArchiving}
        variant={archiveTarget?.isPublished ? 'warning' : 'info'}
        title={
          archiveTarget?.isPublished ? 'Archive Problem?' : 'Publish Problem?'
        }
        description={
          archiveTarget?.isPublished
            ? `"${archiveTarget.title}" will be hidden from students in Practice and Roadmaps while preserving existing submission history.`
            : `"${archiveTarget?.title}" will become visible and solvable for all learners.`
        }
        confirmText={archiveTarget?.isPublished ? 'Archive Problem' : 'Publish Problem'}
      />
    </div>
  );
}
