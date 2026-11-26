import mongoose from 'mongoose';
import User from '../models/User.js';
import XPEvent from '../models/XPEvent.js';
import Achievement from '../models/Achievement.js';
import UserAchievement from '../models/UserAchievement.js';
import Submission from '../models/Submission.js';
import Problem from '../models/Problem.js';
import Revision from '../models/Revision.js';
import UserProgress from '../models/UserProgress.js';
import ChallengeAttempt from '../models/ChallengeAttempt.js';
import ApiError from '../utils/ApiError.js';
import { VERDICTS, XP_SOURCES } from '../config/constants.js';

const SOURCE_ALIASES = Object.freeze({
  problem: 'problem',
  problem_solved: 'problem',
  problems: 'problem',
  daily_challenge: 'daily_challenge',
  dailychallenge: 'daily_challenge',
  achievement: 'achievement',
  achievements: 'achievement',
});

const XP_PER_LEVEL = 100;

const normalizeSource = (source) => {
  const key = String(source || '').trim().toLowerCase();
  const normalized = SOURCE_ALIASES[key];
  if (!normalized || !XP_SOURCES.includes(normalized)) {
    throw new ApiError(
      400,
      `Invalid XP source '${source}'. Allowed sources: ${XP_SOURCES.join(', ')}`
    );
  }
  return normalized;
};

const computeLevelStats = (totalXP = 0) => {
  const safeXP = Math.max(0, Number(totalXP) || 0);
  const level = Math.floor(safeXP / XP_PER_LEVEL) + 1;
  const xpIntoCurrentLevel = safeXP % XP_PER_LEVEL;
  const xpToNextLevel = XP_PER_LEVEL - xpIntoCurrentLevel;
  return { level, xpIntoCurrentLevel, xpForNextLevel: XP_PER_LEVEL, xpToNextLevel };
};

/**
 * Resolve sourceId into a valid MongoDB ObjectId when possible, or return null + fallback key.
 */
const resolveSourceId = async (normalizedSource, sourceId) => {
  if (!sourceId) {
    return { objectId: null, stringTag: null };
  }

  if (sourceId instanceof mongoose.Types.ObjectId) {
    return { objectId: sourceId, stringTag: null };
  }

  const str = String(sourceId).trim();
  if (mongoose.isValidObjectId(str)) {
    return { objectId: new mongoose.Types.ObjectId(str), stringTag: null };
  }

  if (normalizedSource === 'achievement') {
    const ach = await Achievement.findOne({ key: str.toLowerCase() }).select('_id').lean();
    if (ach?._id) {
      return { objectId: ach._id, stringTag: null };
    }
  }

  return { objectId: null, stringTag: str };
};

/**
 * Award XP to a user, create an XPEvent, and update user.xp atomically.
 * Prevents duplicate awards for the same (user, source, sourceId) pair.
 */
export const awardXP = async (userId, amount, source, sourceId = null, description = '') => {
  if (!userId || !mongoose.isValidObjectId(userId)) {
    throw new ApiError(400, 'Valid userId is required to award XP.');
  }

  const numericAmount = Number(amount);
  if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
    throw new ApiError(400, 'XP amount must be a positive number.');
  }

  const normalizedSource = normalizeSource(source);
  const { objectId: resolvedSourceId, stringTag } = await resolveSourceId(
    normalizedSource,
    sourceId
  );

  const trimmedDescription = String(description || '').trim();
  const effectiveDescription =
    stringTag && !trimmedDescription.includes(stringTag)
      ? `${trimmedDescription ? `${trimmedDescription} ` : ''}[${stringTag}]`
      : trimmedDescription;

  // Duplicate prevention when sourceId is provided
  if (resolvedSourceId) {
    const existing = await XPEvent.findOne({
      user: userId,
      source: normalizedSource,
      sourceId: resolvedSourceId,
    }).lean();

    if (existing) {
      const currentUser = await User.findById(userId).select('xp').lean();
      return {
        awarded: false,
        duplicate: true,
        amount: 0,
        xpEvent: existing,
        totalXP: currentUser?.xp ?? 0,
      };
    }
  } else if (stringTag) {
    const existingByTag = await XPEvent.findOne({
      user: userId,
      source: normalizedSource,
      description: effectiveDescription,
    }).lean();

    if (existingByTag) {
      const currentUser = await User.findById(userId).select('xp').lean();
      return {
        awarded: false,
        duplicate: true,
        amount: 0,
        xpEvent: existingByTag,
        totalXP: currentUser?.xp ?? 0,
      };
    }
  }

  const userExists = await User.exists({ _id: userId });
  if (!userExists) {
    throw new ApiError(404, 'User not found.');
  }

  let xpEvent;
  try {
    xpEvent = await XPEvent.create({
      user: userId,
      amount: numericAmount,
      source: normalizedSource,
      sourceId: resolvedSourceId,
      description: effectiveDescription,
    });
  } catch (err) {
    if (err.code === 11000) {
      const currentUser = await User.findById(userId).select('xp').lean();
      return {
        awarded: false,
        duplicate: true,
        amount: 0,
        xpEvent: null,
        totalXP: currentUser?.xp ?? 0,
      };
    }
    throw err;
  }

  const updatedUser = await User.findByIdAndUpdate(
    userId,
    { $inc: { xp: numericAmount } },
    { new: true }
  ).select('xp currentStreak longestStreak');

  return {
    awarded: true,
    duplicate: false,
    amount: numericAmount,
    xpEvent,
    user: updatedUser,
    totalXP: updatedUser?.xp ?? numericAmount,
  };
};

