import mongoose from 'mongoose';
import { resolveModel } from '../services/recommendationService.js';
import { XP_VALUES } from '../config/constants.js';
import { awardXP, checkAndAwardAchievements } from '../services/xpService.js';

/**
 * Daily Challenge Controller for CodeClimb
 *
 * All date calculations are standardized to the `Asia/Kolkata` (IST, UTC+05:30)
 * timezone to prevent UTC midnight drift.
 *
 * DSA Usage:
 * 1. Hash Set Consecutive Sequence Algorithm (`calculateStreakFromDates`):
 *    Stores unique active IST calendar dates (`YYYY-MM-DD`) in a `Set<string>`
 *    for O(1) membership lookups. Computes:
 *      - Current streak by walking backward day-by-day from today/yesterday IST.
 *      - Longest streak in O(N) time (analogous to Longest Consecutive Sequence)
 *        by only expanding forward from sequence start dates (`!set.has(prevDay)`).
 *    Time complexity: O(N), Space complexity: O(N), where N = active days.
 *
 * 2. Atomic Conditional Updates for Idempotency:
 *    Prevents duplicate XP grants under concurrent requests via MongoDB atomic
 *    conditional `$ne` filter on `completedBy`.
 */

export const IST_TIMEZONE = 'Asia/Kolkata';

const istDateFormatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: IST_TIMEZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

/**
 * Format a Date (or timestamp) as `YYYY-MM-DD` in `Asia/Kolkata` timezone.
 */
export function getISTDateString(date = new Date()) {
  const d = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(d.getTime())) return null;
  return istDateFormatter.format(d);
}

/**
 * Shift a `YYYY-MM-DD` calendar string by `deltaDays` (e.g., -1 for yesterday).
 * Uses UTC calendar arithmetic to avoid local timezone / DST anomalies.
 */
