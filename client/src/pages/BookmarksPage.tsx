import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  AlertCircle,
  ArrowRight,
  Bookmark,
  BookOpen,
  Code2,
  ExternalLink,
  FileText,
  RefreshCw,
  Search,
  Trash2,
  X,
} from 'lucide-react';
import api from '../services/api';

type BookmarkFilterTab = 'all' | 'problem' | 'topic' | 'note';

interface BookmarkItem {
  id: string;
  targetId: string;
  type: 'problem' | 'topic' | 'note';
  title: string;
  slug: string;
  difficulty: string;
  subtitle: string;
  createdAt: string;
  url?: string;
}

type UnknownRecord = Record<string, unknown>;

const TABS: Array<{ id: BookmarkFilterTab; label: string }> = [
  { id: 'all', label: 'All' },
  { id: 'problem', label: 'Problems' },
  { id: 'topic', label: 'Topics' },
  { id: 'note', label: 'Notes' },
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

function normalizeBookmarkType(rawType: string): 'problem' | 'topic' | 'note' {
  const lower = rawType.toLowerCase();
  if (lower.includes('topic') || lower.includes('module')) return 'topic';
  if (lower.includes('note') || lower.includes('article')) return 'note';
  return 'problem';
}

function parseBookmarksResponse(response: unknown): BookmarkItem[] {
  const root = asRecord(response);
  const axiosBody =
    root && 'data' in root && ('status' in root || 'headers' in root || 'config' in root)
      ? root.data
      : root;

  const bodyObj = asRecord(axiosBody);
  const dataObj =
    bodyObj && 'success' in bodyObj && asRecord(bodyObj.data)
      ? asRecord(bodyObj.data)!
      : bodyObj ?? {};

  const rawList = Array.isArray(axiosBody)
    ? axiosBody
    : Array.isArray(bodyObj?.data)
      ? bodyObj.data
      : dataObj.bookmarks ?? dataObj.items ?? dataObj.data ?? [];

  if (!Array.isArray(rawList)) return [];

  return rawList
    .map((item) => asRecord(item))
    .filter((item): item is UnknownRecord => item !== null)
    .map((item, idx) => {
      const typeStr = asString(
        item.type ?? item.itemType ?? item.resourceType,
        item.topic ? 'topic' : item.note ? 'note' : 'problem'
      );
      const type = normalizeBookmarkType(typeStr);
      const nested =
        asRecord(item.item) ??
        asRecord(item.problem) ??
        asRecord(item.topic) ??
        asRecord(item.note) ??
        asRecord(item.resource);

      const id = asString(
        item._id ?? item.id ?? item.itemId ?? item.targetId ?? idx
      );
      const targetId = asString(
        nested?._id ?? nested?.id ?? item.itemId ?? item.targetId ?? id
      );
      const slug = asString(nested?.slug ?? item.slug ?? targetId);

      const title = asString(
        nested?.title ??
          nested?.name ??
          item.title ??
          item.name ??
          item.itemTitle,
        'Saved Item'
      );

      const difficulty = asString(
        nested?.difficulty ?? nested?.level ?? item.difficulty,
        ''
      );

      const subtitle = asString(
        nested?.moduleName ??
          asRecord(nested?.module)?.title ??
          nested?.category ??
          item.module ??
          item.topicName ??
          '',
        ''
      );

      return {
        id,
        targetId,
        type,
        title,
        slug,
        difficulty,
        subtitle,
        createdAt: asString(item.createdAt ?? item.savedAt),
        url: asString(item.url ?? nested?.url) || undefined,
      };
    });
}

function resolveBookmarkLink(item: BookmarkItem): string {
  if (item.url) return item.url;
  const identifier = item.slug || item.targetId || item.id;
  switch (item.type) {
    case 'topic':
      return `/topics/${identifier}`;
    case 'note':
      return `/notes/${identifier}`;
    default:
      return `/problems/${identifier}`;
  }
}

function getTypeBadge(type: BookmarkItem['type']) {
  switch (type) {
    case 'topic':
      return {
        label: 'Topic',
        classes: 'border-[#38BDF8]/30 bg-[#38BDF8]/15 text-[#38BDF8]',
        Icon: BookOpen,
      };
    case 'note':
      return {
        label: 'Note',
        classes: 'border-purple-500/30 bg-purple-500/15 text-purple-400',
        Icon: FileText,
      };
    default:
      return {
        label: 'Problem',
        classes: 'border-[#22C55E]/30 bg-[#22C55E]/15 text-[#22C55E]',
        Icon: Code2,
      };
  }
}

function getDifficultyBadgeStyle(difficulty: string): string {
  const lower = difficulty.toLowerCase();
  if (lower === 'easy' || lower === 'beginner') {
    return 'border-[#22C55E]/30 bg-[#22C55E]/15 text-[#22C55E]';
  }
  if (lower === 'medium' || lower === 'intermediate') {
    return 'border-amber-500/30 bg-amber-500/15 text-amber-400';
  }
  if (lower === 'hard' || lower === 'advanced') {
    return 'border-red-500/30 bg-red-500/15 text-red-400';
  }
  return 'border-[#30363D] bg-[#0D1117] text-[#8B949E]';
}

function formatSavedDate(dateStr: string): string {
  if (!dateStr) return '';
  const parsed = new Date(dateStr);
  if (Number.isNaN(parsed.getTime())) return '';
  return parsed.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function BookmarksSkeleton() {
  return (
    <div className="space-y-3 animate-pulse" aria-busy="true" aria-label="Loading bookmarks">
      {Array.from({ length: 5 }).map((_, idx) => (
        <div
          key={idx}
          className="flex items-center justify-between rounded-xl border border-[#30363D] bg-[#1C2128] p-4"
        >
          <div className="space-y-2">
            <div className="h-5 w-56 rounded bg-[#30363D]" />
            <div className="h-3.5 w-32 rounded bg-[#30363D]" />
          </div>
          <div className="flex items-center gap-2">
            <div className="h-8 w-20 rounded-lg bg-[#30363D]" />
            <div className="h-8 w-8 rounded-lg bg-[#30363D]" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function BookmarksPage() {
  const [bookmarks, setBookmarks] = useState<BookmarkItem[]>([]);
  const [activeTab, setActiveTab] = useState<BookmarkFilterTab>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const fetchBookmarks = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get('/bookmarks');
      setBookmarks(parseBookmarksResponse(response));
    } catch (err: unknown) {
      const errObj = asRecord(err);
      const errResp = asRecord(errObj?.response);
      const errData = asRecord(errResp?.data);
      setError(
        asString(
          errData?.message ?? errObj?.message,
          'Unable to load your bookmarks.'
        )
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchBookmarks();
  }, [fetchBookmarks]);

  const tabCounts = useMemo(() => {
    const counts: Record<BookmarkFilterTab, number> = {
      all: bookmarks.length,
      problem: 0,
      topic: 0,
      note: 0,
    };
    for (const item of bookmarks) {
      counts[item.type] += 1;
    }
    return counts;
  }, [bookmarks]);

  const filteredBookmarks = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return bookmarks.filter((item) => {
      if (activeTab !== 'all' && item.type !== activeTab) {
        return false;
      }
      if (!q) return true;
      return (
        item.title.toLowerCase().includes(q) ||
        item.subtitle.toLowerCase().includes(q) ||
        item.difficulty.toLowerCase().includes(q) ||
        item.type.toLowerCase().includes(q)
      );
    });
  }, [bookmarks, activeTab, searchQuery]);

  const handleRemoveBookmark = async (bookmark: BookmarkItem) => {
    setRemovingId(bookmark.id);
    setActionError(null);
    try {
      await api.delete(`/bookmarks/${encodeURIComponent(bookmark.id)}`);
      setBookmarks((prev) => prev.filter((item) => item.id !== bookmark.id));
    } catch (err: unknown) {
      const errObj = asRecord(err);
      const errResp = asRecord(errObj?.response);
      const errData = asRecord(errResp?.data);
      setActionError(
        asString(
          errData?.message ?? errObj?.message,
          `Failed to remove "${bookmark.title}" from bookmarks.`
        )
      );
    } finally {
      setRemovingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#0D1117] px-4 py-6 text-[#F0F6FC] sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="flex items-center gap-2.5 text-2xl font-bold tracking-tight text-[#F0F6FC] sm:text-3xl">
              <Bookmark className="h-7 w-7 text-[#22C55E]" />
              Bookmarks
            </h1>
            <p className="mt-1 text-sm text-[#8B949E]">
              Quick access to your saved problems, DSA topics, and study notes.
            </p>
          </div>

          {/* Search input */}
          <div className="relative w-full sm:w-72">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8B949E]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search bookmarks..."
              aria-label="Search within bookmarks"
              className="w-full rounded-lg border border-[#30363D] bg-[#1C2128] py-2 pl-9 pr-8 text-sm text-[#F0F6FC] placeholder-[#8B949E] transition focus:border-[#22C55E] focus:outline-none"
            />
            {searchQuery ? (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                aria-label="Clear bookmark search"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#8B949E] hover:text-[#F0F6FC]"
              >
                <X className="h-4 w-4" />
              </button>
            ) : null}
          </div>
        </div>

        {/* Tab Filter */}
        <div
          className="flex flex-wrap gap-2"
          role="tablist"
          aria-label="Filter bookmarks by type"
        >
          {TABS.map((tab) => {
            const active = tab.id === activeTab;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setActiveTab(tab.id)}
                className={`inline-flex items-center gap-2 rounded-lg border px-3.5 py-2 text-sm font-medium transition ${
                  active
                    ? 'border-[#22C55E] bg-[#22C55E] text-[#0D1117]'
                    : 'border-[#30363D] bg-[#1C2128] text-[#8B949E] hover:border-[#8B949E]/40 hover:text-[#F0F6FC]'
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`rounded-full px-2 py-0.5 font-mono text-xs ${
                    active
                      ? 'bg-[#0D1117]/20 text-[#0D1117]'
                      : 'bg-[#0D1117] text-[#8B949E]'
                  }`}
                >
                  {tabCounts[tab.id]}
                </span>
              </button>
            );
          })}
        </div>

        {actionError ? (
          <div className="flex items-center justify-between rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            <span>{actionError}</span>
            <button
              type="button"
              onClick={() => setActionError(null)}
              aria-label="Dismiss error"
              className="text-red-300 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : null}

        {/* Content */}
        {loading ? (
          <BookmarksSkeleton />
        ) : error ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-red-500/30 bg-[#1C2128] px-6 py-14 text-center">
            <AlertCircle className="mb-3 h-10 w-10 text-red-400" />
            <h2 className="text-lg font-semibold text-[#F0F6FC]">
              Failed to load bookmarks
            </h2>
            <p className="mt-1 max-w-md text-sm text-[#8B949E]">{error}</p>
            <button
              type="button"
              onClick={() => void fetchBookmarks()}
              className="mt-5 inline-flex items-center gap-2 rounded-lg bg-[#22C55E] px-4 py-2 text-sm font-semibold text-[#0D1117] transition hover:bg-[#22C55E]/90"
            >
              <RefreshCw className="h-4 w-4" />
              Retry
            </button>
          </div>
        ) : bookmarks.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-[#30363D] bg-[#1C2128] px-6 py-16 text-center">
            <Bookmark className="mb-3 h-11 w-11 text-[#8B949E]/60" />
            <h2 className="text-lg font-semibold text-[#F0F6FC]">
              No bookmarks yet
            </h2>
            <p className="mt-1 max-w-md text-sm text-[#8B949E]">
              Save problems, topics, or notes while you study to revisit them quickly here.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Link
                to="/roadmap"
                className="inline-flex items-center gap-2 rounded-lg border border-[#30363D] bg-[#0D1117] px-4 py-2 text-sm font-medium text-[#F0F6FC] transition hover:border-[#22C55E]/50"
              >
                Explore Roadmap
              </Link>
              <Link
                to="/practice"
                className="inline-flex items-center gap-2 rounded-lg bg-[#22C55E] px-4 py-2 text-sm font-semibold text-[#0D1117] transition hover:bg-[#22C55E]/90"
              >
                Browse Problems
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        ) : filteredBookmarks.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-[#30363D] bg-[#1C2128] px-6 py-14 text-center">
            <Search className="mb-3 h-9 w-9 text-[#8B949E]/60" />
            <h2 className="text-base font-semibold text-[#F0F6FC]">
              No matching bookmarks
            </h2>
            <p className="mt-1 text-sm text-[#8B949E]">
              Try another search term or switch tabs.
            </p>
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setActiveTab('all');
              }}
              className="mt-4 rounded-lg border border-[#30363D] bg-[#0D1117] px-4 py-2 text-xs font-medium text-[#F0F6FC] hover:border-[#22C55E]/50"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <AnimatePresence initial={false}>
              {filteredBookmarks.map((item) => {
                const badge = getTypeBadge(item.type);
                const TypeIcon = badge.Icon;
                const savedDate = formatSavedDate(item.createdAt);
                const isRemoving = removingId === item.id;
                const targetLink = resolveBookmarkLink(item);

                return (
                  <motion.div
                    key={item.id}
                    layout
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                    transition={{ duration: 0.2 }}
                    className="flex flex-col gap-3 rounded-xl border border-[#30363D] bg-[#1C2128] p-4 transition hover:border-[#8B949E]/40 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0 flex-1 space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium ${badge.classes}`}
                        >
                          <TypeIcon className="h-3 w-3" />
                          {badge.label}
                        </span>
                        {item.difficulty ? (
                          <span
                            className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${getDifficultyBadgeStyle(
                              item.difficulty
                            )}`}
                          >
                            {item.difficulty}
                          </span>
                        ) : null}
                        {savedDate ? (
                          <span className="text-xs text-[#8B949E]">
                            Saved {savedDate}
                          </span>
                        ) : null}
                      </div>

                      <div>
                        <Link
                          to={targetLink}
                          className="text-base font-semibold text-[#F0F6FC] transition hover:text-[#22C55E]"
                        >
                          {item.title}
                        </Link>
                        {item.subtitle ? (
                          <p className="text-xs text-[#8B949E]">{item.subtitle}</p>
                        ) : null}
                      </div>
                    </div>

                    <div className="flex shrink-0 items-center gap-2">
                      <Link
                        to={targetLink}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-[#30363D] bg-[#0D1117] px-3 py-1.5 text-xs font-medium text-[#F0F6FC] transition hover:border-[#22C55E]/50 hover:text-[#22C55E]"
                      >
                        Open
                        <ExternalLink className="h-3.5 w-3.5" />
                      </Link>
                      <button
                        type="button"
                        disabled={isRemoving}
                        onClick={() => void handleRemoveBookmark(item)}
                        aria-label={`Remove ${item.title} from bookmarks`}
                        title="Remove bookmark"
                        className="inline-flex items-center justify-center rounded-lg border border-[#30363D] bg-[#0D1117] p-2 text-[#8B949E] transition hover:border-red-500/40 hover:bg-red-500/10 hover:text-red-400 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}
