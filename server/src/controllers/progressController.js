import mongoose from 'mongoose';
import {
  buildPrerequisiteGraph,
  getNextRecommendation,
} from '../services/recommendationService.js';
import { getRevisionQueue } from '../services/revisionService.js';
import {
  getISTDateString,
  getPreviousISTDateString,
  calculateStreakFromDates,
  getOrAssignUserTodayChallenge,
} from './dailyChallengeController.js';
import { computeRankedLeaderboard } from './leaderboardController.js';
import {
  checkAndAwardAchievements,
  getUserAchievementsWithProgress,
} from '../services/xpService.js';
import { XP_VALUES } from '../config/constants.js';

/**
 * Progress & Analytics Controller for CodeClimb
 *
 * DSA Usage:
 * 1. Hash Maps & Hash Sets (`Map`, `Set`):
 *    - Deduplicates solved problems in O(S) to compute accurate difficulty
 *      breakdowns (easy/medium/hard) regardless of repeated submissions.
 *    - Single-pass O(S) aggregation builds topic-wise performance, language
 *      statistics, and IST date-bucketed sliding window activity arrays
 *      (7-day weekly & 30-day monthly series).
 *
 * 2. DAG Node Inventory:
 *    - Uses `buildPrerequisiteGraph()` + `Set` lookups to calculate exact
 *      roadmap topic completion percentage.
 */

async function resolveModel(modelNames, loaders) {
  for (const name of modelNames) {
    if (mongoose.models[name]) {
      return mongoose.models[name];
    }
  }
  for (const loader of loaders) {
    try {
      const mod = await loader();
      for (const name of modelNames) {
        if (mod?.[name]) return mod[name];
      }
      if (mod?.default) return mod.default;
      for (const name of modelNames) {
        if (mongoose.models[name]) return mongoose.models[name];
      }
    } catch {
      // Try next candidate
    }
  }
  return null;
}

function normalizeDifficulty(diff) {
  const value = String(diff || 'easy').trim().toLowerCase();
  if (value === 'medium' || value === 'intermediate') return 'medium';
  if (value === 'hard' || value === 'advanced') return 'hard';
  return 'easy';
}

function extractId(val) {
  if (!val) return null;
  if (typeof val === 'object') {
    return String(val._id || val.id || val.slug || '');
  }
  return String(val);
}

/**
 * Build a sliding-window daily activity timeline in Asia/Kolkata for `numDays` days.
 * Time complexity: O(S + D) where S = submissions and D = numDays.
 */
function buildActivityWindow(submissions, numDays) {
  const todayIST = getISTDateString();
  const bucketMap = new Map();
  const orderedDates = [];

  for (let offset = numDays - 1; offset >= 0; offset -= 1) {
    const dateStr = getPreviousISTDateString(todayIST, offset);
    orderedDates.push(dateStr);
    bucketMap.set(dateStr, {
      date: dateStr,
      submissions: 0,
      accepted: 0,
      solvedSet: new Set(),
    });
  }

  for (const sub of submissions) {
    const ts = sub.createdAt || sub.submittedAt;
    if (!ts) continue;
    const istDate = getISTDateString(ts);
    const bucket = bucketMap.get(istDate);
    if (!bucket) continue;

    bucket.submissions += 1;
    if ((sub.verdict || sub.status) === 'Accepted') {
      bucket.accepted += 1;
      const pId = extractId(sub.problem?._id || sub.problem || sub.problemId);
      if (pId) bucket.solvedSet.add(pId);
    }
  }

  return orderedDates.map((dateStr) => {
    const b = bucketMap.get(dateStr);
    const dayDate = new Date(`${dateStr}T12:00:00Z`);
    const dayName = dayDate.toLocaleDateString('en-US', {
      weekday: 'short',
      timeZone: 'UTC',
    });

    return {
      date: b.date,
      day: dayName,
      submissions: b.submissions,
      accepted: b.accepted,
      problemsSolved: b.solvedSet.size,
    };
  });
}

/**
 * Load core analytics inputs for a user in parallel.
 */