export function shiftISTDateString(dateStr, deltaDays) {
  const [year, month, day] = dateStr.split('-').map(Number);
  const shifted = new Date(Date.UTC(year, month - 1, day + deltaDays));
  const y = shifted.getUTCFullYear();
  const m = String(shifted.getUTCMonth() + 1).padStart(2, '0');
  const d = String(shifted.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function getPreviousISTDateString(dateStr, daysBack = 1) {
  return shiftISTDateString(dateStr, -daysBack);
}

/**
 * Return exact UTC Date range [start, end] corresponding to `dateStr` in Asia/Kolkata (+05:30).
 */
export function getISTDayRange(dateStr) {
  const start = new Date(`${dateStr}T00:00:00.000+05:30`);
  const end = new Date(`${dateStr}T23:59:59.999+05:30`);
  return { start, end };
}

function isValidDateString(dateStr) {
  if (typeof dateStr !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return false;
  }
  const [y, m, d] = dateStr.split('-').map(Number);
  const check = new Date(Date.UTC(y, m - 1, d));
  return (
    check.getUTCFullYear() === y &&
    check.getUTCMonth() + 1 === m &&
    check.getUTCDate() === d
  );
}

/**
 * Inspect whether DailyChallenge.date is stored as Date or String and build query.
 */
function isDateFieldTypedAsDate(Model) {
  return Model?.schema?.path('date')?.instance === 'Date';
}

function buildDateQuery(DailyChallengeModel, dateStr) {
  if (isDateFieldTypedAsDate(DailyChallengeModel)) {
    const { start, end } = getISTDayRange(dateStr);
    return { date: { $gte: start, $lte: end } };
  }
  return { date: dateStr };
}

function toStoredDateValue(DailyChallengeModel, dateStr) {
  if (isDateFieldTypedAsDate(DailyChallengeModel)) {
    return getISTDayRange(dateStr).start;
  }
  return dateStr;
}

function challengeDateToISTString(dateVal) {
  if (!dateVal) return null;
  if (typeof dateVal === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateVal)) {
    return dateVal;
  }
  return getISTDateString(dateVal);
}

function extractUserStatusFromChallenge(challenge, userId) {
  const uid = String(userId);
  const completedBy = Array.isArray(challenge?.completedBy) ? challenge.completedBy : [];
  const attempts = Array.isArray(challenge?.attempts) ? challenge.attempts : [];

  const completedEntry = completedBy.find((entry) => {
    if (!entry) return false;
    if (typeof entry === 'object' && entry.user) {
      return String(entry.user._id || entry.user) === uid;
    }
    return String(entry._id || entry) === uid;
  });

  const userAttempts = attempts.filter((entry) => {
    if (!entry) return false;
    const entryUid = entry.user?._id || entry.user || entry;
    return String(entryUid) === uid;
  });

  return {
    attempted: Boolean(completedEntry) || userAttempts.length > 0,
    completed: Boolean(completedEntry),
    completedAt: completedEntry?.completedAt || null,
    xpAwarded: completedEntry?.xpAwarded || (completedEntry ? challenge.xpReward || 50 : 0),
    attemptCount: userAttempts.length,
  };
}

/**
 * Pure O(N) Hash-Set algorithm to compute coding streaks from daily activity dates.
 *
 * @param {Array<Date|string>} rawDates Array of activity timestamps or IST date strings
 * @param {string} referenceDateStr IST `YYYY-MM-DD` date string (defaults to today IST)
 * @returns {{ currentStreak: number, longestStreak: number, lastActivityDate: string|null, activityDates: string[] }}
 */
export function calculateStreakFromDates(rawDates = [], referenceDateStr = getISTDateString()) {
  const activitySet = new Set();

  for (const item of rawDates) {
    if (!item) continue;
    const istStr =
      typeof item === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(item)
        ? item
        : getISTDateString(item);
    if (istStr) {
      activitySet.add(istStr);
    }
  }

  if (activitySet.size === 0) {
    return {
      currentStreak: 0,
      longestStreak: 0,
      lastActivityDate: null,
      activityDates: [],
    };
  }

  // 1. Current streak: active if user coded today IST or yesterday IST
  const yesterdayStr = getPreviousISTDateString(referenceDateStr, 1);
  let currentStreak = 0;
  let cursor = activitySet.has(referenceDateStr)
    ? referenceDateStr
    : activitySet.has(yesterdayStr)
      ? yesterdayStr
      : null;

  while (cursor && activitySet.has(cursor)) {
    currentStreak += 1;
    cursor = getPreviousISTDateString(cursor, 1);
  }

  // 2. Longest streak in O(N): only scan forward from sequence heads (!set.has(prevDay))
  let longestStreak = 0;
  let lastActivityDate = null;

  for (const dateStr of activitySet) {
    if (!lastActivityDate || dateStr > lastActivityDate) {
      lastActivityDate = dateStr;
    }

    const prevDay = getPreviousISTDateString(dateStr, 1);
    if (!activitySet.has(prevDay)) {
      let runLength = 1;
      let nextDay = shiftISTDateString(dateStr, 1);
      while (activitySet.has(nextDay)) {
        runLength += 1;
        nextDay = shiftISTDateString(nextDay, 1);
      }
      if (runLength > longestStreak) {
        longestStreak = runLength;
      }
    }
  }

  const activityDates = Array.from(activitySet).sort();

  return {
    currentStreak,
    longestStreak,
    lastActivityDate,
    activityDates,
  };
}

/**
 * Calculate and persist a user's coding streak from consecutive IST daily activity dates.
 * Aggregates activity across Submissions, DailyChallenge completions, and User.activityDates.
 *
 * @param {string|import('mongoose').Types.ObjectId} userId
 */
export async function updateStreak(userId) {
  if (!userId) {
    throw new Error('User ID is required to update streak');
  }

  const UserModel = await resolveModel(['User'], [() => import('../models/User.js')]);
  const SubmissionModel = await resolveModel(
    ['Submission'],
    [() => import('../models/Submission.js')]
  );
  const DailyChallengeModel = await resolveModel(
    ['DailyChallenge'],
    [() => import('../models/DailyChallenge.js')]
  );

  const user = UserModel ? await UserModel.findById(userId).lean() : null;
  if (UserModel && !user) {
    const err = new Error('User not found');
    err.statusCode = 404;
    throw err;
  }

  const rawDates = [];

  if (Array.isArray(user?.activityDates)) {
    rawDates.push(...user.activityDates);
  }
  if (user?.lastActivityDate) {
    rawDates.push(user.lastActivityDate);
  }

  if (SubmissionModel) {
    const subs = await SubmissionModel.find({
      $or: [{ user: userId }, { userId }],
    })
      .select('createdAt submittedAt')
      .lean();
    for (const sub of subs) {
      if (sub.createdAt || sub.submittedAt) {
        rawDates.push(sub.createdAt || sub.submittedAt);
      }
    }
  }

  if (DailyChallengeModel) {
    const completedChallenges = await DailyChallengeModel.find({
      $or: [{ 'completedBy.user': userId }, { completedBy: userId }],
    })
      .select('date completedBy')
      .lean();

    const uid = String(userId);
    for (const ch of completedChallenges) {
      const entry = (ch.completedBy || []).find(
        (item) => String(item?.user || item) === uid
      );
      if (entry?.completedAt) {
        rawDates.push(entry.completedAt);
      } else if (ch.date) {
        rawDates.push(ch.date);
      }
    }
  }

  const streakResult = calculateStreakFromDates(rawDates, getISTDateString());

  if (UserModel) {
    const updateDoc = {
      longestStreak: Math.max(
        streakResult.longestStreak,
        user?.longestStreak ?? user?.streak?.longest ?? 0
      ),
      lastActivityDate: streakResult.lastActivityDate
        ? getISTDayRange(streakResult.lastActivityDate).start
        : user?.lastActivityDate || null,
    };

    const streakPath = UserModel.schema?.path('streak');
    const hasNestedCurrent = Boolean(UserModel.schema?.path('streak.current'));

    if (hasNestedCurrent || (user?.streak && typeof user.streak === 'object')) {
      updateDoc.streak = {
        current: streakResult.currentStreak,
        longest: updateDoc.longestStreak,
        lastActivityDate: updateDoc.lastActivityDate,
      };
    } else if (!streakPath || streakPath.instance === 'Number') {
      updateDoc.streak = streakResult.currentStreak;
      updateDoc.currentStreak = streakResult.currentStreak;
    }

    if (UserModel.schema?.path('activityDates')) {
      updateDoc.activityDates = streakResult.activityDates;
    }

    await UserModel.findByIdAndUpdate(userId, { $set: updateDoc });
  }

  return streakResult;
}

/**
 * Helper to assign a daily challenge for a given IST date (`YYYY-MM-DD`).
 * Used by both admin HTTP endpoint and automated cron jobs.
 */
export async function assignChallengeForDate({
  date,
  problemId,
  xpReward = 50,
  assignedBy = null,
}) {
  const DailyChallengeModel = await resolveModel(
    ['DailyChallenge'],
    [() => import('../models/DailyChallenge.js')]
  );
  const ProblemModel = await resolveModel(['Problem'], [() => import('../models/Problem.js')]);

  if (!DailyChallengeModel || !ProblemModel) {
    const err = new Error('DailyChallenge or Problem model is not registered');
    err.statusCode = 500;
    throw err;
  }

  const targetDate = date ? String(date).trim() : getISTDateString();
  if (!isValidDateString(targetDate)) {
    const err = new Error('Invalid date format. Expected YYYY-MM-DD (Asia/Kolkata).');
    err.statusCode = 400;
    throw err;
  }

  if (!problemId || !mongoose.Types.ObjectId.isValid(problemId)) {
    const err = new Error('A valid problemId is required');
    err.statusCode = 400;
    throw err;
  }

  const problem = await ProblemModel.findById(problemId).lean();
  if (!problem) {
    const err = new Error('Problem not found');
    err.statusCode = 404;
    throw err;
  }

  // Prevent duplicate assignment for the same IST date
  const existing = await DailyChallengeModel.findOne(
    buildDateQuery(DailyChallengeModel, targetDate)
  ).lean();

  if (existing) {
    const err = new Error(`A daily challenge is already assigned for ${targetDate}`);
    err.statusCode = 409;
    throw err;
  }

  try {
    const created = await DailyChallengeModel.create({
      date: toStoredDateValue(DailyChallengeModel, targetDate),
      problem: problem._id,
      xpReward: Number(xpReward) > 0 ? Number(xpReward) : 50,
      assignedBy: assignedBy || undefined,
      completedBy: [],
      attempts: [],
    });

    return await DailyChallengeModel.findById(created._id)
      .populate('problem', 'title slug difficulty topic tags xpReward')
      .lean();
  } catch (error) {
    if (error.code === 11000) {
      const err = new Error(`A daily challenge is already assigned for ${targetDate}`);
      err.statusCode = 409;
      throw err;
    }
    throw error;
  }
}

const CHALLENGE_BONUS_XP = XP_VALUES.dailyChallenge || 20;

async function ensureGlobalDailyChallenge(DailyChallengeModel, ProblemModel, dateStr) {
  const dateQuery = buildDateQuery(DailyChallengeModel, dateStr);
  let challenge = await DailyChallengeModel.findOne(dateQuery)
    .populate({
      path: 'problem',
      select: 'title slug difficulty description topics tags',
      populate: { path: 'topics', select: 'title slug' },
    })
    .lean();

  if (challenge) return challenge;

  const recentChallenges = await DailyChallengeModel.find({})
    .sort({ date: -1 })
    .limit(30)
    .select('problem')
    .lean();
  const recentProblemIds = recentChallenges.map((c) => c.problem).filter(Boolean);

  let candidates = await ProblemModel.find({
    _id: { $nin: recentProblemIds },
    isArchived: { $ne: true },
  })
    .select('_id difficulty')
    .lean();

  if (candidates.length === 0) {
    candidates = await ProblemModel.find({ isArchived: { $ne: true } })
      .select('_id difficulty')
      .lean();
  }
  if (candidates.length === 0) return null;

  const dateHash = dateStr.split('').reduce((acc, ch) => (acc * 31 + ch.charCodeAt(0)) >>> 0, 0);
  const selectedProblem = candidates[dateHash % candidates.length];

  try {
    const created = await DailyChallengeModel.create({
      date: toStoredDateValue(DailyChallengeModel, dateStr),
      problem: selectedProblem._id,
      difficulty: selectedProblem.difficulty || 'Easy',
    });
    challenge = await DailyChallengeModel.findById(created._id)
      .populate({
        path: 'problem',
        select: 'title slug difficulty description topics tags',
        populate: { path: 'topics', select: 'title slug' },
      })
      .lean();
  } catch (createErr) {
    if (createErr.code === 11000) {
      challenge = await DailyChallengeModel.findOne(dateQuery)
        .populate({
          path: 'problem',
          select: 'title slug difficulty description topics tags',
          populate: { path: 'topics', select: 'title slug' },
        })
        .lean();
    } else {
      throw createErr;
    }
  }
  return challenge;
}

async function selectPersonalizedProblemForUser(userId, dateStr, preference = 'Auto') {
  const ProblemModel = await resolveModel(['Problem'], [() => import('../models/Problem.js')]);
  const SubmissionModel = await resolveModel(['Submission'], [() => import('../models/Submission.js')]);
  const UserProgressModel = await resolveModel(['UserProgress'], [() => import('../models/UserProgress.js')]);
  const ChallengeAttemptModel = await resolveModel(
    ['ChallengeAttempt'],
    [() => import('../models/ChallengeAttempt.js')]
  );

  if (!ProblemModel) return null;

  const [acceptedSubs, progressDocs, recentAttempts] = await Promise.all([
    SubmissionModel
      ? SubmissionModel.find({
          user: userId,
          $or: [{ verdict: 'Accepted' }, { status: 'Accepted' }],
        })
          .select('problem')
          .lean()
      : [],
    UserProgressModel
      ? UserProgressModel.find({ user: userId, isCompleted: true }).select('topic').lean()
      : [],
    ChallengeAttemptModel
      ? ChallengeAttemptModel.find({ user: userId })
          .sort({ date: -1 })
          .limit(30)
          .select('problem')
          .lean()
      : [],
  ]);

  const solvedSet = new Set(acceptedSubs.map((s) => String(s.problem)).filter(Boolean));
  const completedTopicSet = new Set(progressDocs.map((p) => String(p.topic)).filter(Boolean));
  const recentAttemptSet = new Set(recentAttempts.map((a) => String(a.problem)).filter(Boolean));

  // Determine target difficulty: explicit Easy/Medium/Hard preference, or Auto from progress
  let targetDifficulty = null;
  if (['Easy', 'Medium', 'Hard'].includes(preference)) {
    targetDifficulty = preference;
  } else {
    if (solvedSet.size < 5) targetDifficulty = 'Easy';
    else if (solvedSet.size < 20) targetDifficulty = 'Medium';
    else targetDifficulty = 'Hard';
  }

  const allProblems = await ProblemModel.find({ isArchived: { $ne: true } })
    .select('_id title slug difficulty topics order')
    .sort({ order: 1 })
    .lean();

  if (allProblems.length === 0) return null;

  // Filter cascade: (1) preferred difficulty + not recently challenged + unsolved
  // -> (2) preferred difficulty + not recently challenged
  // -> (3) preferred difficulty
  // -> (4) any unsolved + not recently challenged -> (5) allProblems
  const notRecent = allProblems.filter((p) => !recentAttemptSet.has(String(p._id)));
  const byDiff = (list) => list.filter((p) => p.difficulty === targetDifficulty);
  const unsolved = (list) => list.filter((p) => !solvedSet.has(String(p._id)));

  let pool = unsolved(byDiff(notRecent));
  if (pool.length === 0) pool = byDiff(notRecent);
  if (pool.length === 0) pool = byDiff(allProblems);
  if (pool.length === 0) pool = unsolved(notRecent);
  if (pool.length === 0) pool = notRecent;
  if (pool.length === 0) pool = allProblems;

  // Prefer problems whose topics overlap with topics the student has learned
  if (completedTopicSet.size > 0) {
    const topicMatched = pool.filter(
      (p) =>
        Array.isArray(p.topics) && p.topics.some((t) => completedTopicSet.has(String(t)))
    );
    if (topicMatched.length > 0) {
      pool = topicMatched;
    }
  }

  const seed = `${String(userId)}:${dateStr}`;
  const hash = seed.split('').reduce((acc, ch) => (acc * 31 + ch.charCodeAt(0)) >>> 0, 0);
  return pool[hash % pool.length];
}

/**
 * Complete today's daily coding challenge automatically when a student's submission
 * achieves a verified `Accepted` verdict through Judge0.
 * Awards 20 bonus XP at most once using an atomic conditional update.
 */
export async function completeDailyChallengeFromSubmission(userId, problemId, submissionId) {
  const ChallengeAttemptModel = await resolveModel(
    ['ChallengeAttempt'],
    [() => import('../models/ChallengeAttempt.js')]
  );
  const DailyChallengeModel = await resolveModel(
    ['DailyChallenge'],
    [() => import('../models/DailyChallenge.js')]
  );
  const ProblemModel = await resolveModel(['Problem'], [() => import('../models/Problem.js')]);

  if (!ChallengeAttemptModel || !DailyChallengeModel || !ProblemModel) {
    return { completed: false, xpAwarded: 0 };
  }

  const todayIST = getISTDateString();
  const pidStr = String(problemId);

  let attempt = await ChallengeAttemptModel.findOne({ user: userId, dateKey: todayIST }).lean();

  if (!attempt) {
    const globalDaily = await ensureGlobalDailyChallenge(DailyChallengeModel, ProblemModel, todayIST);
    if (!globalDaily) return { completed: false, xpAwarded: 0 };
    const globalPid = String(globalDaily.problem?._id || globalDaily.problem || '');
    if (globalPid !== pidStr) {
      return { completed: false, xpAwarded: 0 };
    }
    try {
      attempt = await ChallengeAttemptModel.create({
        user: userId,
        dailyChallenge: globalDaily._id,
        problem: problemId,
        date: getISTDayRange(todayIST).start,
        dateKey: todayIST,
        difficultyPreference: 'Auto',
        isCompleted: false,
        xpAwarded: false,
      });
    } catch (err) {
      if (err.code === 11000) {
        attempt = await ChallengeAttemptModel.findOne({ user: userId, dateKey: todayIST }).lean();
      } else {
        throw err;
      }
    }
  }

  const assignedPid = String(attempt?.problem?._id || attempt?.problem || '');
  if (!attempt || assignedPid !== pidStr) {
    return { completed: false, xpAwarded: 0 };
  }

  const now = new Date();
  // Atomic conditional update guarantees 20 bonus XP is awarded at most once
  const updated = await ChallengeAttemptModel.findOneAndUpdate(
    {
      _id: attempt._id,
      user: userId,
      dateKey: todayIST,
      isCompleted: false,
      xpAwarded: false,
    },
    {
      $set: {
        isCompleted: true,
        completedAt: now,
        xpAwarded: true,
        xpAmount: CHALLENGE_BONUS_XP,
        submission: submissionId || null,
      },
    },
    { new: true }
  ).lean();

  if (!updated) {
    return { completed: true, xpAwarded: 0, duplicatePrevented: true };
  }

  await awardXP(
    userId,
    CHALLENGE_BONUS_XP,
    'daily_challenge',
    updated._id,
    `Daily Challenge (${todayIST})`
  );
  await checkAndAwardAchievements(userId);
  await updateStreak(userId);

  return { completed: true, xpAwarded: CHALLENGE_BONUS_XP, duplicatePrevented: false };
}

/**
 * Get or deterministically assign today's personalized daily challenge for a user.
 * Shared by `getTodayChallenge` and `progressController.getDashboardStats`.
 */
export async function getOrAssignUserTodayChallenge(userId, preference = 'Auto') {
  const DailyChallengeModel = await resolveModel(
    ['DailyChallenge'],
    [() => import('../models/DailyChallenge.js')]
  );
  const ProblemModel = await resolveModel(['Problem'], [() => import('../models/Problem.js')]);
  const ChallengeAttemptModel = await resolveModel(
    ['ChallengeAttempt'],
    [() => import('../models/ChallengeAttempt.js')]
  );

  if (!DailyChallengeModel || !ProblemModel) return null;

  const todayIST = getISTDateString();
  const globalChallenge = await ensureGlobalDailyChallenge(
    DailyChallengeModel,
    ProblemModel,
    todayIST
  );
  if (!globalChallenge) return null;

  const normalizedPref = ['Easy', 'Medium', 'Hard', 'Auto'].includes(preference)
    ? preference
    : 'Auto';

  let attempt = null;
  if (userId && ChallengeAttemptModel) {
    attempt = await ChallengeAttemptModel.findOne({ user: userId, dateKey: todayIST })
      .populate({
        path: 'problem',
        select: 'title slug difficulty description topics tags',
        populate: { path: 'topics', select: 'title slug' },
      })
      .lean();

    if (!attempt) {
      const chosen = await selectPersonalizedProblemForUser(userId, todayIST, normalizedPref);
      const chosenId = chosen?._id || globalChallenge.problem?._id || globalChallenge.problem;

      try {
        const created = await ChallengeAttemptModel.create({
          user: userId,
          dailyChallenge: globalChallenge._id,
          problem: chosenId,
          date: getISTDayRange(todayIST).start,
          dateKey: todayIST,
          difficultyPreference: normalizedPref,
          isCompleted: false,
          xpAwarded: false,
        });
        attempt = await ChallengeAttemptModel.findById(created._id)
          .populate({
            path: 'problem',
            select: 'title slug difficulty description topics tags',
            populate: { path: 'topics', select: 'title slug' },
          })
          .lean();
      } catch (err) {
        if (err.code === 11000) {
          attempt = await ChallengeAttemptModel.findOne({ user: userId, dateKey: todayIST })
            .populate({
              path: 'problem',
              select: 'title slug difficulty description topics tags',
              populate: { path: 'topics', select: 'title slug' },
            })
            .lean();
        } else {
          throw err;
        }
      }
    }
  }

  return {
    todayIST,
    globalChallenge,
    attempt,
    problem: attempt?.problem || globalChallenge.problem,
    normalizedPref,
  };
}

/**
 * GET /api/v1/daily-challenges/today
 * Get or create today's personalized daily challenge in Asia/Kolkata timezone.
 * Once assigned for a dateKey (YYYY-MM-DD IST), the same problem persists across
 * refreshes and server restarts.
 */
export async function getTodayChallenge(req, res) {
  try {
    const userId = req.user?._id || req.user?.id;
    const rawPref = String(req.query?.difficulty || '').trim();
    const resolved = await getOrAssignUserTodayChallenge(userId, rawPref);

    if (!resolved) {
      return res.status(404).json({
        success: false,
        message: 'No problems available to create today’s daily challenge',
      });
    }

    const { todayIST, globalChallenge, attempt, problem, normalizedPref } = resolved;
    const streak = userId ? await updateStreak(userId) : { currentStreak: 0, longestStreak: 0 };

    return res.status(200).json({
      success: true,
      data: {
        _id: attempt?._id || globalChallenge._id,
        dailyChallengeId: globalChallenge._id,
        date: todayIST,
        timezone: IST_TIMEZONE,
        problem,
        difficulty: problem?.difficulty || globalChallenge.difficulty || 'Easy',
        difficultyPreference: attempt?.difficultyPreference || normalizedPref,
        xpReward: CHALLENGE_BONUS_XP,
        completed: Boolean(attempt?.isCompleted),
        completedAt: attempt?.completedAt || null,
        xpAwarded: attempt?.xpAwarded ? attempt?.xpAmount || CHALLENGE_BONUS_XP : 0,
        streak,
        userStatus: {
          attempted: Boolean(attempt?.submission || attempt?.isCompleted),
          completed: Boolean(attempt?.isCompleted),
          completedAt: attempt?.completedAt || null,
          xpAwarded: attempt?.xpAwarded ? attempt?.xpAmount || CHALLENGE_BONUS_XP : 0,
        },
      },
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Failed to fetch today’s daily challenge',
    });
  }
}

/**
 * POST /api/v1/daily-challenges/attempt
 * Verify a Judge0 Accepted submission for today's daily challenge and award 20 bonus XP once.
 * Manual completion without a verified Accepted submission is rejected.
 */
export async function attemptChallenge(req, res) {
  try {
    const userId = req.user?._id || req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const SubmissionModel = await resolveModel(
      ['Submission'],
      [() => import('../models/Submission.js')]
    );
    const { submissionId } = req.body || {};

    if (!submissionId || !mongoose.Types.ObjectId.isValid(submissionId)) {
      return res.status(400).json({
        success: false,
        message: 'A verified Judge0 submissionId is required to complete the daily challenge',
      });
    }

    const sub = await SubmissionModel.findById(submissionId).lean();
    if (!sub) {
      return res.status(404).json({ success: false, message: 'Submission not found' });
    }
    if (String(sub.user?._id || sub.user) !== String(userId)) {
      return res.status(403).json({
        success: false,
        message: 'Submission does not belong to the authenticated user',
      });
    }

    const verdict = sub.verdict || sub.status;
    if (verdict !== 'Accepted') {
      return res.status(400).json({
        success: false,
        message: 'Only verified Accepted submissions can complete the daily challenge',
      });
    }

    const result = await completeDailyChallengeFromSubmission(userId, sub.problem, sub._id);
    const streak = await updateStreak(userId);

    return res.status(200).json({
      success: true,
      data: {
        date: getISTDateString(),
        completed: result.completed,
        xpAwarded: result.xpAwarded,
        duplicatePrevented: Boolean(result.duplicatePrevented),
        streak,
      },
      message: result.duplicatePrevented
        ? 'Daily challenge already completed today; duplicate bonus XP prevented.'
        : result.completed
          ? `Daily challenge completed! Earned ${result.xpAwarded} bonus XP.`
          : 'Accepted submission does not match today’s assigned daily challenge.',
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Failed to verify daily challenge attempt',
    });
  }
}

/**
 * GET /api/v1/daily-challenges/history
 * Return past & today's daily challenges (in Asia/Kolkata) for the authenticated user.
 */
export async function getChallengeHistory(req, res) {
  try {
    const userId = req.user?._id || req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const ChallengeAttemptModel = await resolveModel(
      ['ChallengeAttempt'],
      [() => import('../models/ChallengeAttempt.js')]
    );
    const DailyChallengeModel = await resolveModel(
      ['DailyChallenge'],
      [() => import('../models/DailyChallenge.js')]
    );

    const page = Math.max(1, parseInt(req.query?.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query?.limit, 10) || 30));
    const skip = (page - 1) * limit;

    const [attempts, totalAttempts] = ChallengeAttemptModel
      ? await Promise.all([
          ChallengeAttemptModel.find({ user: userId })
            .populate({
              path: 'problem',
              select: 'title slug difficulty topics tags',
              populate: { path: 'topics', select: 'title slug' },
            })
            .sort({ date: -1 })
            .skip(skip)
            .limit(limit)
            .lean(),
          ChallengeAttemptModel.countDocuments({ user: userId }),
        ])
      : [[], 0];

    const todayIST = getISTDateString();
    const seenDates = new Set(attempts.map((a) => a.dateKey || challengeDateToISTString(a.date)));

    let items = attempts.map((a) => ({
      _id: a._id,
      date: a.dateKey || challengeDateToISTString(a.date),
      problem: a.problem,
      difficulty: a.problem?.difficulty || 'Easy',
      xpReward: CHALLENGE_BONUS_XP,
      completed: Boolean(a.isCompleted),
      isMissed: !a.isCompleted && (a.dateKey || challengeDateToISTString(a.date)) < todayIST,
      completedAt: a.completedAt || null,
      xpAwarded: a.xpAwarded ? a.xpAmount || CHALLENGE_BONUS_XP : 0,
    }));

    // Include any past global daily challenges the user missed (for optional practice)
    if (DailyChallengeModel && items.length < limit) {
      const globalHistory = await DailyChallengeModel.find({})
        .populate({
          path: 'problem',
          select: 'title slug difficulty topics tags',
          populate: { path: 'topics', select: 'title slug' },
        })
        .sort({ date: -1 })
        .limit(limit)
        .lean();

      for (const ch of globalHistory) {
        const dStr = challengeDateToISTString(ch.date);
        if (!dStr || seenDates.has(dStr)) continue;
        seenDates.add(dStr);
        items.push({
          _id: ch._id,
          date: dStr,
          problem: ch.problem,
          difficulty: ch.problem?.difficulty || ch.difficulty || 'Easy',
          xpReward: CHALLENGE_BONUS_XP,
          completed: false,
          isMissed: dStr < todayIST,
          completedAt: null,
          xpAwarded: 0,
        });
      }
      items.sort((a, b) => String(b.date).localeCompare(String(a.date)));
      items = items.slice(0, limit);
    }

    const totalXpEarned = items.reduce((sum, item) => sum + (item.xpAwarded || 0), 0);

    return res.status(200).json({
      success: true,
      data: items,
      totalXpEarned,
      pagination: {
        page,
        limit,
        total: Math.max(totalAttempts, items.length),
        totalPages: Math.ceil(Math.max(totalAttempts, items.length) / limit),
      },
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Failed to fetch daily challenge history',
    });
  }
}

