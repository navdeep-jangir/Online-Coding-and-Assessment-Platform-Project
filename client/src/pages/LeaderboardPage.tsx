import { useCallback, useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  AlertCircle,
  ArrowUpDown,
  Award,
  Brain,
  Calendar,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Crown,
  Flame,
  GitBranch,
  GitFork,
  Globe,
  List,
  Mountain,
  RefreshCw,
  Repeat,
  Search,
  Sparkles,
  Star,
  Sword,
  Target,
  Trophy,
  Type,
  Users,
  X,
  Zap,
  type LucideIcon,
} from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

type LeaderboardTab = 'global' | 'weekly' | 'monthly';

interface AchievementBadge {
  id: string;
  name: string;
  icon?: string;
  description?: string;
}

interface LeaderboardEntry {
  id: string;
  rank: number;
  displayName: string;
  problemsSolved: number;
  easySolved: number;
  mediumSolved: number;
  hardSolved: number;
  xp: number;
  streak: number;
  badges: AchievementBadge[];
  isCurrentUser: boolean;
}

interface LeaderboardResponse {
  entries: LeaderboardEntry[];
  currentUser: LeaderboardEntry | null;
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  serverPaginated: boolean;
}

type UnknownRecord = Record<string, unknown>;

const BADGE_ICON_MAP: Record<string, LucideIcon> = {
  award: Award,
  sparkles: Sparkles,
  globe: Globe,
  target: Target,
  sword: Sword,
  crown: Crown,
  list: List,
  type: Type,
  repeat: Repeat,
  gitbranch: GitBranch,
  brain: Brain,
  flame: Flame,
  zap: Zap,
  calendar: Calendar,
  mountain: Mountain,
  arrowupdown: ArrowUpDown,
  gitfork: GitFork,
};

function renderBadgeIcon(iconName?: string) {
  const key = String(iconName || '').trim().toLowerCase();
  const IconComp = BADGE_ICON_MAP[key] || Award;
  return <IconComp className="h-3 w-3 text-[#22C55E]" aria-hidden="true" />;
}

const PAGE_SIZE = 15;

const TABS: Array<{ id: LeaderboardTab; label: string }> = [
  { id: 'global', label: 'Global' },
  { id: 'weekly', label: 'Weekly' },
  { id: 'monthly', label: 'Monthly' },
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

function asNumber(val: unknown, fallback = 0): number {
  if (typeof val === 'number' && Number.isFinite(val)) return val;
  if (typeof val === 'string' && val.trim() !== '') {
    const parsed = Number(val);
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
}

function asBoolean(val: unknown, fallback = false): boolean {
  if (typeof val === 'boolean') return val;
  return fallback;
}

function parseBadges(raw: unknown): AchievementBadge[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item, idx): AchievementBadge | null => {
      if (typeof item === 'string') {
        return { id: `${idx}-${item}`, name: item };
      }
      const obj = asRecord(item);
      if (!obj) return null;
      const name = asString(obj.name ?? obj.title ?? obj.label, '');
      if (!name) return null;
      return {
        id: asString(obj._id ?? obj.id ?? `${idx}-${name}`),
        name,
        icon: asString(obj.icon) || undefined,
        description: asString(obj.description) || undefined,
      };
    })
    .filter((b): b is AchievementBadge => b !== null);
}

function parseEntry(raw: UnknownRecord, idx: number, offset = 0): LeaderboardEntry {
  const userObj = asRecord(raw.user) ?? asRecord(raw.profile);
  const id = asString(
    userObj?._id ?? userObj?.id ?? raw.userId ?? raw._id ?? raw.id ?? idx
  );
  // Display name only — never read or expose email
  const rawName = asString(
    raw.displayName ??
      userObj?.displayName ??
      raw.name ??
      userObj?.name ??
      raw.username ??
      userObj?.username,
    'Anonymous Climber'
  );
  const displayName = rawName.includes('@')
    ? rawName.split('@')[0] || 'Climber'
    : rawName;

  return {
    id,
    rank: asNumber(raw.rank ?? raw.position, offset + idx + 1),
    displayName,
    problemsSolved: asNumber(
      raw.problemsSolved ?? raw.solvedCount ?? raw.solved ?? userObj?.problemsSolved,
      0
    ),
    easySolved: asNumber(raw.easySolved, 0),
    mediumSolved: asNumber(raw.mediumSolved, 0),
    hardSolved: asNumber(raw.hardSolved, 0),
    xp: asNumber(
      raw.xp ?? raw.totalXp ?? raw.points ?? raw.score ?? userObj?.xp,
      0
    ),
    streak: asNumber(
      raw.streak ?? raw.currentStreak ?? userObj?.currentStreak,
      0
    ),
    badges: parseBadges(raw.badges ?? raw.achievements ?? userObj?.badges),
    isCurrentUser: asBoolean(
      raw.isCurrentUser ?? raw.isMe ?? raw.isSelf ?? raw.current,
      false
    ),
  };
}

