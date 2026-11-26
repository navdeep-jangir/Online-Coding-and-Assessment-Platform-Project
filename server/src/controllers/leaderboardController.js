import mongoose from 'mongoose';
import { resolveModel } from '../services/recommendationService.js';
import {
  getISTDateString,
  getPreviousISTDateString,
  getISTDayRange,
} from './dailyChallengeController.js';

/**
 * Leaderboard Controller for CodeClimb
 *
 * DSA Usage:
 * 1. Merge Sort (`mergeSort`):
 *    Implements top-down Merge Sort for deterministic, stable ranking of users.
 *    Time complexity: O(N log N) worst-case, best-case, and average-case.
 *    Space complexity: O(N) auxiliary arrays.
 *    Stability preserves tie-breaking order across multi-key comparisons
 *    (xp DESC -> solvedCount DESC -> streak DESC -> name ASC).
 *
 * 2. Hash Map & Hash Set (`Map`, `Set`):
 *    Aggregates weekly/monthly Submission XP and distinct solved problem counts
 *    per user in O(S) single pass (preventing duplicate XP on re-submissions).
 *
 * Security:
 *    Explicitly excludes sensitive fields (email, password, tokens) from both
 *    database projections and serialized API responses.
 */

const DIFFICULTY_DEFAULT_XP = Object.freeze({
  easy: 10,
  medium: 20,
  hard: 30,
});

/**
 * Stable Merge Sort implementation (O(N log N) time, O(N) space).
 *
 * @template T
 * @param {T[]} items Input array
 * @param {(a: T, b: T) => number} comparator Standard comparator (<0, 0, >0)
 * @returns {T[]} New sorted array
 */
export function mergeSort(items, comparator) {
  if (!Array.isArray(items) || items.length <= 1) {
    return Array.isArray(items) ? [...items] : [];
  }

  const mid = items.length >> 1;
  const left = mergeSort(items.slice(0, mid), comparator);
  const right = mergeSort(items.slice(mid), comparator);

  return merge(left, right, comparator);
}

function merge(left, right, comparator) {
  const result = [];
  let i = 0;
  let j = 0;

  while (i < left.length && j < right.length) {
    if (comparator(left[i], right[j]) <= 0) {
      result.push(left[i]);
      i += 1;
    } else {
      result.push(right[j]);
      j += 1;
    }
  }

  while (i < left.length) {
    result.push(left[i]);
    i += 1;
  }
  while (j < right.length) {
    result.push(right[j]);
    j += 1;
  }

  return result;
}

export function compareLeaderboardEntries(a, b) {
  if (b.xp !== a.xp) return b.xp - a.xp;
  if (b.solvedCount !== a.solvedCount) return b.solvedCount - a.solvedCount;
  if (b.streak !== a.streak) return b.streak - a.streak;
  return String(a.name || '').localeCompare(String(b.name || ''));
}

function extractUserStreak(user) {
  if (typeof user?.streak === 'number') return user.streak;
  if (typeof user?.currentStreak === 'number') return user.currentStreak;
  if (typeof user?.streak?.current === 'number') return user.streak.current;
  return 0;
}

function normalizePeriod(rawPeriod) {
  const value = String(rawPeriod || 'all').trim().toLowerCase();
  if (value === 'week' || value === 'weekly') return 'weekly';
  if (value === 'month' || value === 'monthly') return 'monthly';
  return 'all';
}

function getPeriodStartUTC(period) {
  const todayIST = getISTDateString();
  if (period === 'weekly') {
    const startDateIST = getPreviousISTDateString(todayIST, 6);
    return getISTDayRange(startDateIST).start;
  }
  if (period === 'monthly') {
    const startDateIST = getPreviousISTDateString(todayIST, 29);
    return getISTDayRange(startDateIST).start;
  }
  return null;
}

/**
 * Compute full ranked leaderboard for `'all'`, `'weekly'`, or `'monthly'` window.
 * Never selects or returns user email addresses.
 */