/**
 * POST /api/daily-challenge/assign
 * Admin (or cron) endpoint to assign a specific problem for a given IST date,
 * rejecting duplicates for that date.
 */
export async function assignDailyChallenge(req, res) {
  try {
    const { date, problemId, xpReward } = req.body || {};
    const assignedBy = req.user?._id || req.user?.id || null;

    const challenge = await assignChallengeForDate({
      date,
      problemId,
      xpReward,
      assignedBy,
    });

    // Record audit entry when invoked by an admin user
    if (assignedBy) {
      try {
        const { logAdminAction } = await import('./adminController.js');
        await logAdminAction(
          assignedBy,
          'ASSIGN_DAILY_CHALLENGE',
          'DailyChallenge',
          challenge._id,
          {
            date: challengeDateToISTString(challenge.date),
            problemId,
            xpReward: challenge.xpReward,
          }
        );
      } catch {
        // Non-fatal if audit logger is unavailable
      }
    }

    return res.status(201).json({
      success: true,
      data: {
        ...challenge,
        date: challengeDateToISTString(challenge.date),
      },
      message: 'Daily challenge assigned successfully',
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Failed to assign daily challenge',
    });
  }
}

export default {
  getTodayChallenge,
  attemptChallenge,
  getChallengeHistory,
  assignDailyChallenge,
  assignChallengeForDate,
  updateStreak,
  calculateStreakFromDates,
  getISTDateString,
  getPreviousISTDateString,
  getISTDayRange,
};