function parseLeaderboardResponse(
  response: unknown,
  requestedPage: number
): LeaderboardResponse {
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
      : dataObj.leaderboard ??
        dataObj.entries ??
        dataObj.users ??
        dataObj.items ??
        dataObj.rankings ??
        [];

  const pagObj =
    asRecord(bodyObj?.pagination) ??
    asRecord(dataObj.pagination) ??
    dataObj;

  const limit = asNumber(pagObj.limit ?? pagObj.pageSize, PAGE_SIZE);
  const page = asNumber(pagObj.page ?? pagObj.currentPage, requestedPage);
  const offset = (Math.max(1, page) - 1) * limit;

  const entries: LeaderboardEntry[] = Array.isArray(rawList)
    ? rawList
        .map((item) => asRecord(item))
        .filter((item): item is UnknownRecord => item !== null)
        .map((item, idx) => parseEntry(item, idx, offset))
    : [];

  const total = asNumber(
    pagObj.total ?? pagObj.totalDocs ?? pagObj.totalUsers ?? pagObj.count,
    entries.length
  );
  const totalPages = asNumber(
    pagObj.totalPages ?? pagObj.pages,
    Math.max(1, Math.ceil(total / Math.max(1, limit)))
  );

  const serverPaginated =
    Boolean(pagObj.totalPages !== undefined || pagObj.total !== undefined) &&
    total > entries.length;

  const rawCurrent =
    asRecord(dataObj.currentUser) ??
    asRecord(dataObj.currentUserRank) ??
    asRecord(dataObj.myRank) ??
    asRecord(dataObj.userRank) ??
    asRecord(bodyObj?.currentUser);

  let currentUser: LeaderboardEntry | null = null;
  if (rawCurrent) {
    currentUser = {
      ...parseEntry(rawCurrent, 0),
      isCurrentUser: true,
    };
  } else {
    currentUser = entries.find((e) => e.isCurrentUser) ?? null;
  }

  return {
    entries,
    currentUser,
    page,
    limit,
    total,
    totalPages,
    serverPaginated,
  };
}

function RankMedal({ rank }: { rank: number }) {
  if (rank === 1) {
    return (
      <span
        className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-amber-400/15 text-lg"
        title="1st Place"
        aria-label="1st Place"
      >
        🥇
      </span>
    );
  }
  if (rank === 2) {
    return (
      <span
        className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-slate-300/15 text-lg"
        title="2nd Place"
        aria-label="2nd Place"
      >
        🥈
      </span>
    );
  }
  if (rank === 3) {
    return (
      <span
        className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-amber-700/20 text-lg"
        title="3rd Place"
        aria-label="3rd Place"
      >
        🥉
      </span>
    );
  }
  return (
    <span className="inline-flex h-8 w-8 items-center justify-center font-mono text-sm font-semibold text-[#8B949E]">
      #{rank}
    </span>
  );
}