async function loadUserAnalyticsContext(userId) {
  const UserModel = await resolveModel(['User'], [() => import('../models/User.js')]);
  const SubmissionModel = await resolveModel(
    ['Submission'],
    [() => import('../models/Submission.js')]
  );
  const ProblemModel = await resolveModel(['Problem'], [() => import('../models/Problem.js')]);
  const TopicModel = await resolveModel(['Topic'], [() => import('../models/Topic.js')]);
  const DailyChallengeModel = await resolveModel(
    ['DailyChallenge'],
    [() => import('../models/DailyChallenge.js')]
  );
  const UserProgressModel = await resolveModel(
    ['UserProgress', 'Progress'],
    [() => import('../models/UserProgress.js'), () => import('../models/Progress.js')]
  );

  if (!UserModel) {
    const err = new Error('User model is unavailable');
    err.statusCode = 500;
    throw err;
  }

  const [user, submissions, problems, topics, completedChallenges, progressDocs] =
    await Promise.all([
      UserModel.findById(userId).select('-password').lean(),
      SubmissionModel
        ? SubmissionModel.find({ $or: [{ user: userId }, { userId }] })
            .populate('problem', 'title slug difficulty topic topics tags xpReward')
            .sort({ createdAt: -1 })
            .lean()
        : [],
      ProblemModel
        ? ProblemModel.find({ isActive: { $ne: false } })
            .select('_id title slug difficulty topic topics')
            .lean()
        : [],
      TopicModel ? TopicModel.find({}).select('_id title name slug problems').lean() : [],
      DailyChallengeModel
        ? DailyChallengeModel.find({
            $or: [{ 'completedBy.user': userId }, { completedBy: userId }],
          })
            .select('date completedBy')
            .lean()
        : [],
      UserProgressModel
        ? UserProgressModel.find({ $or: [{ user: userId }, { userId }] }).lean()
        : [],
    ]);

  if (!user) {
    const err = new Error('User not found');
    err.statusCode = 404;
    throw err;
  }

  return {
    user,
    submissions,
    problems,
    topics,
    completedChallenges,
    progressDocs,
  };
}

/**
 * Compute detailed analytics metrics in O(S + P + T) time using Hash Maps & Sets.
 */