export async function computeRankedLeaderboard(period = 'all') {
  const UserModel = await resolveModel(['User'], [() => import('../models/User.js')]);
  const SubmissionModel = await resolveModel(
    ['Submission'],
    [() => import('../models/Submission.js')]
  );
  const XPEventModel = await resolveModel(['XPEvent'], [() => import('../models/XPEvent.js')]);
  const UserAchievementModel = await resolveModel(
    ['UserAchievement'],
    [() => import('../models/UserAchievement.js')]
  );

  if (!UserModel) {
    const err = new Error('User model is unavailable');
    err.statusCode = 500;
    throw err;
  }

  // Strictly project non-PII public leaderboard fields (explicitly omit email & password)
  const users = await UserModel.find({
    isActive: { $ne: false },
    leaderboardOptOut: { $ne: true },
  })
    .select('_id name username avatar xp streak currentStreak solvedProblems solvedCount')
    .lean();

  const windowStart = getPeriodStartUTC(period);

  // Hash maps to aggregate per-user stats in O(S + E)
  const userSolvedMap = new Map(); // userId -> Set<problemId>
  const userDiffMap = new Map(); // userId -> { easy: Set, medium: Set, hard: Set }
  const userPeriodXpMap = new Map(); // userId -> number
  const userBadgesMap = new Map(); // userId -> Array<badge>

  if (SubmissionModel) {
    const subQuery = {
      $or: [{ verdict: 'Accepted' }, { status: 'Accepted' }],
    };
    if (windowStart) {
      subQuery.createdAt = { $gte: windowStart };
    }

    const acceptedSubmissions = await SubmissionModel.find(subQuery)
      .select('user userId problem problemId createdAt')
      .populate('problem', 'difficulty')
      .lean();

    for (const sub of acceptedSubmissions) {
      const uid = String(sub.user?._id || sub.user || sub.userId || '');
      const pid = String(sub.problem?._id || sub.problem || sub.problemId || '');
      if (!uid || !pid) continue;

      if (!userSolvedMap.has(uid)) {
        userSolvedMap.set(uid, new Set());
        userDiffMap.set(uid, { easy: new Set(), medium: new Set(), hard: new Set() });
      }
      const solvedSet = userSolvedMap.get(uid);
      if (!solvedSet.has(pid)) {
        solvedSet.add(pid);
        const diffKey = String(sub.problem?.difficulty || 'easy').toLowerCase();
        const diffSets = userDiffMap.get(uid);
        if (diffKey === 'medium') diffSets.medium.add(pid);
        else if (diffKey === 'hard') diffSets.hard.add(pid);
        else diffSets.easy.add(pid);
      }
    }
  }

  // Use actual XPEvents earned during the weekly/monthly window
  if (windowStart && XPEventModel) {
    const periodEvents = await XPEventModel.find({
      createdAt: { $gte: windowStart },
    })
      .select('user amount')
      .lean();

    for (const ev of periodEvents) {
      if (!ev?.user) continue;
      const uid = String(ev.user);
      userPeriodXpMap.set(uid, (userPeriodXpMap.get(uid) || 0) + Number(ev.amount || 0));
    }
  }

  // Load earned achievement badges per user
  if (UserAchievementModel) {
    await resolveModel(['Achievement'], [() => import('../models/Achievement.js')]);
    const userAchs = await UserAchievementModel.find({})
      .populate('achievement', 'key title iconName description')
      .sort({ earnedAt: -1 })
      .lean();

    for (const ua of userAchs) {
      if (!ua?.user || !ua?.achievement) continue;
      const uid = String(ua.user);
      if (!userBadgesMap.has(uid)) userBadgesMap.set(uid, []);
      userBadgesMap.get(uid).push({
        id: String(ua.achievement._id || ua.achievement.key),
        name: ua.achievement.title,
        icon: ua.achievement.iconName || 'Award',
        description: ua.achievement.description || '',
      });
    }
  }

  // Construct sanitized public leaderboard entries (NO emails)
  const entries = users.map((u) => {
    const uid = String(u._id);
    const subSolvedCount = userSolvedMap.get(uid)?.size || 0;
    const diffSets = userDiffMap.get(uid);
    const storedSolvedCount = Array.isArray(u.solvedProblems)
      ? u.solvedProblems.length
      : Number(u.solvedCount || 0);

    const solvedCount = windowStart
      ? subSolvedCount
      : Math.max(subSolvedCount, storedSolvedCount);

    const xp = windowStart
      ? userPeriodXpMap.get(uid) || 0
      : Number(u.xp || 0);

    return {
      userId: uid,
      name: u.name || u.username || 'Climber',
      avatar: u.avatar || null,
      xp,
      solvedCount,
      easySolved: diffSets?.easy.size || 0,
      mediumSolved: diffSets?.medium.size || 0,
      hardSolved: diffSets?.hard.size || 0,
      streak: extractUserStreak(u),
      badges: userBadgesMap.get(uid) || [],
    };
  });

  // Sort with O(N log N) Merge Sort
  const sorted = mergeSort(entries, compareLeaderboardEntries);

  // Assign competition ranks (tied XP + solvedCount + streak share rank)
  let currentRank = 1;
  const ranked = sorted.map((entry, idx) => {
    if (idx > 0) {
      const prev = sorted[idx - 1];
      const isTie =
        prev.xp === entry.xp &&
        prev.solvedCount === entry.solvedCount &&
        prev.streak === entry.streak;
      if (!isTie) {
        currentRank = idx + 1;
      }
    }
    return {
      rank: currentRank,
      userId: entry.userId,
      name: entry.name,
      avatar: entry.avatar,
      xp: entry.xp,
      solvedCount: entry.solvedCount,
      easySolved: entry.easySolved,
      mediumSolved: entry.mediumSolved,
      hardSolved: entry.hardSolved,
      streak: entry.streak,
      badges: entry.badges,
    };
  });

  return ranked;
}

