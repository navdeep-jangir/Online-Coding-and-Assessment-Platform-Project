import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  AlertTriangle,
  Calendar,
  CheckCircle2,
  Clock,
  Flag,
  Play,
  RefreshCw,
  RotateCcw,
  Search,
  Trash2,
} from 'lucide-react';
import api from '@/services/api';
import { DifficultyBadge } from '@/components/common/DifficultyBadge';
import { EmptyState } from '@/components/common/EmptyState';
import { LoadingSkeleton } from '@/components/common/LoadingSkeleton';
import { formatDate, formatRelativeTime } from '@/utils/helpers';

type RevisionTab = 'due_today' | 'upcoming' | 'incorrect' | 'difficult' | 'completed' | 'all';

interface RevisionTopicRef {
  _id: string;
  title: string;
  slug: string;
}

interface RevisionProblemRef {
  _id: string;
  title: string;
  slug: string;
  difficulty: 'Easy' | 'Medium' | 'Hard' | string;
  topics?: RevisionTopicRef[];
  tags?: string[];
}

interface RevisionEntry {
  _id: string;
  problem: RevisionProblemRef;
  incorrectAttempts: number;
  lastAttemptDate?: string | null;
  lastSuccessfulRevision?: string | null;
  revisionReason?: string;
  revisionStatus: 'pending' | 'due' | 'completed';
  nextRevisionDate?: string | null;
  isManual?: boolean;
  markedDifficult?: boolean;
  isDue?: boolean;
  isDueToday?: boolean;
  isOverdue?: boolean;
  isUpcoming?: boolean;
  isIncorrect?: boolean;
  isDifficult?: boolean;
  overdueDays?: number;
  intervalDays?: number;
}

interface RevisionSummary {
  total: number;
  dueToday: number;
  upcoming: number;
  incorrect: number;
  difficult: number;
  completed: number;
  pending: number;
  overdue: number;
}

const REASON_LABELS: Record<string, string> = {
  wrong_answer: 'Wrong Answer',
  compilation_error: 'Compilation Error',
  runtime_error: 'Runtime Error',
  time_limit_exceeded: 'Time Limit Exceeded',
  memory_limit_exceeded: 'Memory Limit Exceeded',
  difficult: 'Marked Difficult',
  manual: 'Added Manually',
  incorrect: 'Incorrect Attempt',
};

const TABS: Array<{ id: RevisionTab; label: string }> = [
  { id: 'due_today', label: 'Due Today' },
  { id: 'upcoming', label: 'Upcoming' },
  { id: 'incorrect', label: 'Incorrect Questions' },
  { id: 'difficult', label: 'Difficult Questions' },
  { id: 'completed', label: 'Completed Revisions' },
  { id: 'all', label: 'All' },
];