function LeaderboardSkeleton() {
  return (
    <div className="space-y-3 animate-pulse" aria-busy="true" aria-label="Loading leaderboard">
      {Array.from({ length: 8 }).map((_, idx) => (
        <div
          key={idx}
          className="flex items-center justify-between rounded-xl border border-[#30363D] bg-[#1C2128] px-5 py-4"
        >
          <div className="flex items-center gap-4">
            <div className="h-8 w-8 rounded-full bg-[#30363D]" />
            <div className="h-4 w-36 rounded bg-[#30363D]" />
          </div>
          <div className="flex items-center gap-6">
            <div className="h-4 w-14 rounded bg-[#30363D]" />
            <div className="h-4 w-16 rounded bg-[#30363D]" />
            <div className="hidden h-4 w-14 rounded bg-[#30363D] sm:block" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function LeaderboardPage() {
  const { user, refreshUser } = useAuth();
  const [activeTab, setActiveTab] = useState<LeaderboardTab>('global');
  const [minSolved, setMinSolved] = useState<number>(0);
  const [searchInput, setSearchInput] = useState<string>('');
  const [debouncedSearch, setDebouncedSearch] = useState<string>('');
  const [page, setPage] = useState<number>(1);
  const [data, setData] = useState<LeaderboardResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [togglingOptOut, setTogglingOptOut] = useState<boolean>(false);

  const isOptedOut = Boolean((user as { leaderboardOptOut?: boolean } | null)?.leaderboardOptOut);

  const handleToggleOptOut = async () => {
    setTogglingOptOut(true);
    try {
      await api.put('/auth/profile', { leaderboardOptOut: !isOptedOut });
      await refreshUser();
      await fetchLeaderboard();
      toast.success(!isOptedOut ? 'Hidden from public rankings.' : 'Visible on public rankings.');
    } catch {
      toast.error('Failed to update leaderboard visibility.');
    } finally {
      setTogglingOptOut(false);
    }
  };

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(searchInput.trim());
      setPage(1);
    }, 300);
    return () => window.clearTimeout(timer);
  }, [searchInput]);

  const fetchLeaderboard = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get('/leaderboard', {
        params: {
          period: activeTab,
          timeframe: activeTab,
          page,
          limit: PAGE_SIZE,
          ...(minSolved > 0 ? { minSolved } : {}),
          ...(debouncedSearch ? { search: debouncedSearch } : {}),
        },
      });
      setData(parseLeaderboardResponse(response, page));
    } catch (err: unknown) {
      const errObj = asRecord(err);
      const errResp = asRecord(errObj?.response);
      const errData = asRecord(errResp?.data);
      setError(
        asString(
          errData?.message ?? errObj?.message,
          'Unable to load leaderboard standings.'
        )
      );
    } finally {
      setLoading(false);
    }
  }, [activeTab, page, debouncedSearch, minSolved]);

  useEffect(() => {
    void fetchLeaderboard();
  }, [fetchLeaderboard]);

  const filteredEntries = useMemo(() => {
    if (!data) return [];
    let list = data.entries;
    if (debouncedSearch) {
      const q = debouncedSearch.toLowerCase();
      list = list.filter((entry) => entry.displayName.toLowerCase().includes(q));
    }
    if (!data.serverPaginated) {
      const start = (page - 1) * PAGE_SIZE;
      return list.slice(start, start + PAGE_SIZE);
    }
    return list;
  }, [data, debouncedSearch, page]);

  const totalPages = useMemo(() => {
    if (!data) return 1;
    if (data.serverPaginated) return Math.max(1, data.totalPages);
    const baseCount = debouncedSearch
      ? data.entries.filter((e) =>
          e.displayName.toLowerCase().includes(debouncedSearch.toLowerCase())
        ).length
      : data.entries.length;
    return Math.max(1, Math.ceil(baseCount / PAGE_SIZE));
  }, [data, debouncedSearch]);

  const handleTabChange = (tab: LeaderboardTab) => {
    if (tab === activeTab) return;
    setActiveTab(tab);
    setPage(1);
  };

  return (
    <div className="min-h-screen bg-[#0D1117] px-4 py-6 text-[#F0F6FC] sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="flex items-center gap-2.5 text-2xl font-bold tracking-tight text-[#F0F6FC] sm:text-3xl">
              <Trophy className="h-7 w-7 text-[#22C55E]" />
              Leaderboard
            </h1>
            <p className="mt-1 text-sm text-[#8B949E]">
              See how you rank against fellow climbers by XP, problems solved, and daily streaks.
            </p>
          </div>

          {/* Search Input */}
          <div className="relative w-full sm:w-72">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8B949E]" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search climber by name..."
              aria-label="Search leaderboard by name"
              className="w-full rounded-lg border border-[#30363D] bg-[#1C2128] py-2 pl-9 pr-8 text-sm text-[#F0F6FC] placeholder-[#8B949E] transition focus:border-[#22C55E] focus:outline-none"
            />
            {searchInput ? (
              <button
                type="button"
                onClick={() => setSearchInput('')}
                aria-label="Clear search"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#8B949E] hover:text-[#F0F6FC]"
              >
                <X className="h-4 w-4" />
              </button>
            ) : null}
          </div>
        </div>

        {/* Tab Selector, Filter & Opt-Out */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div
            className="inline-flex rounded-xl border border-[#30363D] bg-[#1C2128] p-1"
            role="tablist"
            aria-label="Leaderboard timeframe"
          >
            {TABS.map((tab) => {
              const active = tab.id === activeTab;
              return (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => handleTabChange(tab.id)}
                  className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                    active
                      ? 'bg-[#22C55E] text-[#0D1117] shadow-sm'
                      : 'text-[#8B949E] hover:text-[#F0F6FC]'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <select
              value={minSolved}
              onChange={(e) => {
                setMinSolved(Number(e.target.value));
                setPage(1);
              }}
              aria-label="Minimum solved problems filter"
              className="rounded-lg border border-[#30363D] bg-[#1C2128] px-3 py-2 text-xs font-medium text-[#F0F6FC] focus:border-[#22C55E] focus:outline-none"
            >
              <option value={0}>All Climbers</option>
              <option value={1}>1+ Solved</option>
              <option value={5}>5+ Solved</option>
              <option value={10}>10+ Solved</option>
            </select>

            <button
              type="button"
              disabled={togglingOptOut}
              onClick={() => void handleToggleOptOut()}
              className={`rounded-lg border px-3 py-2 text-xs font-medium transition ${
                isOptedOut
                  ? 'border-amber-500/40 bg-amber-500/10 text-amber-300'
                  : 'border-[#30363D] bg-[#1C2128] text-[#8B949E] hover:text-[#F0F6FC]'
              }`}
            >
              {isOptedOut ? 'Opted Out (Show Me)' : 'Opt Out of Public Rank'}
            </button>
          </div>
        </div>

        {/* Highlighted Current User Standing */}
        {!loading && data?.currentUser ? (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-[#22C55E]/40 bg-[#22C55E]/10 px-5 py-4"
          >
            <div className="flex items-center gap-3.5">
              <RankMedal rank={data.currentUser.rank} />
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-[#F0F6FC]">
                    {data.currentUser.displayName}
                  </span>
                  <span className="rounded-full bg-[#22C55E] px-2 py-0.5 text-[11px] font-bold uppercase text-[#0D1117]">
                    Your Rank
                  </span>
                </div>
                <p className="text-xs text-[#8B949E]">
                  Position #{data.currentUser.rank} on the {activeTab} standings
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-5 text-sm">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-[#22C55E]" />
                <span className="font-mono font-semibold text-[#F0F6FC]">
                  {data.currentUser.problemsSolved}
                </span>
                <span className="text-xs text-[#8B949E]">solved</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Star className="h-4 w-4 text-[#38BDF8]" />
                <span className="font-mono font-semibold text-[#F0F6FC]">
                  {data.currentUser.xp.toLocaleString()}
                </span>
                <span className="text-xs text-[#8B949E]">XP</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Flame className="h-4 w-4 text-amber-400" />
                <span className="font-mono font-semibold text-[#F0F6FC]">
                  {data.currentUser.streak}d
                </span>
              </div>
            </div>
          </motion.div>
        ) : null}

        {/* Content */}
        {loading ? (
          <LeaderboardSkeleton />
        ) : error ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-red-500/30 bg-[#1C2128] px-6 py-14 text-center">
            <AlertCircle className="mb-3 h-10 w-10 text-red-400" />
            <h2 className="text-lg font-semibold text-[#F0F6FC]">
              Could not load leaderboard
            </h2>
            <p className="mt-1 max-w-md text-sm text-[#8B949E]">{error}</p>
            <button
              type="button"
              onClick={() => void fetchLeaderboard()}
              className="mt-5 inline-flex items-center gap-2 rounded-lg bg-[#22C55E] px-4 py-2 text-sm font-semibold text-[#0D1117] transition hover:bg-[#22C55E]/90"
            >
              <RefreshCw className="h-4 w-4" />
              Retry
            </button>
          </div>
        ) : filteredEntries.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-[#30363D] bg-[#1C2128] px-6 py-16 text-center">
            <Users className="mb-3 h-10 w-10 text-[#8B949E]/60" />
            <h2 className="text-base font-semibold text-[#F0F6FC]">
              {debouncedSearch ? 'No climbers match your search' : 'No leaderboard entries yet'}
            </h2>
            <p className="mt-1 text-sm text-[#8B949E]">
              {debouncedSearch
                ? `Try searching for another name or clear "${debouncedSearch}".`
                : 'Solve problems and earn XP to appear on the leaderboard.'}
            </p>
            {debouncedSearch ? (
              <button
                type="button"
                onClick={() => setSearchInput('')}
                className="mt-4 rounded-lg border border-[#30363D] bg-[#0D1117] px-4 py-2 text-xs font-medium text-[#F0F6FC] hover:border-[#22C55E]/50"
              >
                Clear Search
              </button>
            ) : null}
          </div>
        ) : (
          <>
            {/* Top 3 Podium */}
            {page === 1 && !debouncedSearch && filteredEntries.length > 0 && (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                {filteredEntries.slice(0, 3).map((entry) => (
                  <div
                    key={`podium-${entry.id}`}
                    className={`rounded-xl border p-4 ${
                      entry.rank === 1
                        ? 'border-amber-400/40 bg-amber-500/10'
                        : entry.rank === 2
                          ? 'border-slate-400/30 bg-slate-500/10'
                          : 'border-amber-700/40 bg-amber-900/10'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <RankMedal rank={entry.rank} />
                      <span className="font-mono text-sm font-bold text-[#38BDF8]">
                        {entry.xp.toLocaleString()} XP
                      </span>
                    </div>
                    <p className="mt-3 truncate text-base font-bold text-[#F0F6FC]">
                      {entry.displayName}
                    </p>
                    <p className="mt-1 text-xs text-[#8B949E]">
                      {entry.problemsSolved} solved ({entry.easySolved}E / {entry.mediumSolved}M /{' '}
                      {entry.hardSolved}H) • {entry.streak}d streak
                    </p>
                  </div>
                ))}
              </div>
            )}

            {/* Desktop Table */}
            <div className="hidden overflow-hidden rounded-xl border border-[#30363D] bg-[#1C2128] md:block">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-[#30363D] bg-[#161B22] text-xs uppercase tracking-wider text-[#8B949E]">
                      <th className="px-5 py-3.5 font-medium">Rank</th>
                      <th className="px-5 py-3.5 font-medium">Climber</th>
                      <th className="px-5 py-3.5 font-medium">Problems Solved</th>
                      <th className="px-5 py-3.5 font-medium">XP</th>
                      <th className="px-5 py-3.5 font-medium">Streak</th>
                      <th className="px-5 py-3.5 font-medium">Achievements</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#30363D]/60">
                    {filteredEntries.map((entry) => {
                      const highlighted = entry.isCurrentUser;
                      return (
                        <tr
                          key={entry.id}
                          className={`transition-colors ${
                            highlighted
                              ? 'bg-[#22C55E]/10 ring-1 ring-inset ring-[#22C55E]/30'
                              : 'hover:bg-[#0D1117]/50'
                          }`}
                        >
                          <td className="px-5 py-3.5">
                            <RankMedal rank={entry.rank} />
                          </td>
                          <td className="px-5 py-3.5">
                            <div className="flex items-center gap-2.5">
                              <div
                                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                                  highlighted
                                    ? 'bg-[#22C55E] text-[#0D1117]'
                                    : 'bg-[#0D1117] text-[#F0F6FC] border border-[#30363D]'
                                }`}
                              >
                                {entry.displayName.charAt(0).toUpperCase()}
                              </div>
                              <span className="font-semibold text-[#F0F6FC]">
                                {entry.displayName}
                              </span>
                              {highlighted ? (
                                <span className="rounded-full bg-[#22C55E]/20 px-2 py-0.5 text-[11px] font-semibold text-[#22C55E]">
                                  You
                                </span>
                              ) : null}
                            </div>
                          </td>
                          <td className="px-5 py-3.5">
                            <span className="font-mono font-semibold text-[#F0F6FC]">
                              {entry.problemsSolved.toLocaleString()}
                            </span>
                            <span className="ml-2 text-xs text-[#8B949E]">
                              ({entry.easySolved}E / {entry.mediumSolved}M / {entry.hardSolved}H)
                            </span>
                          </td>
                          <td className="px-5 py-3.5 font-mono font-semibold text-[#38BDF8]">
                            {entry.xp.toLocaleString()}
                          </td>
                          <td className="px-5 py-3.5">
                            <span className="inline-flex items-center gap-1 font-mono text-amber-400">
                              <Flame className="h-3.5 w-3.5" />
                              {entry.streak}d
                            </span>
                          </td>
                          <td className="px-5 py-3.5">
                            {entry.badges.length === 0 ? (
                              <span className="text-xs text-[#8B949E]">—</span>
                            ) : (
                              <div className="flex flex-wrap items-center gap-1.5">
                                {entry.badges.slice(0, 3).map((badge) => (
                                  <span
                                    key={badge.id}
                                    title={badge.description || badge.name}
                                    className="inline-flex items-center gap-1 rounded-full border border-[#30363D] bg-[#0D1117] px-2 py-0.5 text-xs text-[#F0F6FC]"
                                  >
                                    {renderBadgeIcon(badge.icon)}
                                    <span className="max-w-[100px] truncate">
                                      {badge.name}
                                    </span>
                                  </span>
                                ))}
                                {entry.badges.length > 3 ? (
                                  <span className="text-xs text-[#8B949E]">
                                    +{entry.badges.length - 3}
                                  </span>
                                ) : null}
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Mobile Card List */}
            <div className="space-y-3 md:hidden">
              {filteredEntries.map((entry) => {
                const highlighted = entry.isCurrentUser;
                return (
                  <div
                    key={entry.id}
                    className={`rounded-xl border p-4 ${
                      highlighted
                        ? 'border-[#22C55E]/50 bg-[#22C55E]/10'
                        : 'border-[#30363D] bg-[#1C2128]'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <RankMedal rank={entry.rank} />
                        <span className="font-semibold text-[#F0F6FC]">
                          {entry.displayName}
                        </span>
                        {highlighted ? (
                          <span className="rounded-full bg-[#22C55E] px-2 py-0.5 text-[10px] font-bold uppercase text-[#0D1117]">
                            You
                          </span>
                        ) : null}
                      </div>
                      <span className="font-mono text-sm font-bold text-[#38BDF8]">
                        {entry.xp.toLocaleString()} XP
                      </span>
                    </div>

                    <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-[#30363D]/70 pt-3 text-xs text-[#8B949E]">
                      <span>Solved: {entry.problemsSolved}</span>
                      <span className="inline-flex items-center gap-1 text-amber-400">
                        <Flame className="h-3.5 w-3.5" />
                        {entry.streak}d streak
                      </span>
                    </div>

                    {entry.badges.length > 0 ? (
                      <div className="mt-2.5 flex flex-wrap gap-1.5">
                        {entry.badges.slice(0, 3).map((badge) => (
                          <span
                            key={badge.id}
                            className="inline-flex items-center gap-1 rounded-full border border-[#30363D] bg-[#0D1117] px-2 py-0.5 text-[11px] text-[#F0F6FC]"
                          >
                            {badge.icon ? (
                              <span>{badge.icon}</span>
                            ) : (
                              <Award className="h-3 w-3 text-[#22C55E]" />
                            )}
                            {badge.name}
                          </span>
                        ))}
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>

            {/* Pagination */}
            {totalPages > 1 ? (
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#30363D] bg-[#1C2128] px-5 py-3.5">
                <p className="text-xs text-[#8B949E]">
                  Page <span className="font-semibold text-[#F0F6FC]">{page}</span> of{' '}
                  <span className="font-semibold text-[#F0F6FC]">{totalPages}</span>
                </p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    className="inline-flex items-center gap-1 rounded-lg border border-[#30363D] bg-[#0D1117] px-3 py-1.5 text-xs font-medium text-[#F0F6FC] transition hover:border-[#8B949E]/50 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <ChevronLeft className="h-3.5 w-3.5" />
                    Previous
                  </button>
                  <button
                    type="button"
                    disabled={page >= totalPages}
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    className="inline-flex items-center gap-1 rounded-lg border border-[#30363D] bg-[#0D1117] px-3 py-1.5 text-xs font-medium text-[#F0F6FC] transition hover:border-[#8B949E]/50 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Next
                    <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ) : null}
          </>
        )}
      </div>
    </div>
  );
}
