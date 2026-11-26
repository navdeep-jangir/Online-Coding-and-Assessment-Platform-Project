import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  AlertCircle,
  Code2,
  Filter,
  LayoutGrid,
  List,
  RefreshCw,
  RotateCcw,
  Sparkles,
  Tag,
} from 'lucide-react';
import api, { ApiClientError, bookmarksApi } from '@/services/api';
import { SearchInput } from '@/components/common/SearchInput';
import { Pagination } from '@/components/common/Pagination';
import { EmptyState } from '@/components/common/EmptyState';
import { CardSkeleton, LoadingSkeleton } from '@/components/common/LoadingSkeleton';
import { ProblemCard, type PracticeProblemItem } from '@/components/practice/ProblemCard';
import { cn } from '@/utils/helpers';
import type { Difficulty, PaginationMeta, Topic } from '@/types';

type DifficultyFilter = 'All' | Difficulty;
type StatusFilter = 'all' | 'solved' | 'unsolved';
type ViewMode = 'row' | 'card';

interface TopicOption {
  value: string;
  label: string;
}

const DIFFICULTY_OPTIONS: DifficultyFilter[] = ['All', 'Easy', 'Medium', 'Hard'];
const STATUS_OPTIONS: Array<{ value: StatusFilter; label: string }> = [
  { value: 'all', label: 'All' },
  { value: 'solved', label: 'Solved' },
  { value: 'unsolved', label: 'Unsolved' },
];
const PAGE_LIMIT = 12;

function unwrapPayload<T>(raw: unknown): T {
  if (raw && typeof raw === 'object' && 'data' in raw && 'success' in raw) {
    return (raw as { data: T }).data;
  }
  return raw as T;
}

function normalizeProblemsResponse(
  raw: unknown,
  fallbackPage: number,
  fallbackLimit: number
): { items: PracticeProblemItem[]; pagination: PaginationMeta } {
  const payload = unwrapPayload<unknown>(raw);

  let items: PracticeProblemItem[] = [];
  let rawPagination: Partial<PaginationMeta> | undefined;

  if (Array.isArray(payload)) {
    items = payload as PracticeProblemItem[];
  } else if (payload && typeof payload === 'object') {
    const obj = payload as Record<string, unknown>;
    if (Array.isArray(obj.data)) {
      items = obj.data as PracticeProblemItem[];
    } else if (Array.isArray(obj.problems)) {
      items = obj.problems as PracticeProblemItem[];
    } else if (Array.isArray(obj.items)) {
      items = obj.items as PracticeProblemItem[];
    }

    if (obj.pagination && typeof obj.pagination === 'object') {
      rawPagination = obj.pagination as Partial<PaginationMeta>;
    } else if (
      typeof obj.total === 'number' ||
      typeof obj.page === 'number' ||
      typeof obj.totalPages === 'number'
    ) {
      rawPagination = {
        total: typeof obj.total === 'number' ? obj.total : items.length,
        page: typeof obj.page === 'number' ? obj.page : fallbackPage,
        limit: typeof obj.limit === 'number' ? obj.limit : fallbackLimit,
        totalPages: typeof obj.totalPages === 'number' ? obj.totalPages : undefined,
      };
    }
  }

  if (!rawPagination && raw && typeof raw === 'object' && 'pagination' in raw) {
    rawPagination = (raw as { pagination?: Partial<PaginationMeta> }).pagination;
  }

  const limit = rawPagination?.limit && rawPagination.limit > 0 ? rawPagination.limit : fallbackLimit;
  const total = typeof rawPagination?.total === 'number' ? rawPagination.total : items.length;
  const page = rawPagination?.page && rawPagination.page > 0 ? rawPagination.page : fallbackPage;
  const totalPages =
    rawPagination?.totalPages && rawPagination.totalPages > 0
      ? rawPagination.totalPages
      : Math.max(1, Math.ceil(total / limit));

  return {
    items,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNextPage: rawPagination?.hasNextPage ?? page < totalPages,
      hasPrevPage: rawPagination?.hasPrevPage ?? page > 1,
    },
  };
}

