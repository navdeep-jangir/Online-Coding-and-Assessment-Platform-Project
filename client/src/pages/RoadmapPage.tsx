import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowRight, ChevronsDownUp, ChevronsUpDown, Layers, Map as MapIcon, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';
import api, { bookmarksApi } from '@/services/api';
import { ModuleCard } from '@/components/roadmap/ModuleCard';
import { isTopicCompleted } from '@/components/roadmap/topicHelpers';
import { SearchInput } from '@/components/common/SearchInput';
import { LoadingSkeleton } from '@/components/common/LoadingSkeleton';
import { EmptyState } from '@/components/common/EmptyState';
import type { Module, Topic } from '@/types';

type StageKey = 'all' | 'beginner' | 'intermediate' | 'advanced' | 'master';
type DifficultyFilter = 'all' | 'Easy' | 'Medium' | 'Hard';
type StatusFilter = 'all' | 'completed' | 'pending' | 'bookmarked';

const STAGE_OPTIONS: { key: StageKey; label: string; range: [number, number] }[] = [
  { key: 'all', label: 'All 24 Modules', range: [1, 24] },
  { key: 'beginner', label: 'Beginner (1–6)', range: [1, 6] },
  { key: 'intermediate', label: 'Intermediate (7–12)', range: [7, 12] },
  { key: 'advanced', label: 'Advanced (13–21)', range: [13, 21] },
  { key: 'master', label: 'Master DSA (22–24)', range: [22, 24] },
];