async function computeAnalyticsData(userId, range = 'all') {
  const { user, submissions: allSubmissions, problems, topics, completedChallenges, progressDocs } =
    await loadUserAnalyticsContext(userId);

  const normalizedRange = range === '7d' || range === '30d' ? range : 'all';
  const todayIST = getISTDateString();
  const rangeStart =
    normalizedRange === '7d'
      ? new Date(`${getPreviousISTDateString(todayIST, 6)}T00:00:00.000+05:30`)
      : normalizedRange === '30d'
        ? new Date(`${getPreviousISTDateString(todayIST, 29)}T00:00:00.000+05:30`)
        : null;

  const submissions = rangeStart
    ? allSubmissions.filter((s) => {
        const ts = new Date(s.createdAt || s.submittedAt || 0);
        return ts >= rangeStart;
      })
    : allSubmissions;

  const problemMap = new Map();
  const totalByDifficulty = { easy: 0, medium: 0, hard: 0 };

  for (const p of problems) {
    problemMap.set(String(p._id), p);
    const diff = normalizeDifficulty(p.difficulty);
    totalByDifficulty[diff] += 1;
  }

  const topicNameMap = new Map();
  for (const t of topics) {
    const id = String(t._id);
    const label = t.title || t.name || t.slug || id;
    topicNameMap.set(id, label);
    if (t.slug) topicNameMap.set(String(t.slug), label);
  }

  const solvedProblemIds = new Set();
  const solvedDifficultyMap = new Map(); // problemId -> difficulty
  const topicStatsMap = new Map();
  const languageStatsMap = new Map();
  const activityDatesRaw = [];

  if (Array.isArray(user.activityDates)) {
    activityDatesRaw.push(...user.activityDates);
  }
  if (user.lastActivityDate) {
    activityDatesRaw.push(user.lastActivityDate);
  }
  for (const ch of completedChallenges) {
    const entry = (ch.completedBy || []).find(
      (item) => String(item?.user || item) === String(userId)
    );
    activityDatesRaw.push(entry?.completedAt || ch.date);
  }

  let acceptedCount = 0;

  for (const sub of submissions) {
    if (sub.createdAt || sub.submittedAt) {
      activityDatesRaw.push(sub.createdAt || sub.submittedAt);
    }

    const isAccepted = (sub.verdict || sub.status) === 'Accepted';
    if (isAccepted) acceptedCount += 1;

    const pObj = typeof sub.problem === 'object' && sub.problem !== null ? sub.problem : null;
    const pId = extractId(pObj?._id || sub.problem || sub.problemId);
    const resolvedProblem = pObj || (pId ? problemMap.get(pId) : null);
    const diff = normalizeDifficulty(resolvedProblem?.difficulty);

    if (isAccepted && pId) {
      solvedProblemIds.add(pId);
      solvedDifficultyMap.set(pId, diff);
    }

    // Language-wise aggregation
    const lang = String(sub.language || 'unknown').trim().toLowerCase();
    if (!languageStatsMap.has(lang)) {
      languageStatsMap.set(lang, {
        language: lang,
        totalSubmissions: 0,
        acceptedSubmissions: 0,
        solvedSet: new Set(),
      });
    }
    const langStats = languageStatsMap.get(lang);
    langStats.totalSubmissions += 1;
    if (isAccepted) {
      langStats.acceptedSubmissions += 1;
      if (pId) langStats.solvedSet.add(pId);
    }

    // Topic-wise aggregation
    const rawTopics = [];
    if (resolvedProblem?.topic) rawTopics.push(resolvedProblem.topic);
    if (Array.isArray(resolvedProblem?.topics)) rawTopics.push(...resolvedProblem.topics);
    if (
      rawTopics.length === 0 &&
      Array.isArray(resolvedProblem?.tags) &&
      resolvedProblem.tags.length > 0
    ) {
      rawTopics.push(resolvedProblem.tags[0]);
    }

    const uniqueTopicKeys = new Set(
      rawTopics
        .map((t) => {
          if (typeof t === 'object' && t !== null) {
            return String(t._id || t.id || t.slug || t.name || t.title);
          }
          return String(t);
        })
        .filter(Boolean)
    );

    for (const topicKey of uniqueTopicKeys) {
      if (!topicStatsMap.has(topicKey)) {
        const topicName =
          topicNameMap.get(topicKey) ||
          (typeof resolvedProblem?.topic === 'object' &&
            (resolvedProblem.topic?.title || resolvedProblem.topic?.name)) ||
          topicKey;
        topicStatsMap.set(topicKey, {
          topicId: topicKey,
          topicName,
          totalSubmissions: 0,
          acceptedSubmissions: 0,
          failedSubmissions: 0,
          attemptedSet: new Set(),
          solvedSet: new Set(),
        });
      }

      const tStats = topicStatsMap.get(topicKey);
      tStats.totalSubmissions += 1;
      if (pId) tStats.attemptedSet.add(pId);
      if (isAccepted) {
        tStats.acceptedSubmissions += 1;
        if (pId) tStats.solvedSet.add(pId);
      } else {
        tStats.failedSubmissions += 1;
      }
    }
  }

  // Merge user.solvedProblems if seeded without Submission docs
  if (Array.isArray(user.solvedProblems)) {
    for (const p of user.solvedProblems) {
      const pId = extractId(p);
      if (!pId) continue;
      solvedProblemIds.add(pId);
      if (!solvedDifficultyMap.has(pId)) {
        const meta = problemMap.get(pId);
        solvedDifficultyMap.set(pId, normalizeDifficulty(meta?.difficulty));
      }
    }
  }

  const solvedByDifficulty = { easy: 0, medium: 0, hard: 0 };
  for (const diff of solvedDifficultyMap.values()) {
    solvedByDifficulty[diff] = (solvedByDifficulty[diff] || 0) + 1;
  }

  const totalSubmissions = submissions.length;
  const acceptanceRate =
    totalSubmissions > 0
      ? Number(((acceptedCount / totalSubmissions) * 100).toFixed(2))
      : 0;

  const streak = calculateStreakFromDates(activityDatesRaw, getISTDateString());
  const effectiveLongestStreak = Math.max(
    streak.longestStreak,
    Number(user.longestStreak ?? user.streak?.longest ?? 0)
  );

  // Compute global rank using the shared leaderboard ranking engine
  let rank = null;
  let totalRankedUsers = 0;
  try {
    const ranked = await computeRankedLeaderboard('all');
    totalRankedUsers = ranked.length;
    const found = ranked.find((item) => item.userId === String(userId));
    rank = found ? found.rank : null;
  } catch {
    rank = null;
  }

  // Compute roadmap completion via DAG graph + completed topic set
  const graph = await buildPrerequisiteGraph();
  const completedTopicSet = new Set();
  for (const doc of progressDocs || []) {
    if (doc.isCompleted && (doc.topic || doc.topicId)) {
      const id = extractId(doc.topic || doc.topicId);
      if (id) completedTopicSet.add(graph.slugToId.get(id) || id);
    }
    if (Array.isArray(doc.completedTopics)) {
      for (const entry of doc.completedTopics) {
        const id = extractId(entry?.topic || entry?.topicId || entry);
        if (id) completedTopicSet.add(graph.slugToId.get(id) || id);
      }
    }
  }
  const topicSources = [
    user.completedTopics,
    user.progress?.completedTopics,
  ];
  for (const src of topicSources) {
    if (Array.isArray(src)) {
      for (const entry of src) {
        const id = extractId(entry?.topic || entry?.topicId || entry);
        if (id) {
          completedTopicSet.add(graph.slugToId.get(id) || id);
        }
      }
    }
  }
  for (const node of graph.nodes.values()) {
    if (
      !completedTopicSet.has(node.id) &&
      Array.isArray(node.problems) &&
      node.problems.length > 0 &&
      node.problems.every((p) => solvedProblemIds.has(extractId(p)))
    ) {
      completedTopicSet.add(node.id);
    }
  }

  const totalTopics = graph.nodes.size;
  const completedTopicsCount = Array.from(completedTopicSet).filter((id) =>
    graph.nodes.has(id)
  ).length;
  const roadmapCompletionPct =
    totalTopics > 0
      ? Number(((completedTopicsCount / totalTopics) * 100).toFixed(2))
      : 0;

  const topicWisePerformance = Array.from(topicStatsMap.values())
    .map((t) => ({
      topicId: t.topicId,
      topicName: t.topicName,
      totalSubmissions: t.totalSubmissions,
      acceptedSubmissions: t.acceptedSubmissions,
      failedSubmissions: t.failedSubmissions,
      acceptanceRate: Number(
        ((t.acceptedSubmissions / t.totalSubmissions) * 100).toFixed(2)
      ),
      problemsAttempted: t.attemptedSet.size,
      problemsSolved: t.solvedSet.size,
    }))
    .sort((a, b) => b.problemsSolved - a.problemsSolved || b.acceptanceRate - a.acceptanceRate);

  const languageWiseStats = Array.from(languageStatsMap.values())
    .map((l) => ({
      language: l.language,
      totalSubmissions: l.totalSubmissions,
      acceptedSubmissions: l.acceptedSubmissions,
      acceptanceRate: Number(
        ((l.acceptedSubmissions / l.totalSubmissions) * 100).toFixed(2)
      ),
      problemsSolved: l.solvedSet.size,
    }))
    .sort((a, b) => b.totalSubmissions - a.totalSubmissions);

  const strongTopics = topicWisePerformance
    .filter((t) => t.acceptanceRate >= 75 && t.problemsSolved >= 1)
    .sort((a, b) => b.acceptanceRate - a.acceptanceRate || b.problemsSolved - a.problemsSolved)
    .slice(0, 5);

  const weakTopics = topicWisePerformance
    .filter((t) => t.acceptanceRate < 60 && t.failedSubmissions > 0)
    .sort((a, b) => a.acceptanceRate - b.acceptanceRate || b.failedSubmissions - a.failedSubmissions)
    .slice(0, 5);

  const recentSubmissions = submissions.slice(0, 10).map((sub) => ({
    _id: sub._id,
    problem: sub.problem
      ? {
          _id: sub.problem._id || sub.problem,
          title: sub.problem.title || 'Problem',
          slug: sub.problem.slug || null,
          difficulty: sub.problem.difficulty || null,
        }
      : null,
    status: sub.verdict || sub.status,
    verdict: sub.verdict || sub.status,
    language: sub.language,
    runtime: sub.runtime ?? sub.executionTime ?? null,
    memory: sub.memory ?? null,
    createdAt: sub.createdAt,
    dateIST: getISTDateString(sub.createdAt),
  }));

  return {
    user,
    submissions,
    totalSolved: solvedProblemIds.size,
    difficultyCounts: {
      easy: solvedByDifficulty.easy,
      medium: solvedByDifficulty.medium,
      hard: solvedByDifficulty.hard,
      totalAvailable: totalByDifficulty,
    },
    streak: {
      current: streak.currentStreak,
      longest: effectiveLongestStreak,
      lastActivityDate: streak.lastActivityDate,
    },
    acceptanceRate,
    totalSubmissions,
    acceptedSubmissions: acceptedCount,
    xp: Number(user.xp || 0),
    rank,
    totalRankedUsers,
    roadmapCompletion: {
      percentage: roadmapCompletionPct,
      completedTopics: completedTopicsCount,
      totalTopics,
    },
    recentSubmissions,
    weeklyActivity: buildActivityWindow(submissions, 7),
    monthlyActivity: buildActivityWindow(submissions, 30),
    topicWisePerformance,
    languageWiseStats,
    strongTopics,
    weakTopics,
  };
}