function normalizeRecommendedResponse(raw: unknown): PracticeProblemItem[] {
  const payload = unwrapPayload<unknown>(raw);

  const extractList = (list: unknown[]): PracticeProblemItem[] =>
    list
      .map((entry) => {
        if (!entry || typeof entry !== 'object') return null;
        const record = entry as Record<string, unknown>;
        if (record.problem && typeof record.problem === 'object') {
          return {
            ...(record.problem as PracticeProblemItem),
            recommendationReason:
              typeof record.reason === 'string'
                ? record.reason
                : typeof record.recommendationReason === 'string'
                  ? record.recommendationReason
                  : undefined,
          };
        }
        return entry as PracticeProblemItem;
      })
      .filter((item): item is PracticeProblemItem => Boolean(item && item._id && item.slug));

  if (Array.isArray(payload)) {
    return extractList(payload);
  }
  if (payload && typeof payload === 'object') {
    const obj = payload as Record<string, unknown>;
    if (Array.isArray(obj.problems)) return extractList(obj.problems);
    if (Array.isArray(obj.recommendations)) return extractList(obj.recommendations);
    if (Array.isArray(obj.data)) return extractList(obj.data);
  }
  return [];
}

function normalizeTopicOptions(rawTopics: unknown, rawTags: unknown, problems: PracticeProblemItem[]): TopicOption[] {
  const seen = new Map<string, TopicOption>();

  const addOption = (value: string, label?: string) => {
    const cleanValue = value.trim();
    const cleanLabel = (label ?? value).trim();
    if (!cleanValue) return;
    if (!seen.has(cleanValue.toLowerCase())) {
      seen.set(cleanValue.toLowerCase(), { value: cleanValue, label: cleanLabel });
    }
  };

  if (rawTopics) {
    const topicPayload = unwrapPayload<unknown>(rawTopics);
    const topicArray = Array.isArray(topicPayload)
      ? topicPayload
      : topicPayload && typeof topicPayload === 'object' && Array.isArray((topicPayload as { topics?: unknown }).topics)
        ? (topicPayload as { topics: unknown[] }).topics
        : [];

    for (const item of topicArray) {
      if (typeof item === 'string') {
        addOption(item);
      } else if (item && typeof item === 'object') {
        const topic = item as Partial<Topic>;
        if (topic.slug || topic.title) {
          addOption(topic.slug || topic.title || '', topic.title || topic.slug || '');
        }
      }
    }
  }

  if (rawTags) {
    const tagPayload = unwrapPayload<unknown>(rawTags);
    const tagArray = Array.isArray(tagPayload)
      ? tagPayload
      : tagPayload && typeof tagPayload === 'object' && Array.isArray((tagPayload as { tags?: unknown }).tags)
        ? (tagPayload as { tags: unknown[] }).tags
        : [];
    for (const tag of tagArray) {
      if (typeof tag === 'string') {
        addOption(tag);
      }
    }
  }

  for (const problem of problems) {
    if (Array.isArray(problem.topics)) {
      for (const topic of problem.topics) {
        if (typeof topic === 'string') {
          addOption(topic);
        } else if (topic && typeof topic === 'object' && topic.title) {
          addOption(topic.slug || topic.title, topic.title);
        }
      }
    }
    if (Array.isArray(problem.tags)) {
      for (const tag of problem.tags) {
        addOption(tag);
      }
    }
  }

  return Array.from(seen.values()).sort((a, b) => a.label.localeCompare(b.label));
}

function parseDifficultyParam(value: string | null): DifficultyFilter {
  if (value === 'Easy' || value === 'Medium' || value === 'Hard') {
    return value;
  }
  return 'All';
}

function parseStatusParam(value: string | null): StatusFilter {
  if (value === 'solved' || value === 'unsolved') {
    return value;
  }
  return 'all';
}

function parsePageParam(value: string | null): number {
  const parsed = value ? Number.parseInt(value, 10) : 1;
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
}