export default function RevisionPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<RevisionTab>('due_today');
  const [difficultyFilter, setDifficultyFilter] = useState<string>('all');
  const [topicFilter, setTopicFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [items, setItems] = useState<RevisionEntry[]>([]);
  const [summary, setSummary] = useState<RevisionSummary>({
    total: 0,
    dueToday: 0,
    upcoming: 0,
    incorrect: 0,
    difficult: 0,
    completed: 0,
    pending: 0,
    overdue: 0,
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const fetchRevisions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: Record<string, string> = { filter: activeTab, limit: '100' };
      if (difficultyFilter !== 'all') params.difficulty = difficultyFilter;
      if (topicFilter !== 'all') params.topic = topicFilter;
      if (searchQuery.trim()) params.search = searchQuery.trim();

      const res = await api.get<{
        success: boolean;
        summary?: RevisionSummary;
        data?: RevisionEntry[];
      }>('/revisions', { params });

      const payload = res.data;
      setItems(Array.isArray(payload?.data) ? payload.data : []);
      if (payload?.summary) {
        setSummary(payload.summary);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load revision queue.');
    } finally {
      setLoading(false);
    }
  }, [activeTab, difficultyFilter, topicFilter, searchQuery]);

  useEffect(() => {
    void fetchRevisions();
  }, [fetchRevisions]);

  const availableTopics = useMemo(() => {
    const map = new Map<string, string>();
    for (const item of items) {
      for (const t of item.problem?.topics || []) {
        if (t?.slug && t?.title) {
          map.set(t.slug, t.title);
        }
      }
    }
    return Array.from(map.entries()).map(([slug, title]) => ({ slug, title }));
  }, [items]);

  const handleMarkComplete = async (id: string) => {
    setBusyId(id);
    try {
      await api.put(`/revisions/${encodeURIComponent(id)}/complete`);
      toast.success('Marked as revised!');
      await fetchRevisions();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to mark as revised.');
    } finally {
      setBusyId(null);
    }
  };

  const handleReschedule = async (id: string, days?: number) => {
    setBusyId(id);
    try {
      await api.put(`/revisions/${encodeURIComponent(id)}/reschedule`, days !== undefined ? { days } : {});
      toast.success(days ? `Rescheduled for +${days} day${days > 1 ? 's' : ''}.` : 'Rescheduled to next interval.');
      await fetchRevisions();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to reschedule.');
    } finally {
      setBusyId(null);
    }
  };

  const handleRemove = async (id: string) => {
    setBusyId(id);
    try {
      await api.delete(`/revisions/${encodeURIComponent(id)}`);
      toast.success('Removed from Revision Mode.');
      await fetchRevisions();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to remove revision entry.');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#0D1117] px-4 py-8 text-[#F0F6FC] sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-medium text-amber-300">
              <RotateCcw className="h-3.5 w-3.5" />
              Spaced Repetition (1d • 3d • 7d • 14d)
            </div>
            <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
              Smart Revision Mode
            </h1>
            <p className="mt-1 text-sm text-[#8B949E]">
              Prioritized with a Min-Heap queue so overdue, incorrect, and difficult problems surface first.
            </p>
          </div>
          <button
            type="button"
            onClick={() => void fetchRevisions()}
            className="inline-flex items-center gap-2 self-start rounded-lg border border-[#30363D] bg-[#161B22] px-3.5 py-2 text-xs font-medium text-[#F0F6FC] transition hover:border-[#22C55E]/50"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Refresh Queue
          </button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {[
            { label: 'Due Today', value: summary.dueToday, tab: 'due_today' as RevisionTab, accent: 'text-amber-400' },
            { label: 'Upcoming', value: summary.upcoming, tab: 'upcoming' as RevisionTab, accent: 'text-sky-400' },
            { label: 'Incorrect', value: summary.incorrect, tab: 'incorrect' as RevisionTab, accent: 'text-rose-400' },
            { label: 'Difficult', value: summary.difficult, tab: 'difficult' as RevisionTab, accent: 'text-purple-400' },
            { label: 'Completed', value: summary.completed, tab: 'completed' as RevisionTab, accent: 'text-[#22C55E]' },
          ].map((card) => (
            <button
              key={card.tab}
              type="button"
              onClick={() => setActiveTab(card.tab)}
              className={`rounded-xl border p-4 text-left transition ${
                activeTab === card.tab
                  ? 'border-[#22C55E]/60 bg-[#161B22]'
                  : 'border-[#30363D] bg-[#161B22]/70 hover:border-[#8B949E]/40'
              }`}
            >
              <p className="text-xs text-[#8B949E]">{card.label}</p>
              <p className={`mt-1 text-2xl font-bold ${card.accent}`}>{card.value}</p>
            </button>
          ))}
        </div>

        {/* Filter Tabs & Controls */}
        <div className="space-y-4 rounded-xl border border-[#30363D] bg-[#161B22] p-4">
          <div className="flex flex-wrap gap-2">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                  activeTab === tab.id
                    ? 'bg-[#22C55E] text-[#0D1117]'
                    : 'border border-[#30363D] bg-[#0D1117] text-[#8B949E] hover:text-[#F0F6FC]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-[#8B949E]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search problem or topic..."
                className="w-full rounded-lg border border-[#30363D] bg-[#0D1117] py-2 pl-9 pr-3 text-sm text-[#F0F6FC] placeholder-[#8B949E] focus:border-[#22C55E] focus:outline-none"
              />
            </div>

            <select
              value={difficultyFilter}
              onChange={(e) => setDifficultyFilter(e.target.value)}
              aria-label="Filter by difficulty"
              className="rounded-lg border border-[#30363D] bg-[#0D1117] px-3 py-2 text-sm text-[#F0F6FC] focus:border-[#22C55E] focus:outline-none"
            >
              <option value="all">All Difficulties</option>
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>

            <select
              value={topicFilter}
              onChange={(e) => setTopicFilter(e.target.value)}
              aria-label="Filter by topic"
              className="rounded-lg border border-[#30363D] bg-[#0D1117] px-3 py-2 text-sm text-[#F0F6FC] focus:border-[#22C55E] focus:outline-none"
            >
              <option value="all">All Topics</option>
              {availableTopics.map((t) => (
                <option key={t.slug} value={t.slug}>
                  {t.title}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <LoadingSkeleton count={4} />
        ) : error ? (
          <div className="rounded-xl border border-rose-500/40 bg-rose-500/10 p-6 text-center">
            <p className="text-sm font-medium text-rose-300">{error}</p>
            <button
              type="button"
              onClick={() => void fetchRevisions()}
              className="mt-3 rounded-lg bg-rose-500/20 px-4 py-2 text-xs font-semibold text-rose-200 hover:bg-rose-500/30"
            >
              Retry
            </button>
          </div>
        ) : items.length === 0 ? (
          <EmptyState
            title="No revision items in this view"
            description="Problems with Wrong Answer, Compilation Error, Runtime Error, or marked as Difficult appear here automatically."
            action={{
              label: 'Explore Practice Arena',
              onClick: () => navigate('/practice'),
            }}
          />
        ) : (
          <div className="space-y-3">
            {items.map((item) => {
              const isBusy = busyId === item._id;
              const reasonText =
                REASON_LABELS[item.revisionReason || 'wrong_answer'] || 'Needs Review';

              return (
                <div
                  key={item._id}
                  className="flex flex-col justify-between gap-4 rounded-xl border border-[#30363D] bg-[#161B22] p-5 transition hover:border-[#8B949E]/40 lg:flex-row lg:items-center"
                >
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <Link
                        to={`/practice/${item.problem.slug}`}
                        className="text-base font-semibold text-[#F0F6FC] hover:text-[#22C55E]"
                      >
                        {item.problem.title}
                      </Link>
                      <DifficultyBadge difficulty={item.problem.difficulty} size="sm" />
                      <span className="inline-flex items-center gap-1 rounded-full border border-[#30363D] bg-[#0D1117] px-2.5 py-0.5 text-xs text-[#8B949E]">
                        {item.markedDifficult ? (
                          <Flag className="h-3 w-3 text-purple-400" />
                        ) : (
                          <AlertTriangle className="h-3 w-3 text-amber-400" />
                        )}
                        {reasonText}
                      </span>
                      {item.revisionStatus === 'completed' ? (
                        <span className="inline-flex items-center gap-1 rounded-full border border-[#22C55E]/30 bg-[#22C55E]/10 px-2.5 py-0.5 text-xs font-medium text-[#22C55E]">
                          <CheckCircle2 className="h-3 w-3" />
                          Revised
                        </span>
                      ) : item.isOverdue ? (
                        <span className="rounded-full border border-rose-500/30 bg-rose-500/10 px-2.5 py-0.5 text-xs font-medium text-rose-300">
                          Overdue
                        </span>
                      ) : null}
                    </div>

                    {Array.isArray(item.problem.topics) && item.problem.topics.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {item.problem.topics.map((t) => (
                          <Link
                            key={t._id}
                            to={`/notes/${t.slug}`}
                            className="rounded-md bg-[#0D1117] px-2 py-0.5 text-xs text-[#38BDF8] hover:underline"
                          >
                            {t.title}
                          </Link>
                        ))}
                      </div>
                    )}

                    <div className="flex flex-wrap items-center gap-4 text-xs text-[#8B949E]">
                      <span>
                        Incorrect attempts:{' '}
                        <strong className="text-[#F0F6FC]">{item.incorrectAttempts}</strong>
                      </span>
                      {item.lastAttemptDate && (
                        <span className="inline-flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          Last attempt: {formatRelativeTime(item.lastAttemptDate)}
                        </span>
                      )}
                      {item.lastSuccessfulRevision && (
                        <span className="inline-flex items-center gap-1 text-[#22C55E]">
                          <CheckCircle2 className="h-3 w-3" />
                          Last revised: {formatDate(item.lastSuccessfulRevision)}
                        </span>
                      )}
                      {item.nextRevisionDate && item.revisionStatus !== 'completed' && (
                        <span className="inline-flex items-center gap-1 text-amber-300">
                          <Calendar className="h-3 w-3" />
                          Next review: {formatDate(item.nextRevisionDate)}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <Link
                      to={`/practice/${item.problem.slug}`}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-[#22C55E] px-3.5 py-2 text-xs font-semibold text-[#0D1117] transition hover:bg-[#22C55E]/90"
                    >
                      <Play className="h-3.5 w-3.5" />
                      Start Revision
                    </Link>

                    {item.revisionStatus !== 'completed' && (
                      <button
                        type="button"
                        disabled={isBusy}
                        onClick={() => void handleMarkComplete(item._id)}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-[#22C55E]/40 bg-[#22C55E]/10 px-3 py-2 text-xs font-semibold text-[#22C55E] transition hover:bg-[#22C55E]/20 disabled:opacity-50"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Mark as Revised
                      </button>
                    )}

                    <button
                      type="button"
                      disabled={isBusy}
                      onClick={() => void handleReschedule(item._id, 3)}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-[#30363D] bg-[#0D1117] px-3 py-2 text-xs font-medium text-[#F0F6FC] transition hover:border-sky-400/50 disabled:opacity-50"
                    >
                      <Calendar className="h-3.5 w-3.5 text-sky-400" />
                      Reschedule (+3d)
                    </button>

                    <button
                      type="button"
                      disabled={isBusy}
                      onClick={() => void handleRemove(item._id)}
                      title="Remove from Revision Mode"
                      className="inline-flex items-center gap-1 rounded-lg border border-[#30363D] bg-[#0D1117] px-2.5 py-2 text-xs font-medium text-[#8B949E] transition hover:border-rose-500/40 hover:text-rose-300 disabled:opacity-50"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      <span className="hidden sm:inline">Remove</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