/**
 * Escape a CSV field according to RFC 4180 and neutralize spreadsheet formula injection
 * (cells starting with =, +, -, @, tab, or carriage return).
 */
function escapeCsvCell(value) {
  if (value === null || value === undefined) return '';
  let str = String(value);
  if (/^[=+\-@\t\r]/.test(str)) {
    str = `'${str}`;
  }
  if (/[",\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * GET /api/progress/dashboard
 * Returns dashboard summary metrics: total solved, easy/medium/hard counts,
 * streak, acceptance rate, XP, rank, roadmap completion, recent submissions, and weekly activity.
 */
export async function getDashboardStats(req, res) {
  try {
    const userId = req.user?._id || req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const [analytics, recommendation, pendingRevisions, dailyResolved] =
      await Promise.all([
        computeAnalyticsData(userId),
        getNextRecommendation(userId).catch(() => null),
        getRevisionQueue(userId, { status: 'pending', includeUpcoming: true, limit: 10 }).catch(
          () => []
        ),
        getOrAssignUserTodayChallenge(userId).catch(() => null),
      ]);

    const dailyProblem = dailyResolved?.problem || null;
    const dailyChallenge = dailyProblem
      ? {
          id: String(dailyResolved?.attempt?._id || dailyResolved?.globalChallenge?._id || ''),
          slug: dailyProblem.slug,
          title: dailyProblem.title,
          difficulty: dailyProblem.difficulty || dailyResolved?.globalChallenge?.difficulty || 'Easy',
          completed: Boolean(dailyResolved?.attempt?.isCompleted),
          xpReward: XP_VALUES.dailyChallenge || 20,
          url: `/practice/${dailyProblem.slug}`,
        }
      : null;

    const dueItems = pendingRevisions.filter((r) => r.isDue);
    const revisionReminders = {
      dueCount: dueItems.length,
      pendingCount: pendingRevisions.length,
      items: (dueItems.length > 0 ? dueItems : pendingRevisions).slice(0, 5).map((r) => ({
        id: String(r._id),
        title: r.problem?.title || 'Problem',
        slug: r.problem?.slug || '',
        difficulty: r.problem?.difficulty || 'Easy',
        type: 'problem',
        dueDate: r.nextRevisionDate,
        incorrectAttempts: r.incorrectAttempts || 0,
        revisionReason: r.revisionReason || 'wrong_answer',
        url: r.problem?.slug ? `/practice/${r.problem.slug}` : '/revision',
      })),
      reviewUrl: '/revision',
    };

    const recommendedTopic = recommendation?.topic
      ? {
          id: recommendation.topic.id,
          slug: recommendation.topic.slug,
          title: recommendation.topic.title,
          module: recommendation.topic.moduleTitle || 'DSA Roadmap',
          difficulty: recommendation.topic.difficulty || 'Easy',
          reason: recommendation.reason,
          url: recommendation.topic.slug
            ? `/notes/${recommendation.topic.slug}`
            : '/roadmap',
        }
      : null;

    return res.status(200).json({
      success: true,
      data: {
        totalSolved: analytics.totalSolved,
        easySolved: analytics.difficultyCounts.easy,
        mediumSolved: analytics.difficultyCounts.medium,
        hardSolved: analytics.difficultyCounts.hard,
        difficultyCounts: analytics.difficultyCounts,
        streak: analytics.streak,
        acceptanceRate: analytics.acceptanceRate,
        totalSubmissions: analytics.totalSubmissions,
        acceptedSubmissions: analytics.acceptedSubmissions,
        xp: analytics.xp,
        rank: analytics.rank,
        totalRankedUsers: analytics.totalRankedUsers,
        roadmapCompletion: analytics.roadmapCompletion,
        recentSubmissions: analytics.recentSubmissions,
        weeklyActivity: analytics.weeklyActivity,
        weakTopics: analytics.weakTopics,
        recommendedTopic,
        recommendedProblems: recommendation?.recommendedProblems || [],
        dailyChallenge,
        revisionReminders,
      },
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Failed to load dashboard stats',
    });
  }
}

/**
 * GET /api/v1/progress/performance
 * Returns detailed analytics: overview, difficulty, topic-wise, language-wise,
 * weekly & monthly activity, verdict distribution, XP growth, achievements,
 * daily challenge & revision summaries, and paginated/filtered submission history.
 */
export async function getPerformanceReport(req, res) {
  try {
    const userId = req.user?._id || req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const range = String(req.query?.range || 'all').toLowerCase();
    const page = Math.max(1, parseInt(req.query?.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query?.limit, 10) || 10));
    const search = String(req.query?.search || '').trim().toLowerCase();
    const languageFilter = String(req.query?.language || 'all').trim().toLowerCase();
    const verdictFilter = String(req.query?.verdict || 'all').trim().toLowerCase();
    const sortBy = String(req.query?.sortBy || 'newest').trim().toLowerCase();

    const XPEventModel = await resolveModel(['XPEvent'], [() => import('../models/XPEvent.js')]);
    const ChallengeAttemptModel = await resolveModel(
      ['ChallengeAttempt'],
      [() => import('../models/ChallengeAttempt.js')]
    );
    const RevisionModel = await resolveModel(['Revision'], [() => import('../models/Revision.js')]);

    const [analytics, xpEvents, challengeAttempts, revisions, achievements, recommendation] =
      await Promise.all([
        computeAnalyticsData(userId, range),
        XPEventModel
          ? XPEventModel.find({ user: userId }).sort({ createdAt: 1 }).lean()
          : [],
        ChallengeAttemptModel
          ? ChallengeAttemptModel.find({ user: userId })
              .populate('problem', 'title slug difficulty')
              .sort({ date: -1 })
              .limit(30)
              .lean()
          : [],
        RevisionModel ? RevisionModel.find({ user: userId }).lean() : [],
        checkAndAwardAchievements(userId)
          .catch(() => [])
          .then(() => getUserAchievementsWithProgress(userId).catch(() => [])),
        getNextRecommendation(userId).catch(() => null),
      ]);

    // Average runtime across accepted submissions + verdict distribution + active days
    let acceptedRuntimeSum = 0;
    let acceptedRuntimeCount = 0;
    const verdictMap = new Map();
    const activeDaySet = new Set();

    for (const sub of analytics.submissions) {
      const v = sub.verdict || sub.status || 'Pending';
      verdictMap.set(v, (verdictMap.get(v) || 0) + 1);
      const ts = sub.createdAt || sub.submittedAt;
      if (ts) {
        const dStr = getISTDateString(ts);
        if (dStr) activeDaySet.add(dStr);
      }
      if (v === 'Accepted' && typeof sub.runtime === 'number' && sub.runtime >= 0) {
        acceptedRuntimeSum += sub.runtime;
        acceptedRuntimeCount += 1;
      }
    }

    const averageRuntimeMs =
      acceptedRuntimeCount > 0 ? Math.round(acceptedRuntimeSum / acceptedRuntimeCount) : 0;

    // XP growth over time (cumulative)
    let runningXp = 0;
    const xpByDayMap = new Map();
    for (const ev of xpEvents) {
      const dStr = getISTDateString(ev.createdAt) || 'Unknown';
      runningXp += Number(ev.amount || 0);
      xpByDayMap.set(dStr, {
        date: dStr,
        xp: runningXp,
        delta: (xpByDayMap.get(dStr)?.delta || 0) + Number(ev.amount || 0),
      });
    }
    const xpGrowth = Array.from(xpByDayMap.values()).slice(-30);

    // Revision & Daily Challenge summaries
    const now = new Date();
    const revisionStats = {
      total: revisions.length,
      completed: revisions.filter((r) => r.revisionStatus === 'completed').length,
      dueToday: revisions.filter(
        (r) =>
          r.revisionStatus !== 'completed' &&
          (!r.nextRevisionDate || new Date(r.nextRevisionDate) <= now)
      ).length,
    };
    const dailyChallengeStats = {
      completed: challengeAttempts.filter((a) => a.isCompleted).length,
      totalAttempts: challengeAttempts.length,
      totalXp: challengeAttempts.reduce((s, a) => s + (a.xpAwarded ? a.xpAmount || 20 : 0), 0),
      recent: challengeAttempts.slice(0, 7).map((a) => ({
        date: a.dateKey || getISTDateString(a.date),
        title: a.problem?.title || 'Daily Challenge',
        slug: a.problem?.slug || '',
        difficulty: a.problem?.difficulty || 'Easy',
        completed: Boolean(a.isCompleted),
        xpAwarded: a.xpAwarded ? a.xpAmount || 20 : 0,
      })),
    };

    const problemsByDifficulty = [
      {
        name: 'Easy',
        difficulty: 'Easy',
        solved: analytics.difficultyCounts.easy,
        total: analytics.difficultyCounts.totalAvailable.easy,
      },
      {
        name: 'Medium',
        difficulty: 'Medium',
        solved: analytics.difficultyCounts.medium,
        total: analytics.difficultyCounts.totalAvailable.medium,
      },
      {
        name: 'Hard',
        difficulty: 'Hard',
        solved: analytics.difficultyCounts.hard,
        total: analytics.difficultyCounts.totalAvailable.hard,
      },
    ];

    const languageDistribution = analytics.languageWiseStats.map((l) => ({
      language: l.language,
      name: l.language,
      count: l.totalSubmissions,
      accepted: l.acceptedSubmissions,
      solved: l.problemsSolved,
      acceptanceRate: l.acceptanceRate,
    }));

    const topicPerformance = analytics.topicWisePerformance.map((t) => ({
      id: t.topicId,
      slug: t.topicId,
      name: t.topicName,
      topicName: t.topicName,
      solved: t.problemsSolved,
      attempts: t.totalSubmissions,
      accepted: t.acceptedSubmissions,
      acceptanceRate: t.acceptanceRate,
    }));

    const verdictDistribution = Array.from(verdictMap.entries()).map(([verdict, count]) => ({
      verdict,
      count,
    }));

    // Filter & paginate user's own private submissions
    const filteredSubs = analytics.submissions.filter((sub) => {
      const title = String(sub.problem?.title || '').toLowerCase();
      const lang = String(sub.language || '').toLowerCase();
      const verd = String(sub.verdict || sub.status || '').toLowerCase();
      if (search && !title.includes(search) && !lang.includes(search) && !verd.includes(search)) {
        return false;
      }
      if (languageFilter !== 'all' && lang !== languageFilter) return false;
      if (verdictFilter !== 'all' && verd !== verdictFilter) return false;
      return true;
    });

    if (sortBy === 'oldest') {
      filteredSubs.sort(
        (a, b) =>
          new Date(a.submittedAt || a.createdAt).getTime() -
          new Date(b.submittedAt || b.createdAt).getTime()
      );
    } else if (sortBy === 'runtime') {
      filteredSubs.sort((a, b) => (a.runtime ?? 0) - (b.runtime ?? 0));
    }

    const totalSubsFiltered = filteredSubs.length;
    const pagedSubs = filteredSubs.slice((page - 1) * limit, page * limit).map((sub) => ({
      id: String(sub._id),
      problemId: String(sub.problem?._id || sub.problem || ''),
      problemSlug: sub.problem?.slug || '',
      problemTitle: sub.problem?.title || 'Problem',
      difficulty: sub.problem?.difficulty || 'Easy',
      language: sub.language || 'python',
      verdict: sub.verdict || sub.status || 'Pending',
      passedTestCases: sub.passedTestCases ?? 0,
      totalTestCases: sub.totalTestCases ?? 0,
      runtime: sub.runtime ?? 0,
      memory: sub.memory ?? 0,
      submittedAt: sub.submittedAt || sub.createdAt,
      code: sub.code || '',
      errorMessage: sub.errorMessage || '',
      compilerOutput: sub.compilerOutput || '',
    }));

    return res.status(200).json({
      success: true,
      data: {
        range,
        userName: analytics.user.name || 'Student',
        preferredLanguage: analytics.user.preferredLanguage || 'cpp',
        overview: {
          totalSolved: analytics.totalSolved,
          totalSubmissions: analytics.totalSubmissions,
          acceptedSubmissions: analytics.acceptedSubmissions,
          incorrectSubmissions: Math.max(
            0,
            analytics.totalSubmissions - analytics.acceptedSubmissions
          ),
          acceptanceRate: analytics.acceptanceRate,
          currentStreak: analytics.streak.current,
          longestStreak: analytics.streak.longest,
          averageRuntime: acceptedRuntimeCount > 0 ? `${averageRuntimeMs} ms` : '—',
          activeDays: activeDaySet.size,
          xp: analytics.xp,
          rank: analytics.rank,
          totalRankedUsers: analytics.totalRankedUsers,
        },
        summary: {
          totalSolved: analytics.totalSolved,
          totalSubmissions: analytics.totalSubmissions,
          acceptedSubmissions: analytics.acceptedSubmissions,
          acceptanceRate: analytics.acceptanceRate,
          xp: analytics.xp,
          rank: analytics.rank,
          streak: analytics.streak,
          difficultyCounts: analytics.difficultyCounts,
        },
        problemsByDifficulty,
        languageDistribution,
        topicPerformance,
        topicWisePerformance: analytics.topicWisePerformance,
        languageWiseStats: analytics.languageWiseStats,
        weeklyActivity: analytics.weeklyActivity,
        monthlyActivity: analytics.monthlyActivity,
        monthlyCalendar: analytics.monthlyActivity,
        verdictDistribution,
        xpGrowth,
        roadmapCompletion: analytics.roadmapCompletion,
        dailyChallengeStats,
        revisionStats,
        achievements,
        recommendedNext: recommendation
          ? {
              topicTitle: recommendation.topic?.title || null,
              topicSlug: recommendation.topic?.slug || null,
              reason: recommendation.reason || '',
            }
          : null,
        strongTopics: analytics.strongTopics.map((t) => ({
          id: t.topicId,
          slug: t.topicId,
          name: t.topicName,
          solved: t.problemsSolved,
          attempts: t.totalSubmissions,
          acceptanceRate: t.acceptanceRate,
        })),
        weakTopics: analytics.weakTopics.map((t) => ({
          id: t.topicId,
          slug: t.topicId,
          name: t.topicName,
          solved: t.problemsSolved,
          attempts: t.totalSubmissions,
          acceptanceRate: t.acceptanceRate,
        })),
        submissionHistory: {
          items: pagedSubs,
          pagination: {
            page,
            limit,
            total: totalSubsFiltered,
            totalPages: Math.max(1, Math.ceil(totalSubsFiltered / limit)),
          },
        },
      },
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Failed to generate performance report',
    });
  }
}

/**
 * GET /api/progress/export
 * Generates downloadable CSV data containing summary metrics, topic breakdown,
 * language stats, and submission history in Asia/Kolkata dates.
 */
export async function exportReport(req, res) {
  try {
    const userId = req.user?._id || req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const range = String(req.query?.range || 'all').toLowerCase();
    const analytics = await computeAnalyticsData(userId, range);
    const todayIST = getISTDateString();

    const headers = [
      'Section',
      'Date (IST)',
      'Item',
      'Topic',
      'Difficulty',
      'Language',
      'Status',
      'Accepted',
      'Total',
      'Accuracy (%)',
    ];

    const rows = [headers];

    // Student & Report Metadata (no emails/credentials)
    rows.push([
      'Report Info',
      todayIST,
      analytics.user?.name || 'Student',
      `Period: ${range}`,
      'All',
      analytics.user?.preferredLanguage || 'cpp',
      'Generated',
      analytics.totalSolved,
      analytics.totalSubmissions,
      analytics.acceptanceRate,
    ]);

    // Summary rows
    rows.push([
      'Summary',
      todayIST,
      'Total Problems Solved',
      'All',
      `Easy:${analytics.difficultyCounts.easy} Medium:${analytics.difficultyCounts.medium} Hard:${analytics.difficultyCounts.hard}`,
      'All',
      'Active',
      analytics.acceptedSubmissions,
      analytics.totalSubmissions,
      analytics.acceptanceRate,
    ]);
    rows.push([
      'Summary',
      todayIST,
      'XP & Global Rank',
      'All',
      'All',
      'All',
      `Rank ${analytics.rank ?? 'N/A'}`,
      analytics.xp,
      analytics.totalRankedUsers,
      analytics.roadmapCompletion.percentage,
    ]);
    rows.push([
      'Summary',
      todayIST,
      'Roadmap Completion',
      `${analytics.roadmapCompletion.completedTopics}/${analytics.roadmapCompletion.totalTopics} concepts`,
      'All',
      'All',
      `${analytics.roadmapCompletion.percentage}%`,
      analytics.roadmapCompletion.completedTopics,
      analytics.roadmapCompletion.totalTopics,
      analytics.roadmapCompletion.percentage,
    ]);
    rows.push([
      'Summary',
      todayIST,
      'Coding Streak',
      'All',
      'All',
      'All',
      `Current:${analytics.streak.current}d / Longest:${analytics.streak.longest}d`,
      analytics.streak.current,
      analytics.streak.longest,
      '',
    ]);

    // Strong & Weak Topics
    for (const st of analytics.strongTopics) {
      rows.push([
        'Strong Topic',
        todayIST,
        st.topicName,
        st.topicName,
        'All',
        'All',
        `Solved ${st.problemsSolved}`,
        st.acceptedSubmissions,
        st.totalSubmissions,
        st.acceptanceRate,
      ]);
    }
    for (const wt of analytics.weakTopics) {
      rows.push([
        'Needs Improvement',
        todayIST,
        wt.topicName,
        wt.topicName,
        'All',
        'All',
        `Failed ${wt.failedSubmissions}`,
        wt.acceptedSubmissions,
        wt.totalSubmissions,
        wt.acceptanceRate,
      ]);
    }

    // Topic-wise performance rows
    for (const topic of analytics.topicWisePerformance) {
      rows.push([
        'Topic',
        todayIST,
        topic.topicName,
        topic.topicName,
        'All',
        'All',
        `Solved ${topic.problemsSolved}/${topic.problemsAttempted}`,
        topic.acceptedSubmissions,
        topic.totalSubmissions,
        topic.acceptanceRate,
      ]);
    }

    // Language-wise stats rows
    for (const lang of analytics.languageWiseStats) {
      rows.push([
        'Language',
        todayIST,
        lang.language,
        'All',
        'All',
        lang.language,
        `Solved ${lang.problemsSolved}`,
        lang.acceptedSubmissions,
        lang.totalSubmissions,
        lang.acceptanceRate,
      ]);
    }

    // Submission history rows
    for (const sub of analytics.submissions) {
      const prob = sub.problem || {};
      const topicLabel = Array.isArray(prob.topics) && prob.topics.length > 0
        ? prob.topics.map((t) => t?.title || t?.name || t).join('; ')
        : prob.topic?.title || prob.topic?.name || prob.topic || '';

      const subVerdict = sub.verdict || sub.status || '';
      rows.push([
        'Submission',
        getISTDateString(sub.createdAt || sub.submittedAt) || '',
        prob.title || 'Problem',
        topicLabel,
        prob.difficulty || '',
        sub.language || '',
        subVerdict,
        subVerdict === 'Accepted' ? 1 : 0,
        1,
        subVerdict === 'Accepted' ? 100 : 0,
      ]);
    }

    const csvContent = rows.map((row) => row.map(escapeCsvCell).join(',')).join('\r\n');

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="codeclimb-progress-report-${todayIST}.csv"`
    );

    return res.status(200).send(csvContent);
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Failed to export progress report',
    });
  }
}

export default {
  getDashboardStats,
  getPerformanceReport,
  exportReport,
};