export function PracticePage() {
  const [searchParams, setSearchParams] = useSearchParams();

  const [search, setSearch] = useState<string>(() => searchParams.get('search') ?? '');
  const [difficulty, setDifficulty] = useState<DifficultyFilter>(() =>
    parseDifficultyParam(searchParams.get('difficulty'))
  );
  const [selectedTopic, setSelectedTopic] = useState<string>(() => searchParams.get('topic') ?? '');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>(() =>
    parseStatusParam(searchParams.get('status'))
  );
  const [page, setPage] = useState<number>(() => parsePageParam(searchParams.get('page')));
  const [viewMode, setViewMode] = useState<ViewMode>('row');

  const [problems, setProblems] = useState<PracticeProblemItem[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta>({
    page: 1,
    limit: PAGE_LIMIT,
    total: 0,
    totalPages: 1,
    hasNextPage: false,
    hasPrevPage: false,
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [recommended, setRecommended] = useState<PracticeProblemItem[]>([]);
  const [isRecommendedLoading, setIsRecommendedLoading] = useState<boolean>(true);

  const [rawTopics, setRawTopics] = useState<unknown>(null);
  const [rawTags, setRawTags] = useState<unknown>(null);
  const [bookmarkingIds, setBookmarkingIds] = useState<Record<string, boolean>>({});
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);

  // Sync filter state to URL query parameters
  useEffect(() => {
    const nextParams = new URLSearchParams();
    if (page > 1) nextParams.set('page', String(page));
    if (difficulty !== 'All') nextParams.set('difficulty', difficulty);
    if (selectedTopic) nextParams.set('topic', selectedTopic);
    if (search.trim()) nextParams.set('search', search.trim());
    if (statusFilter !== 'all') nextParams.set('status', statusFilter);

    setSearchParams(nextParams, { replace: true });
  }, [difficulty, page, search, selectedTopic, setSearchParams, statusFilter]);

  // Fetch recommended problems & available topics/tags on mount
  useEffect(() => {
    let isCancelled = false;

    const loadMetaAndRecommendations = async () => {
      setIsRecommendedLoading(true);

      const [recResult, topicsResult, tagsResult] = await Promise.allSettled([
        api.get('/problems/recommended'),
        api.get('/topics'),
        api.get('/problems/tags'),
      ]);

      if (isCancelled) return;

      if (recResult.status === 'fulfilled') {
        setRecommended(normalizeRecommendedResponse(recResult.value.data));
      } else {
        setRecommended([]);
      }
      setIsRecommendedLoading(false);

      if (topicsResult.status === 'fulfilled') {
        setRawTopics(topicsResult.value.data);
      }
      if (tagsResult.status === 'fulfilled') {
        setRawTags(tagsResult.value.data);
      }
    };

    void loadMetaAndRecommendations();

    return () => {
      isCancelled = true;
    };
  }, []);

  const fetchProblems = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    const params: Record<string, string | number> = {
      page,
      limit: PAGE_LIMIT,
    };

    if (difficulty !== 'All') params.difficulty = difficulty;
    if (selectedTopic) params.topic = selectedTopic;
    if (search.trim()) params.search = search.trim();
    if (statusFilter !== 'all') params.status = statusFilter;

    try {
      const response = await api.get('/problems', { params });
      const normalized = normalizeProblemsResponse(response.data, page, PAGE_LIMIT);
      setProblems(normalized.items);
      setPagination(normalized.pagination);
    } catch (err) {
      const message =
        err instanceof ApiClientError
          ? err.message
          : 'Failed to load problems. Please try again.';
      setError(message);
      setProblems([]);
    } finally {
      setIsLoading(false);
    }
  }, [difficulty, page, search, selectedTopic, statusFilter]);

  useEffect(() => {
    void fetchProblems();
  }, [fetchProblems]);

  const topicOptions = useMemo(
    () => normalizeTopicOptions(rawTopics, rawTags, [...problems, ...recommended]),
    [problems, rawTags, rawTopics, recommended]
  );

  const hasActiveFilters =
    difficulty !== 'All' ||
    Boolean(selectedTopic) ||
    Boolean(search.trim()) ||
    statusFilter !== 'all';

  const handleResetFilters = () => {
    setSearch('');
    setDifficulty('All');
    setSelectedTopic('');
    setStatusFilter('all');
    setPage(1);
  };

  const handleSearchChange = useCallback((nextSearch: string) => {
    setSearch((prev) => {
      if (prev !== nextSearch) {
        setPage(1);
      }
      return nextSearch;
    });
  }, []);

  const handleDifficultyChange = (nextDifficulty: DifficultyFilter) => {
    setDifficulty(nextDifficulty);
    setPage(1);
  };

  const handleTopicChange = (nextTopic: string) => {
    setSelectedTopic(nextTopic);
    setPage(1);
  };

  const handleStatusChange = (nextStatus: StatusFilter) => {
    setStatusFilter(nextStatus);
    setPage(1);
  };

  const handleTagClick = (tag: string) => {
    const matchedOption = topicOptions.find(
      (opt) => opt.value.toLowerCase() === tag.toLowerCase() || opt.label.toLowerCase() === tag.toLowerCase()
    );
    handleTopicChange(matchedOption ? matchedOption.value : tag);
  };

  const handleToggleBookmark = async (targetProblem: PracticeProblemItem) => {
    const problemId = targetProblem._id;
    if (!problemId || bookmarkingIds[problemId]) return;

    const currentBookmarked = Boolean(targetProblem.isBookmarked ?? targetProblem.bookmarked);
    const nextBookmarked = !currentBookmarked;

    const updateList = (list: PracticeProblemItem[]) =>
      list.map((item) =>
        item._id === problemId
          ? { ...item, isBookmarked: nextBookmarked, bookmarked: nextBookmarked }
          : item
      );

    // Optimistic update across both main list and recommendations
    setProblems((prev) => updateList(prev));
    setRecommended((prev) => updateList(prev));
    setBookmarkingIds((prev) => ({ ...prev, [problemId]: true }));
    setActionFeedback(null);

    try {
      const response = await bookmarksApi.toggleBookmark({
        itemType: 'problem',
        itemId: problemId,
      });
      const confirmed = response.data?.bookmarked ?? nextBookmarked;
      setProblems((prev) =>
        prev.map((item) =>
          item._id === problemId ? { ...item, isBookmarked: confirmed, bookmarked: confirmed } : item
        )
      );
      setRecommended((prev) =>
        prev.map((item) =>
          item._id === problemId ? { ...item, isBookmarked: confirmed, bookmarked: confirmed } : item
        )
      );
    } catch (err) {
      // Rollback optimistic update on failure
      setProblems((prev) =>
        prev.map((item) =>
          item._id === problemId
            ? { ...item, isBookmarked: currentBookmarked, bookmarked: currentBookmarked }
            : item
        )
      );
      setRecommended((prev) =>
        prev.map((item) =>
          item._id === problemId
            ? { ...item, isBookmarked: currentBookmarked, bookmarked: currentBookmarked }
            : item
        )
      );
      setActionFeedback(
        err instanceof ApiClientError
          ? err.message
          : 'Could not update bookmark. Please make sure you are signed in.'
      );
    } finally {
      setBookmarkingIds((prev) => {
        const next = { ...prev };
        delete next[problemId];
        return next;
      });
    }
  };

  return (
    <div className="dark min-h-screen bg-[#0D1117] text-[#F0F6FC]">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {/* Page Header */}
        <motion.header
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"
        >
          <div>
            <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-[#22C55E]/30 bg-[#22C55E]/10 px-3 py-1 text-xs font-semibold text-[#22C55E]">
              <Code2 className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Practice Arena</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-[#F0F6FC] sm:text-3xl">
              Sharpen Your Problem Solving
            </h1>
            <p className="mt-1 text-sm text-[#8B949E]">
              Filter curated DSA challenges by difficulty, topic, or completion status and code in our interactive editor.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <div className="inline-flex rounded-lg border border-[#30363D] bg-[#161B22] p-0.5">
              <button
                type="button"
                onClick={() => setViewMode('row')}
                aria-label="List view"
                aria-pressed={viewMode === 'row'}
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition',
                  viewMode === 'row'
                    ? 'bg-[#1C2128] text-[#22C55E] shadow-sm'
                    : 'text-[#8B949E] hover:text-[#F0F6FC]'
                )}
              >
                <List className="h-3.5 w-3.5" aria-hidden="true" />
                <span>List</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('card')}
                aria-label="Grid view"
                aria-pressed={viewMode === 'card'}
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition',
                  viewMode === 'card'
                    ? 'bg-[#1C2128] text-[#22C55E] shadow-sm'
                    : 'text-[#8B949E] hover:text-[#F0F6FC]'
                )}
              >
                <LayoutGrid className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Cards</span>
              </button>
            </div>
          </div>
        </motion.header>

        {/* Recommended Problems Section */}
        {(isRecommendedLoading || recommended.length > 0) && (
          <section className="mb-8" aria-labelledby="recommended-problems-heading">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-[#22C55E]" aria-hidden="true" />
                <h2
                  id="recommended-problems-heading"
                  className="text-base font-semibold text-[#F0F6FC]"
                >
                  Recommended Problems
                </h2>
              </div>
              <span className="text-xs text-[#8B949E]">Tailored for your next step</span>
            </div>

            {isRecommendedLoading ? (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                <CardSkeleton className="border-[#30363D] bg-[#1C2128]" />
                <CardSkeleton className="border-[#30363D] bg-[#1C2128]" />
                <CardSkeleton className="hidden border-[#30363D] bg-[#1C2128] lg:block" />
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                {recommended.slice(0, 3).map((recProblem, idx) => (
                  <ProblemCard
                    key={recProblem._id || recProblem.slug}
                    problem={recProblem}
                    index={idx}
                    variant="card"
                    isBookmarking={Boolean(bookmarkingIds[recProblem._id])}
                    onToggleBookmark={handleToggleBookmark}
                    onTagClick={handleTagClick}
                    recommendationReason={recProblem.recommendationReason ?? 'Recommended'}
                  />
                ))}
              </div>
            )}
          </section>
        )}

        {/* Filter & Search Bar */}
        <section
          aria-label="Problem filters"
          className="mb-6 rounded-2xl border border-[#30363D] bg-[#1C2128] p-4 shadow-sm"
        >
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-12 lg:items-center">
            {/* Debounced Search */}
            <div className="lg:col-span-4">
              <SearchInput
                value={search}
                onChange={handleSearchChange}
                placeholder="Search problems by title or tag..."
                debounceMs={350}
                isLoading={isLoading && Boolean(search.trim())}
                ariaLabel="Search problems"
                className="w-full"
              />
            </div>

            {/* Difficulty Filter */}
            <div className="lg:col-span-3">
              <div
                role="group"
                aria-label="Filter by difficulty"
                className="flex items-center rounded-lg border border-[#30363D] bg-[#0D1117] p-1"
              >
                {DIFFICULTY_OPTIONS.map((opt) => {
                  const active = difficulty === opt;
                  const activeColorClass =
                    opt === 'Easy'
                      ? 'bg-[#22C55E]/15 text-[#22C55E] border-[#22C55E]/40'
                      : opt === 'Medium'
                        ? 'bg-amber-500/15 text-amber-400 border-amber-500/40'
                        : opt === 'Hard'
                          ? 'bg-red-500/15 text-red-400 border-red-500/40'
                          : 'bg-[#1C2128] text-[#F0F6FC] border-[#30363D]';

                  return (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => handleDifficultyChange(opt)}
                      aria-pressed={active}
                      className={cn(
                        'flex-1 rounded-md border border-transparent px-2 py-1.5 text-xs font-medium transition',
                        active ? activeColorClass : 'text-[#8B949E] hover:text-[#F0F6FC]'
                      )}
                    >
                      {opt}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Topic / Tag Filter Dropdown */}
            <div className="lg:col-span-3">
              <div className="relative flex items-center">
                <Tag
                  className="pointer-events-none absolute left-3 h-4 w-4 text-[#8B949E]"
                  aria-hidden="true"
                />
                <select
                  value={selectedTopic}
                  onChange={(e) => handleTopicChange(e.target.value)}
                  aria-label="Filter by topic or tag"
                  className="h-10 w-full appearance-none rounded-lg border border-[#30363D] bg-[#0D1117] pl-9 pr-8 text-sm text-[#F0F6FC] transition focus:border-[#22C55E] focus:outline-none focus:ring-2 focus:ring-[#22C55E]/20"
                >
                  <option value="">All Topics & Tags</option>
                  {topicOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <Filter
                  className="pointer-events-none absolute right-3 h-3.5 w-3.5 text-[#8B949E]"
                  aria-hidden="true"
                />
              </div>
            </div>

            {/* Status Filter */}
            <div className="lg:col-span-2">
              <div
                role="group"
                aria-label="Filter by completion status"
                className="flex items-center rounded-lg border border-[#30363D] bg-[#0D1117] p-1"
              >
                {STATUS_OPTIONS.map((opt) => {
                  const active = statusFilter === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => handleStatusChange(opt.value)}
                      aria-pressed={active}
                      className={cn(
                        'flex-1 rounded-md px-2 py-1.5 text-xs font-medium transition',
                        active
                          ? 'bg-[#22C55E]/15 text-[#22C55E]'
                          : 'text-[#8B949E] hover:text-[#F0F6FC]'
                      )}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Active Filters Summary */}
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-[#30363D]/70 pt-3 text-xs text-[#8B949E]">
            <span>
              {isLoading
                ? 'Loading problems...'
                : `${pagination.total} ${pagination.total === 1 ? 'problem' : 'problems'} found`}
            </span>

            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="inline-flex items-center gap-1.5 font-medium text-[#22C55E] transition hover:text-[#22C55E]/80"
              >
                <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Clear all filters</span>
              </button>
            )}
          </div>
        </section>

        {/* Action Feedback Banner (e.g. bookmark auth error) */}
        {actionFeedback && (
          <div
            role="status"
            className="mb-4 flex items-center justify-between rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-2.5 text-xs text-amber-300"
          >
            <span>{actionFeedback}</span>
            <button
              type="button"
              onClick={() => setActionFeedback(null)}
              className="ml-4 font-semibold underline hover:no-underline"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Problem List */}
        {isLoading ? (
          viewMode === 'card' ? (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, idx) => (
                <CardSkeleton key={idx} className="border-[#30363D] bg-[#1C2128]" />
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-[#30363D] bg-[#1C2128] p-4">
              <LoadingSkeleton variant="table-row" count={8} />
            </div>
          )
        ) : error ? (
          <EmptyState
            icon={AlertCircle}
            title="Unable to load problems"
            description={error}
            action={{
              label: 'Retry',
              onClick: () => void fetchProblems(),
              icon: RefreshCw,
            }}
          />
        ) : problems.length === 0 ? (
          <EmptyState
            icon={Code2}
            title="No matching problems found"
            description={
              hasActiveFilters
                ? 'Try adjusting your search query, difficulty, topic, or status filter.'
                : 'No problems are available in the practice arena right now.'
            }
            action={
              hasActiveFilters
                ? {
                    label: 'Reset Filters',
                    onClick: handleResetFilters,
                    icon: RotateCcw,
                  }
                : undefined
            }
          />
        ) : (
          <>
            {viewMode === 'card' ? (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                {problems.map((problem, index) => (
                  <ProblemCard
                    key={problem._id || problem.slug}
                    problem={problem}
                    index={index}
                    variant="card"
                    isBookmarking={Boolean(bookmarkingIds[problem._id])}
                    onToggleBookmark={handleToggleBookmark}
                    onTagClick={handleTagClick}
                  />
                ))}
              </div>
            ) : (
              <div className="space-y-2.5">
                {problems.map((problem, index) => (
                  <ProblemCard
                    key={problem._id || problem.slug}
                    problem={problem}
                    index={index}
                    variant="row"
                    isBookmarking={Boolean(bookmarkingIds[problem._id])}
                    onToggleBookmark={handleToggleBookmark}
                    onTagClick={handleTagClick}
                  />
                ))}
              </div>
            )}

            <div className="mt-6">
              <Pagination
                currentPage={pagination.page}
                totalPages={pagination.totalPages}
                totalItems={pagination.total}
                pageSize={pagination.limit}
                onPageChange={(nextPage) => {
                  setPage(nextPage);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default PracticePage;