/**
 * GET /api/leaderboard
 * Global, weekly, or monthly XP leaderboard with rank, name, xp, solvedCount, streak.
 * Emails are strictly omitted.
 */
export async function getLeaderboard(req, res) {
  try {
    const period = normalizePeriod(
      req.query?.period || req.query?.timeframe || req.query?.filter
    );
    const page = Math.max(1, parseInt(req.query?.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query?.limit, 10) || 20));
    const search = String(req.query?.search || req.query?.q || '')
      .trim()
      .toLowerCase();
    const minSolved = Math.max(0, parseInt(req.query?.minSolved, 10) || 0);

    const ranked = await computeRankedLeaderboard(period);
    const filtered = ranked.filter((item) => {
      if (search && !String(item.name || '').toLowerCase().includes(search)) return false;
      if (minSolved > 0 && item.solvedCount < minSolved) return false;
      return true;
    });

    const total = filtered.length;
    const startIdx = (page - 1) * limit;
    const paginated = filtered.slice(startIdx, startIdx + limit);

    const currentUserId = req.user?._id || req.user?.id;
    const myEntry = currentUserId
      ? ranked.find((item) => item.userId === String(currentUserId)) || null
      : null;

    return res.status(200).json({
      success: true,
      period,
      data: paginated,
      myRank: myEntry,
      totalParticipants: ranked.length,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Failed to load leaderboard',
    });
  }
}

/**
 * GET /api/leaderboard/rank
 * Retrieve the authenticated (or requested) user's rank and percentile.
 */
export async function getUserRank(req, res) {
  try {
    const targetUserId =
      req.params?.userId || req.query?.userId || req.user?._id || req.user?.id;

    if (!targetUserId) {
      return res.status(401).json({
        success: false,
        message: 'User ID is required',
      });
    }

    const period = normalizePeriod(
      req.query?.period || req.query?.timeframe || req.query?.filter
    );
    const ranked = await computeRankedLeaderboard(period);

    const entry = ranked.find((item) => item.userId === String(targetUserId));
    if (!entry) {
      return res.status(404).json({
        success: false,
        message: 'User not found on leaderboard',
      });
    }

    const totalUsers = ranked.length;
    const percentile =
      totalUsers > 1
        ? Number((((totalUsers - entry.rank) / (totalUsers - 1)) * 100).toFixed(2))
        : 100;

    return res.status(200).json({
      success: true,
      period,
      data: {
        ...entry,
        totalUsers,
        percentile,
      },
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Failed to get user rank',
    });
  }
}

export default {
  getLeaderboard,
  getUserRank,
  computeRankedLeaderboard,
  mergeSort,
  compareLeaderboardEntries,
};