export default function RoadmapPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialStage = (searchParams.get('stage') as StageKey) || 'all';
  const validStage: StageKey = STAGE_OPTIONS.some((s) => s.key === initialStage)
    ? initialStage
    : 'all';

  const [modules, setModules] = useState<Module[]>([]);
  const [topicsByModule, setTopicsByModule] = useState<Record<string, Topic[]>>({});
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [stage, setStage] = useState<StageKey>(validStage);
  const [search, setSearch] = useState('');
  const [difficulty, setDifficulty] = useState<DifficultyFilter>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

  const [pendingTopicIds, setPendingTopicIds] = useState<Set<string>>(new Set());
  const [togglingBookmarkIds, setTogglingBookmarkIds] = useState<Set<string>>(new Set());
  const [addingRevisionIds, setAddingRevisionIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    const paramStage = (searchParams.get('stage') as StageKey) || 'all';
    if (STAGE_OPTIONS.some((s) => s.key === paramStage)) {
      setStage(paramStage);
    }
  }, [searchParams]);

  const loadModuleTopics = useCallback(async (moduleId: string) => {
    try {
      const res = await api.get(`/modules/${encodeURIComponent(moduleId)}`);
      const modData = res.data?.data;
      const topicsList: Topic[] = Array.isArray(modData?.topics) ? modData.topics : [];
      setTopicsByModule((prev) => ({ ...prev, [moduleId]: topicsList }));
    } catch {
      toast.error('Failed to load module topics', { id: 'roadmap-load' });
    }
  }, []);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);

    api
      .get('/modules')
      .then(async (res) => {
        if (!active) return;
        const list: Module[] = Array.isArray(res.data?.data) ? res.data.data : [];
        setModules(list);

        // Auto-expand the first module of the active stage
        const activeRange =
          STAGE_OPTIONS.find((s) => s.key === validStage)?.range ?? [1, 24];
        const firstInStage = list.find(
          (m) => m.order >= activeRange[0] && m.order <= activeRange[1]
        );
        if (firstInStage?._id) {
          setExpandedIds(new Set([firstInStage._id]));
          await loadModuleTopics(firstInStage._id);
        }
      })
      .catch((err) => {
        if (!active) return;
        setError(err?.message || 'Unable to load DSA roadmap.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [loadModuleTopics, validStage]);

  const handleStageChange = async (nextStage: StageKey) => {
    setStage(nextStage);
    if (nextStage === 'all') {
      searchParams.delete('stage');
    } else {
      searchParams.set('stage', nextStage);
    }
    setSearchParams(searchParams, { replace: true });

    const range = STAGE_OPTIONS.find((s) => s.key === nextStage)?.range ?? [1, 24];
    const firstInStage = modules.find((m) => m.order >= range[0] && m.order <= range[1]);
    if (firstInStage?._id) {
      setExpandedIds(new Set([firstInStage._id]));
      if (!topicsByModule[firstInStage._id]) {
        await loadModuleTopics(firstInStage._id);
      }
    }
  };

  const handleToggleModule = async (moduleId: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(moduleId)) {
        next.delete(moduleId);
      } else {
        next.add(moduleId);
      }
      return next;
    });

    if (!topicsByModule[moduleId]) {
      await loadModuleTopics(moduleId);
    }
  };

  const visibleModules = useMemo(() => {
    const range = STAGE_OPTIONS.find((s) => s.key === stage)?.range ?? [1, 24];
    const q = search.trim().toLowerCase();

    return modules.filter((mod) => {
      if (mod.order < range[0] || mod.order > range[1]) return false;
      if (difficulty !== 'all' && (mod.difficulty || '').toLowerCase() !== difficulty.toLowerCase()) {
        // Keep module if any loaded topic matches difficulty
        const loaded = topicsByModule[mod._id];
        if (!loaded || !loaded.some((t) => t.difficulty?.toLowerCase() === difficulty.toLowerCase())) {
          return false;
        }
      }
      if (q) {
        const modMatches = mod.title.toLowerCase().includes(q);
        const loaded = topicsByModule[mod._id] || [];
        const topicMatches = loaded.some((t) => t.title.toLowerCase().includes(q));
        if (!modMatches && !topicMatches) return false;
      }
      return true;
    });
  }, [modules, stage, difficulty, search, topicsByModule]);

  const filterTopics = (topics: Topic[]): Topic[] => {
    const q = search.trim().toLowerCase();
    return topics.filter((t) => {
      if (q && !t.title.toLowerCase().includes(q)) return false;
      if (difficulty !== 'all' && t.difficulty?.toLowerCase() !== difficulty.toLowerCase()) {
        return false;
      }
      if (statusFilter === 'completed' && !isTopicCompleted(t)) return false;
      if (statusFilter === 'pending' && isTopicCompleted(t)) return false;
      if (statusFilter === 'bookmarked' && !t.isBookmarked) return false;
      return true;
    });
  };

  const handleExpandAll = async () => {
    const ids = visibleModules.map((m) => m._id);
    setExpandedIds(new Set(ids));
    await Promise.all(
      ids.filter((id) => !topicsByModule[id]).map((id) => loadModuleTopics(id))
    );
  };

  const handleCollapseAll = () => {
    setExpandedIds(new Set());
  };

  const handleToggleComplete = async (topic: Topic) => {
    const modId = typeof topic.module === 'string' ? topic.module : topic.module?._id;
    setPendingTopicIds((prev) => new Set(prev).add(topic._id));
    try {
      const nextCompleted = !isTopicCompleted(topic);
      await api.put(`/topics/${topic._id}/progress`, { completed: nextCompleted });
      if (modId) {
        await loadModuleTopics(modId);
      }
      setModules((prev) =>
        prev.map((m) =>
          m._id === modId
            ? {
                ...m,
                completedTopicCount: Math.max(
                  0,
                  (m.completedTopicCount ?? (m as unknown as { completedTopics?: number }).completedTopics ?? 0) +
                    (nextCompleted ? 1 : -1)
                ),
              }
            : m
        )
      );
      toast.success(nextCompleted ? 'Topic marked as completed!' : 'Topic marked as pending', {
        id: 'topic-progress',
      });
    } catch {
      toast.error('Unable to update progress', { id: 'topic-progress' });
    } finally {
      setPendingTopicIds((prev) => {
        const next = new Set(prev);
        next.delete(topic._id);
        return next;
      });
    }
  };

  const handleToggleBookmark = async (topic: Topic) => {
    const modId = typeof topic.module === 'string' ? topic.module : topic.module?._id;
    setTogglingBookmarkIds((prev) => new Set(prev).add(topic._id));
    try {
      await bookmarksApi.toggleBookmark({
        itemType: 'topic',
        itemId: topic._id,
        targetType: 'topic',
        targetId: topic._id,
      });
      if (modId) {
        setTopicsByModule((prev) => ({
          ...prev,
          [modId]: (prev[modId] || []).map((t) =>
            t._id === topic._id ? { ...t, isBookmarked: !t.isBookmarked } : t
          ),
        }));
      }
      toast.success(topic.isBookmarked ? 'Bookmark removed' : 'Bookmarked topic', {
        id: 'topic-bookmark',
      });
    } catch {
      toast.error('Failed to update bookmark', { id: 'topic-bookmark' });
    } finally {
      setTogglingBookmarkIds((prev) => {
        const next = new Set(prev);
        next.delete(topic._id);
        return next;
      });
    }
  };

  const handleAddToRevision = async (topic: Topic) => {
    setAddingRevisionIds((prev) => new Set(prev).add(topic._id));
    try {
      await api.post('/revisions', { topicId: topic._id, reason: 'manual' });
      toast.success('Added to revision queue', { id: 'topic-revision' });
    } catch {
      toast.error('Revision requires a linked practice problem', { id: 'topic-revision' });
    } finally {
      setAddingRevisionIds((prev) => {
        const next = new Set(prev);
        next.delete(topic._id);
        return next;
      });
    }
  };

  const handleToggleExternal = async (topic: Topic, platform: 'codechef' | 'leetcode') => {
    const modId = typeof topic.module === 'string' ? topic.module : topic.module?._id;
    const currentVal = Boolean(topic.selfReportedExternal?.[platform]);
    const nextVal = !currentVal;
    try {
      await api.put(`/topics/${topic._id}/progress`, {
        selfReportedExternal: { [platform]: nextVal },
      });
      if (modId) {
        setTopicsByModule((prev) => ({
          ...prev,
          [modId]: (prev[modId] || []).map((t) =>
            t._id === topic._id
              ? {
                  ...t,
                  selfReportedExternal: {
                    ...t.selfReportedExternal,
                    [platform]: nextVal,
                  },
                }
              : t
          ),
        }));
      }
      toast.success(
        `${platform === 'codechef' ? 'CodeChef' : 'LeetCode'} marked as ${nextVal ? 'solved (self-reported)' : 'pending'}`,
        { id: 'topic-ext' }
      );
    } catch {
      toast.error('Failed to update external progress', { id: 'topic-ext' });
    }
  };

  const continueTopicSlug = useMemo(() => {
    for (const mod of modules) {
      const loaded = topicsByModule[mod._id];
      if (loaded) {
        const nextIncomplete = loaded.find((t) => !isTopicCompleted(t));
        if (nextIncomplete?.slug) return nextIncomplete.slug;
      }
    }
    return null;
  }, [modules, topicsByModule]);

  const totalConcepts = modules.reduce((acc, m) => acc + (m.topicCount ?? m.totalConcepts ?? 0), 0);
  const completedConcepts = modules.reduce(
    (acc, m) =>
      acc + (m.completedTopicCount ?? (m as unknown as { completedTopics?: number }).completedTopics ?? 0),
    0
  );
  const overallPct = totalConcepts > 0 ? Math.round((completedConcepts / totalConcepts) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Header & Overall Progress */}
      <div className="flex flex-col gap-4 rounded-2xl border border-[#30363D] bg-[#161B22] p-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#22C55E]">
            <MapIcon className="h-4 w-4" />
            24-Module DSA Curriculum
          </div>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-[#F0F6FC] sm:text-3xl">
            DSA Roadmap
          </h1>
          <p className="mt-1 text-sm text-[#8B949E]">
            {completedConcepts} of {totalConcepts} concepts completed ({overallPct}%)
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:items-end">
          {continueTopicSlug && (
            <Link
              to={`/notes/${encodeURIComponent(continueTopicSlug)}`}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#22C55E] px-4 py-2 text-xs font-semibold text-[#0D1117] transition hover:bg-[#16A34A]"
            >
              <Sparkles className="h-3.5 w-3.5" />
              Continue Learning
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          )}
          <div className="w-full sm:w-64">
            <div className="mb-1.5 flex justify-between text-xs text-[#8B949E]">
              <span>Overall Progress</span>
              <span className="font-semibold text-[#22C55E]">{overallPct}%</span>
            </div>
            <div className="h-2.5 w-full overflow-hidden rounded-full bg-[#0D1117]">
              <div
                className="h-full rounded-full bg-[#22C55E] transition-all duration-300"
                style={{ width: `${overallPct}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Stage Filter Pills */}
      <div className="flex flex-wrap gap-2" role="tablist" aria-label="Learning stages">
        {STAGE_OPTIONS.map((opt) => (
          <button
            key={opt.key}
            type="button"
            onClick={() => handleStageChange(opt.key)}
            className={`rounded-xl border px-3.5 py-2 text-xs font-semibold transition ${
              stage === opt.key
                ? 'border-[#22C55E] bg-[#22C55E]/15 text-[#22C55E]'
                : 'border-[#30363D] bg-[#1C2128] text-[#8B949E] hover:border-[#38BDF8]/50 hover:text-[#F0F6FC]'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Search, Filters & Expand/Collapse Controls */}
      <div className="flex flex-col gap-3 rounded-xl border border-[#30363D] bg-[#161B22] p-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-1 flex-wrap items-center gap-3">
          <div className="w-full sm:w-64">
            <SearchInput value={search} onChange={setSearch} placeholder="Search modules or topics..." />
          </div>

          <select
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value as DifficultyFilter)}
            aria-label="Filter by difficulty"
            className="rounded-lg border border-[#30363D] bg-[#0D1117] px-3 py-2 text-xs font-medium text-[#F0F6FC] focus:border-[#22C55E] focus:outline-none"
          >
            <option value="all">All Difficulties</option>
            <option value="Easy">Easy</option>
            <option value="Medium">Medium</option>
            <option value="Hard">Hard</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
            aria-label="Filter by status"
            className="rounded-lg border border-[#30363D] bg-[#0D1117] px-3 py-2 text-xs font-medium text-[#F0F6FC] focus:border-[#22C55E] focus:outline-none"
          >
            <option value="all">All Status</option>
            <option value="completed">Completed</option>
            <option value="pending">Pending</option>
            <option value="bookmarked">Bookmarked</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleExpandAll}
            className="inline-flex items-center gap-1.5 rounded-lg border border-[#30363D] bg-[#1C2128] px-3 py-2 text-xs font-medium text-[#F0F6FC] transition hover:border-[#22C55E]/50"
          >
            <ChevronsUpDown className="h-3.5 w-3.5 text-[#22C55E]" />
            Expand All
          </button>
          <button
            type="button"
            onClick={handleCollapseAll}
            className="inline-flex items-center gap-1.5 rounded-lg border border-[#30363D] bg-[#1C2128] px-3 py-2 text-xs font-medium text-[#8B949E] transition hover:text-[#F0F6FC]"
          >
            <ChevronsDownUp className="h-3.5 w-3.5" />
            Collapse All
          </button>
        </div>
      </div>

      {/* Modules List */}
      {loading ? (
        <LoadingSkeleton variant="card" count={4} />
      ) : error ? (
        <div className="rounded-xl border border-red-500/30 bg-[#1C2128] p-8 text-center text-sm text-red-400">
          {error}
        </div>
      ) : visibleModules.length === 0 ? (
        <EmptyState
          icon={Layers}
          title="No matching modules or topics"
          description="Try clearing your search or switching stage/difficulty filters."
        />
      ) : (
        <div className="space-y-4">
          {visibleModules.map((mod, idx) => (
            <ModuleCard
              key={mod._id}
              module={mod}
              index={idx}
              isExpanded={expandedIds.has(mod._id)}
              onToggle={handleToggleModule}
              topics={filterTopics(topicsByModule[mod._id] || [])}
              pendingTopicIds={pendingTopicIds}
              togglingBookmarkIds={togglingBookmarkIds}
              addingRevisionIds={addingRevisionIds}
              onToggleComplete={handleToggleComplete}
              onToggleBookmark={handleToggleBookmark}
              onAddToRevision={handleAddToRevision}
              onToggleExternal={handleToggleExternal}
            />
          ))}
        </div>
      )}
    </div>
  );
}