/**
 * Retrieve total XP, level info, breakdown by XP source, and recent XP events for a user.
 */
export const getUserXP = async (userId) => {
  if (!userId || !mongoose.isValidObjectId(userId)) {
    throw new ApiError(400, 'Valid userId is required.');
  }

  const user = await User.findById(userId).select('xp currentStreak longestStreak').lean();
  if (!user) {
    throw new ApiError(404, 'User not found.');
  }

  const userObjectId = new mongoose.Types.ObjectId(userId);

  const [sourceAggregation, recentEvents, achievementsCount] = await Promise.all([
    XPEvent.aggregate([
      { $match: { user: userObjectId } },
      {
        $group: {
          _id: '$source',
          totalXP: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
    ]),
    XPEvent.find({ user: userObjectId }).sort({ createdAt: -1 }).limit(20).lean(),
    UserAchievement.countDocuments({ user: userObjectId }),
  ]);

  const breakdown = {
    problem: { totalXP: 0, count: 0 },
    daily_challenge: { totalXP: 0, count: 0 },
    achievement: { totalXP: 0, count: 0 },
  };

  let eventTotalXP = 0;
  for (const row of sourceAggregation) {
    eventTotalXP += row.totalXP;
    if (breakdown[row._id]) {
      breakdown[row._id] = { totalXP: row.totalXP, count: row.count };
    } else {
      breakdown[row._id] = { totalXP: row.totalXP, count: row.count };
    }
  }

  const totalXP = user.xp ?? eventTotalXP;
  const levelStats = computeLevelStats(totalXP);

  return {
    totalXP,
    eventTotalXP,
    ...levelStats,
    breakdown,
    recentEvents,
    achievementsCount,
  };
};

/**
 * Gather comprehensive user statistics used for achievement criteria checks.
 */
const getUserAchievementStats = async (userId, user) => {
  const userObjectId = new mongoose.Types.ObjectId(userId);

  const [
    acceptedSubs,
    totalSubmissions,
    revisionsCompleted,
    topicsCompleted,
    dailyChallengesCompleted,
  ] = await Promise.all([
    Submission.find({
      user: userObjectId,
      $or: [{ verdict: VERDICTS.ACCEPTED }, { status: VERDICTS.ACCEPTED }],
    })
      .select('problem language')
      .populate({
        path: 'problem',
        select: 'difficulty tags topics',
        populate: { path: 'topics', select: 'slug module', populate: { path: 'module', select: 'slug' } },
      })
      .lean(),
    Submission.countDocuments({ user: userObjectId }),
    Revision.countDocuments({ user: userObjectId, revisionStatus: 'completed' }),
    UserProgress.countDocuments({ user: userObjectId, isCompleted: true }),
    ChallengeAttempt.countDocuments({ user: userObjectId, isCompleted: true }),
  ]);

  const solvedProblemIdSet = new Set();
  const languagesUsedSet = new Set();
  const solvedDifficultyMap = new Map();
  const topicBucketProblems = {
    array: new Set(),
    string: new Set(),
    sorting: new Set(),
    recursion: new Set(),
    tree: new Set(),
    graph: new Set(),
    dp: new Set(),
  };

  for (const sub of acceptedSubs) {
    if (sub.language) languagesUsedSet.add(String(sub.language).toLowerCase());
    const prob = sub.problem && typeof sub.problem === 'object' ? sub.problem : null;
    const pid = String(prob?._id || sub.problem || '');
    if (!pid) continue;

    if (!solvedProblemIdSet.has(pid)) {
      solvedProblemIdSet.add(pid);
      if (prob?.difficulty) {
        solvedDifficultyMap.set(pid, String(prob.difficulty).toLowerCase());
      }
      const labels = [];
      if (Array.isArray(prob?.tags)) {
        for (const tag of prob.tags) labels.push(String(tag).toLowerCase());
      }
      if (Array.isArray(prob?.topics)) {
        for (const t of prob.topics) {
          if (t?.slug) labels.push(String(t.slug).toLowerCase());
          if (t?.module?.slug) labels.push(String(t.module.slug).toLowerCase());
        }
      }
      const joined = labels.join(' ');
      if (joined.includes('array')) topicBucketProblems.array.add(pid);
      if (joined.includes('string')) topicBucketProblems.string.add(pid);
      if (joined.includes('sort')) topicBucketProblems.sorting.add(pid);
      if (joined.includes('recurs')) topicBucketProblems.recursion.add(pid);
      if (joined.includes('tree') || joined.includes('bst')) topicBucketProblems.tree.add(pid);
      if (joined.includes('graph')) topicBucketProblems.graph.add(pid);
      if (joined.includes('dynamic') || joined.includes('dp')) topicBucketProblems.dp.add(pid);
    }
  }

  let easySolved = 0;
  let mediumSolved = 0;
  let hardSolved = 0;
  for (const diff of solvedDifficultyMap.values()) {
    if (diff === 'easy') easySolved += 1;
    else if (diff === 'medium') mediumSolved += 1;
    else if (diff === 'hard') hardSolved += 1;
  }

  return {
    problemsSolved: solvedProblemIdSet.size,
    easySolved,
    mediumSolved,
    hardSolved,
    totalSubmissions,
    acceptedSubmissions: acceptedSubs.length,
    languagesUsed: languagesUsedSet.size,
    revisionsCompleted,
    topicsCompleted,
    dailyChallengesCompleted,
    topicCounts: {
      array: topicBucketProblems.array.size,
      string: topicBucketProblems.string.size,
      sorting: topicBucketProblems.sorting.size,
      recursion: topicBucketProblems.recursion.size,
      tree: topicBucketProblems.tree.size,
      graph: topicBucketProblems.graph.size,
      dp: topicBucketProblems.dp.size,
    },
    xp: user.xp || 0,
    currentStreak: user.currentStreak || 0,
    longestStreak: Math.max(user.longestStreak || 0, user.currentStreak || 0),
  };
};

const getProgressValueForAchievement = (achievement, stats) => {
  const criteria = achievement?.criteria;
  if (!criteria || !criteria.type) return 0;
  const type = String(criteria.type).trim().toLowerCase();
  const key = String(achievement?.key || '').trim().toLowerCase();

  switch (type) {
    case 'problems_solved':
    case 'solved_count':
    case 'total_solved':
    case 'solve_count':
    case 'accepted_count':
      return stats.problemsSolved;
    case 'easy_solved':
      return stats.easySolved;
    case 'medium_solved':
      return stats.mediumSolved;
    case 'hard_solved':
    case 'difficulty_count':
      return stats.hardSolved;
    case 'submissions_count':
    case 'total_submissions':
      return stats.totalSubmissions;
    case 'accepted_submissions':
      return stats.acceptedSubmissions;
    case 'languages_used':
    case 'unique_languages':
    case 'language_count':
      return stats.languagesUsed;
    case 'revisions_completed':
    case 'revision_count':
      return stats.revisionsCompleted;
    case 'topics_completed':
      return stats.topicsCompleted;
    case 'topic_count': {
      if (key.includes('array')) return stats.topicCounts.array;
      if (key.includes('string')) return stats.topicCounts.string;
      if (key.includes('sort')) return stats.topicCounts.sorting;
      if (key.includes('recurs')) return stats.topicCounts.recursion;
      if (key.includes('tree')) return stats.topicCounts.tree;
      if (key.includes('graph')) return stats.topicCounts.graph;
      if (key.includes('dp') || key.includes('dynamic')) return stats.topicCounts.dp;
      return stats.problemsSolved;
    }
    case 'daily_challenges_completed':
    case 'daily_challenge_count':
    case 'daily_count':
      return stats.dailyChallengesCompleted;
    case 'xp':
    case 'total_xp':
      return stats.xp;
    case 'streak':
    case 'current_streak':
      return Math.max(stats.currentStreak, stats.longestStreak);
    case 'longest_streak':
      return stats.longestStreak;
    default:
      return 0;
  }
};

const evaluateCriteria = (achievement, stats) => {
  const threshold = Number(achievement?.criteria?.threshold ?? 1);
  return getProgressValueForAchievement(achievement, stats) >= threshold;
};

/**
 * Evaluate all Achievement criteria against the user's current stats and award any newly met ones.
 */
export const checkAndAwardAchievements = async (userId) => {
  if (!userId || !mongoose.isValidObjectId(userId)) {
    throw new ApiError(400, 'Valid userId is required.');
  }

  const user = await User.findById(userId)
    .select('xp currentStreak longestStreak')
    .lean();
  if (!user) {
    throw new ApiError(404, 'User not found.');
  }

  const [allAchievements, earnedRecords] = await Promise.all([
    Achievement.find({}).lean(),
    UserAchievement.find({ user: userId }).select('achievement').lean(),
  ]);

  if (allAchievements.length === 0) {
    return [];
  }

  const earnedSet = new Set(earnedRecords.map((r) => String(r.achievement)));
  const unearned = allAchievements.filter((a) => !earnedSet.has(String(a._id)));
  if (unearned.length === 0) {
    return [];
  }

  const stats = await getUserAchievementStats(userId, user);
  const newlyAwarded = [];

  for (const achievement of unearned) {
    if (!evaluateCriteria(achievement, stats)) {
      continue;
    }

    let userAchievement;
    try {
      userAchievement = await UserAchievement.create({
        user: userId,
        achievement: achievement._id,
        earnedAt: new Date(),
      });
    } catch (err) {
      // Concurrent call already awarded this achievement
      if (err.code === 11000) {
        continue;
      }
      throw err;
    }

    let xpAwarded = 0;
    if (achievement.xpReward > 0) {
      const xpResult = await awardXP(
        userId,
        achievement.xpReward,
        'achievement',
        achievement._id,
        `Unlocked achievement: ${achievement.title}`
      );
      xpAwarded = xpResult.amount || 0;
      stats.xp += xpAwarded;
    }

    newlyAwarded.push({
      achievement,
      userAchievement,
      xpAwarded,
    });
  }

  return newlyAwarded;
};

/**
 * Return all achievements annotated with earned status and progress towards threshold.
 */
export const getUserAchievementsWithProgress = async (userId) => {
  if (!userId || !mongoose.isValidObjectId(userId)) {
    throw new ApiError(400, 'Valid userId is required.');
  }

  const user = await User.findById(userId)
    .select('xp currentStreak longestStreak')
    .lean();
  if (!user) {
    throw new ApiError(404, 'User not found.');
  }

  const [allAchievements, earnedRecords, stats] = await Promise.all([
    Achievement.find({}).sort({ xpReward: 1, title: 1 }).lean(),
    UserAchievement.find({ user: userId }).lean(),
    getUserAchievementStats(userId, user),
  ]);

  const earnedMap = new Map(earnedRecords.map((r) => [String(r.achievement), r]));

  return allAchievements.map((ach) => {
    const earned = earnedMap.get(String(ach._id));
    const threshold = Number(ach.criteria?.threshold ?? 1);
    const currentProgress = getProgressValueForAchievement(ach, stats);
    const progressPct =
      threshold > 0 ? Math.min(100, Math.round((currentProgress / threshold) * 100)) : 100;

    return {
      _id: ach._id,
      key: ach.key,
      title: ach.title,
      description: ach.description,
      iconName: ach.iconName || 'Award',
      xpReward: ach.xpReward || 0,
      earned: Boolean(earned),
      earnedAt: earned?.earnedAt || null,
      progress: Math.min(currentProgress, threshold),
      threshold,
      progressPct: earned ? 100 : progressPct,
    };
  });
};

export default {
  awardXP,
  getUserXP,
  checkAndAwardAchievements,
  getUserAchievementsWithProgress,
};
