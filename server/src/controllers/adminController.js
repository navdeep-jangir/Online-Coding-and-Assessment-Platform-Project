import mongoose from 'mongoose';
import {
  getISTDateString,
  getPreviousISTDateString,
  getISTDayRange,
} from './dailyChallengeController.js';
import { getPerformanceReport, exportReport } from './progressController.js';
import { batchSubmit } from '../services/judge0Service.js';
import { detectCycle } from '../utils/dsaAlgorithms.js';
import { VERDICTS } from '../config/constants.js';

/**
 * Admin Controller for CodeClimb
 *
 * Provides platform-wide administrative metrics, user management (with
 * explicit confirmation and self-lockout protection), submission analytics,
 * and an immutable admin audit trail.
 *
 * DSA Usage:
 * 1. Hash Set (`Set<string>`):
 *    Deduplicates user IDs across Submissions, DailyChallenge completions,
 *    and login activity in O(N) time to compute exact Daily Active Users (DAU).
 *
 * 2. Hash Maps (`Map`) & IST Sliding Window Buckets:
 *    Aggregates submission status, language, difficulty, and daily trend
 *    statistics in O(S + D) single-pass time.
 */

const ALLOWED_USER_SORT_FIELDS = new Set([
  'createdAt',
  'xp',
  'name',
  'lastActiveAt',
  'lastLogin',
  'role',
]);

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

/**
 * Escape special RegExp characters to prevent ReDoS on user search queries.
 */
function escapeRegExp(str) {
  return String(str).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function sanitizeAuditDetails(details) {
  if (!details || typeof details !== 'object') return details ?? {};
  const forbidden = new Set(['password', 'token', 'jwt', 'secret', 'refreshToken']);
  const cleaned = {};
  for (const [key, val] of Object.entries(details)) {
    if (!forbidden.has(key)) {
      cleaned[key] = val;
    }
  }
  return cleaned;
}

/**
 * Create an admin audit log entry.
 *
 * @param {string|import('mongoose').Types.ObjectId} adminId
 * @param {string} action
 * @param {string} targetType
 * @param {string|import('mongoose').Types.ObjectId} targetId
 * @param {Object} details
 */
export async function logAdminAction(
  adminId,
  action,
  targetType,
  targetId,
  details = {}
) {
  const AuditLogModel = await resolveModel(
    ['AuditLog', 'AdminAuditLog', 'AdminLog'],
    [
      () => import('../models/AuditLog.js'),
      () => import('../models/AdminAuditLog.js'),
      () => import('../models/AdminLog.js'),
    ]
  );

  if (!AuditLogModel) {
    return null;
  }

  const sanitizedDetails = sanitizeAuditDetails(details);

  const payload = {
    admin: adminId,
    adminId,
    action: String(action || 'UNKNOWN_ACTION'),
    targetType: String(targetType || 'System'),
    targetId: targetId ? String(targetId) : undefined,
    details: sanitizedDetails,
  };

  // Support schemas expecting `targetId` as ObjectId vs String
  const targetPath = AuditLogModel.schema?.path('targetId');
  if (targetPath?.instance === 'ObjectId' && targetId && mongoose.Types.ObjectId.isValid(targetId)) {
    payload.targetId = new mongoose.Types.ObjectId(targetId);
  }

  try {
    return await AuditLogModel.create(payload);
  } catch {
    return null;
  }
}

/**
 * GET /api/admin/stats
 * Platform-wide admin dashboard metrics: total users, total problems,
 * total submissions, and Daily Active Users (DAU) for today in Asia/Kolkata.
 */
export async function getDashboardStats(req, res) {
  try {
    const UserModel = await resolveModel(['User'], [() => import('../models/User.js')]);
    const ProblemModel = await resolveModel(['Problem'], [() => import('../models/Problem.js')]);
    const SubmissionModel = await resolveModel(
      ['Submission'],
      [() => import('../models/Submission.js')]
    );
    const DailyChallengeModel = await resolveModel(
      ['DailyChallenge'],
      [() => import('../models/DailyChallenge.js')]
    );

    if (!UserModel) {
      return res.status(500).json({ success: false, message: 'User model is unavailable' });
    }

    const todayIST = getISTDateString();
    const { start: todayStartUTC, end: todayEndUTC } = getISTDayRange(todayIST);
    const ModuleModel = await resolveModel(['Module'], [() => import('../models/Module.js')]);
    const TopicModel = await resolveModel(['Topic'], [() => import('../models/Topic.js')]);
    const ChallengeAttemptModel = await resolveModel(
      ['ChallengeAttempt'],
      [() => import('../models/ChallengeAttempt.js')]
    );

    const [
      totalUsers,
      totalStudents,
      activeUsers,
      inactiveUsers,
      totalProblems,
      problemList,
      totalModules,
      totalConcepts,
      totalSubmissions,
      acceptedSubmissions,
      allSubsLangs,
      recentRegistrations,
      recentSubmissions,
      todaySubmissions,
      recentlyLoggedInUsers,
      todayChallenges,
      todayAttempts,
    ] = await Promise.all([
      UserModel.countDocuments({}),
      UserModel.countDocuments({ role: 'student' }),
      UserModel.countDocuments({ isActive: { $ne: false } }),
      UserModel.countDocuments({ isActive: false }),
      ProblemModel ? ProblemModel.countDocuments({ isArchived: { $ne: true } }) : 0,
      ProblemModel ? ProblemModel.find({ isArchived: { $ne: true } }).select('difficulty').lean() : [],
      ModuleModel ? ModuleModel.countDocuments({}) : 0,
      TopicModel ? TopicModel.countDocuments({}) : 0,
      SubmissionModel ? SubmissionModel.countDocuments({}) : 0,
      SubmissionModel
        ? SubmissionModel.countDocuments({
            $or: [{ verdict: 'Accepted' }, { status: 'Accepted' }],
          })
        : 0,
      SubmissionModel ? SubmissionModel.find({}).select('language').lean() : [],
      UserModel.find({ role: 'student' })
        .select('name collegeName preferredLanguage xp isActive createdAt')
        .sort({ createdAt: -1 })
        .limit(6)
        .lean(),
      SubmissionModel
        ? SubmissionModel.find({})
            .populate('user', 'name')
            .populate('problem', 'title slug difficulty')
            .select('user problem language verdict status passedTestCases totalTestCases runtime memory submittedAt createdAt')
            .sort({ submittedAt: -1, createdAt: -1 })
            .limit(8)
            .lean()
        : [],
      SubmissionModel
        ? SubmissionModel.find({
            createdAt: { $gte: todayStartUTC, $lte: todayEndUTC },
          })
            .select('user userId')
            .lean()
        : [],
      UserModel.find({
        $or: [
          { lastActiveAt: { $gte: todayStartUTC, $lte: todayEndUTC } },
          { lastLogin: { $gte: todayStartUTC, $lte: todayEndUTC } },
        ],
      })
        .select('_id')
        .lean(),
      DailyChallengeModel
        ? DailyChallengeModel.find({
            $or: [
              { date: todayIST },
              { date: { $gte: todayStartUTC, $lte: todayEndUTC } },
            ],
          })
            .select('completedBy attempts')
            .lean()
        : [],
      ChallengeAttemptModel
        ? ChallengeAttemptModel.find({ dateKey: todayIST }).select('user isCompleted').lean()
        : [],
    ]);

    // Hash Set for O(N) distinct Daily Active Users computation
    const dauSet = new Set();
    for (const sub of todaySubmissions) {
      const uid = sub.user?._id || sub.user || sub.userId;
      if (uid) dauSet.add(String(uid));
    }
    for (const u of recentlyLoggedInUsers) {
      if (u._id) dauSet.add(String(u._id));
    }
    for (const ch of todayChallenges) {
      for (const c of ch.completedBy || []) {
        const uid = c?.user?._id || c?.user || c;
        if (uid) dauSet.add(String(uid));
      }
      for (const a of ch.attempts || []) {
        const uid = a?.user?._id || a?.user || a;
        if (uid) dauSet.add(String(uid));
      }
    }
    for (const att of todayAttempts) {
      if (att.user) dauSet.add(String(att.user));
    }

    const langCountMap = new Map();
    for (const s of allSubsLangs) {
      const lang = String(s.language || 'unknown').toLowerCase();
      langCountMap.set(lang, (langCountMap.get(lang) || 0) + 1);
    }

    const problemsByDifficulty = { easy: 0, medium: 0, hard: 0 };
    for (const p of problemList) {
      const diff = String(p.difficulty || 'easy').toLowerCase();
      if (diff === 'medium' || diff === 'intermediate') problemsByDifficulty.medium += 1;
      else if (diff === 'hard' || diff === 'advanced') problemsByDifficulty.hard += 1;
      else problemsByDifficulty.easy += 1;
    }

    const acceptanceRate =
      totalSubmissions > 0
        ? Number(((acceptedSubmissions / totalSubmissions) * 100).toFixed(2))
        : 0;

    // Live Judge0 health check (non-blocking 2s timeout)
    let judge0Health = { status: 'unknown', url: process.env.JUDGE0_API_URL || '' };
    if (process.env.JUDGE0_API_URL) {
      try {
        const ctrl = new AbortController();
        const timer = setTimeout(() => ctrl.abort(), 2000);
        const hRes = await fetch(`${process.env.JUDGE0_API_URL.replace(/\/$/, '')}/about`, {
          signal: ctrl.signal,
        });
        clearTimeout(timer);
        judge0Health = {
          status: hRes.ok ? 'healthy' : 'degraded',
          httpStatus: hRes.status,
          url: process.env.JUDGE0_API_URL,
        };
      } catch {
        judge0Health = { status: 'unreachable', url: process.env.JUDGE0_API_URL };
      }
    }

    return res.status(200).json({
      success: true,
      data: {
        totalUsers,
        totalStudents,
        activeUsers,
        inactiveUsers,
        totalProblems,
        totalModules,
        totalConcepts,
        problemsByDifficulty,
        totalSubmissions,
        acceptedSubmissions,
        acceptanceRate,
        dailyActiveUsers: dauSet.size,
        submissionsToday: todaySubmissions.length,
        dailyChallengeParticipation: {
          assignedToday: todayAttempts.length,
          completedToday: todayAttempts.filter((a) => a.isCompleted).length,
        },
        languageDistribution: Array.from(langCountMap.entries()).map(([language, count]) => ({
          language,
          count,
        })),
        recentRegistrations,
        recentSubmissions: recentSubmissions.map((s) => ({
          _id: s._id,
          userName: s.user?.name || 'Student',
          problemTitle: s.problem?.title || 'Problem',
          problemSlug: s.problem?.slug || '',
          difficulty: s.problem?.difficulty || 'Easy',
          language: s.language,
          verdict: s.verdict || s.status || 'Pending',
          passedTestCases: s.passedTestCases ?? 0,
          totalTestCases: s.totalTestCases ?? 0,
          runtime: s.runtime ?? 0,
          submittedAt: s.submittedAt || s.createdAt,
        })),
        judge0Health,
        dateIST: todayIST,
      },
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Failed to fetch admin dashboard stats',
    });
  }
}

/**
 * GET /api/admin/users
 * List users with role/status filters, search (name/email), sorting, and pagination.
 */
export async function getUsers(req, res) {
  try {
    const UserModel = await resolveModel(['User'], [() => import('../models/User.js')]);
    if (!UserModel) {
      return res.status(500).json({ success: false, message: 'User model is unavailable' });
    }

    const {
      search,
      role,
      isActive,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = req.query || {};

    const page = Math.max(1, parseInt(req.query?.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query?.limit, 10) || 20));
    const skip = (page - 1) * limit;

    const query = {};

    if (role && ['student', 'user', 'admin'].includes(String(role).toLowerCase())) {
      query.role = String(role).toLowerCase();
    }

    if (isActive === 'true' || isActive === true) {
      query.isActive = true;
    } else if (isActive === 'false' || isActive === false) {
      query.isActive = false;
    }

    if (typeof search === 'string' && search.trim().length > 0) {
      const safeRegex = new RegExp(escapeRegExp(search.trim()), 'i');
      query.$or = [{ name: safeRegex }, { email: safeRegex }, { username: safeRegex }];
    }

    const safeSortBy = ALLOWED_USER_SORT_FIELDS.has(String(sortBy))
      ? String(sortBy)
      : 'createdAt';
    const safeSortDir = String(sortOrder).toLowerCase() === 'asc' ? 1 : -1;

    const [users, total] = await Promise.all([
      UserModel.find(query)
        .select('-password -resetPasswordToken -resetPasswordExpire')
        .sort({ [safeSortBy]: safeSortDir })
        .skip(skip)
        .limit(limit)
        .lean(),
      UserModel.countDocuments(query),
    ]);

    return res.status(200).json({
      success: true,
      data: users,
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
      message: error.message || 'Failed to fetch users',
    });
  }
}

/**
 * PUT /api/admin/users/:id/deactivate
 * Deactivate a user account (`isActive = false`) after verifying explicit confirmation.
 * Records an admin audit trail entry.
 */
export async function deactivateUser(req, res) {
  try {
    const adminId = req.user?._id || req.user?.id;
    const { id } = req.params || {};
    const { confirm, confirmed, confirmation, reason } = req.body || {};

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid user ID' });
    }

    // Require explicit confirmation to prevent accidental account deactivation
    const isConfirmed =
      confirm === true ||
      confirm === 'true' ||
      confirmed === true ||
      confirmed === 'true' ||
      String(confirmation || '').toUpperCase() === 'CONFIRM';

    if (!isConfirmed) {
      return res.status(400).json({
        success: false,
        message: 'Explicit confirmation is required to deactivate a user (pass { confirm: true })',
      });
    }

    if (adminId && String(adminId) === String(id)) {
      return res.status(400).json({
        success: false,
        message: 'Admins cannot deactivate their own account',
      });
    }

    const UserModel = await resolveModel(['User'], [() => import('../models/User.js')]);
    if (!UserModel) {
      return res.status(500).json({ success: false, message: 'User model is unavailable' });
    }

    const targetUser = await UserModel.findById(id).select(
      '-password -resetPasswordToken -resetPasswordExpire'
    );

    if (!targetUser) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const wasActive = targetUser.isActive !== false;
    targetUser.isActive = false;
    if (reason && UserModel.schema?.path('deactivationReason')) {
      targetUser.deactivationReason = String(reason).trim();
    }
    if (UserModel.schema?.path('deactivatedAt')) {
      targetUser.deactivatedAt = new Date();
    }

    await targetUser.save();

    await logAdminAction(adminId, 'DEACTIVATE_USER', 'User', targetUser._id, {
      reason: reason ? String(reason).trim() : undefined,
      wasActive,
      targetName: targetUser.name,
      targetEmail: targetUser.email,
    });

    return res.status(200).json({
      success: true,
      data: targetUser,
      message: wasActive
        ? 'User deactivated successfully'
        : 'User is already deactivated',
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Failed to deactivate user',
    });
  }
}

/**
 * GET /api/admin/submissions
 * Platform-wide submission analytics: status distribution, language breakdown,
 * difficulty breakdown, acceptance rate, and daily IST submission trend.
 */
export async function getSubmissionStats(req, res) {
  try {
    const SubmissionModel = await resolveModel(
      ['Submission'],
      [() => import('../models/Submission.js')]
    );

    if (!SubmissionModel) {
      return res.status(500).json({
        success: false,
        message: 'Submission model is unavailable',
      });
    }

    const days = Math.min(365, Math.max(1, parseInt(req.query?.days, 10) || 30));
    const todayIST = getISTDateString();
    const startDateIST = getPreviousISTDateString(todayIST, days - 1);
    const windowStartUTC = getISTDayRange(startDateIST).start;

    const filter = { createdAt: { $gte: windowStartUTC } };
    if (req.query?.status) {
      const st = String(req.query.status).trim();
      filter.$or = [{ verdict: st }, { status: st }];
    }
    if (req.query?.language) {
      filter.language = String(req.query.language).trim().toLowerCase();
    }
    const page = Math.max(1, parseInt(req.query?.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query?.limit, 10) || 20));
    const search = String(req.query?.search || '').trim().toLowerCase();

    const submissions = await SubmissionModel.find(filter)
      .populate('user', 'name')
      .populate('problem', 'title slug difficulty')
      .select('user verdict status language problem createdAt submittedAt runtime memory passedTestCases totalTestCases')
      .sort({ submittedAt: -1, createdAt: -1 })
      .lean();

    const statusMap = new Map();
    const languageMap = new Map();
    const difficultyMap = new Map([
      ['easy', { difficulty: 'easy', total: 0, accepted: 0 }],
      ['medium', { difficulty: 'medium', total: 0, accepted: 0 }],
      ['hard', { difficulty: 'hard', total: 0, accepted: 0 }],
    ]);

    const dailyMap = new Map();
    const orderedDates = [];
    for (let i = days - 1; i >= 0; i -= 1) {
      const d = getPreviousISTDateString(todayIST, i);
      orderedDates.push(d);
      dailyMap.set(d, { date: d, total: 0, accepted: 0 });
    }

    let acceptedCount = 0;
    let internalErrorCount = 0;
    const filteredList = [];

    for (const sub of submissions) {
      const status = sub.verdict || sub.status || 'Unknown';
      const isAccepted = status === 'Accepted';
      if (isAccepted) acceptedCount += 1;
      if (status === 'Internal Error') internalErrorCount += 1;

      if (search) {
        const uName = String(sub.user?.name || '').toLowerCase();
        const pTitle = String(sub.problem?.title || '').toLowerCase();
        if (!uName.includes(search) && !pTitle.includes(search)) {
          // Still count in aggregate stats, exclude from filtered list
        } else {
          filteredList.push(sub);
        }
      } else {
        filteredList.push(sub);
      }

      statusMap.set(status, (statusMap.get(status) || 0) + 1);

      const lang = String(sub.language || 'unknown').toLowerCase();
      if (!languageMap.has(lang)) {
        languageMap.set(lang, { language: lang, total: 0, accepted: 0 });
      }
      const langEntry = languageMap.get(lang);
      langEntry.total += 1;
      if (isAccepted) langEntry.accepted += 1;

      const rawDiff = String(sub.problem?.difficulty || 'easy').toLowerCase();
      const diffKey =
        rawDiff === 'medium' || rawDiff === 'intermediate'
          ? 'medium'
          : rawDiff === 'hard' || rawDiff === 'advanced'
            ? 'hard'
            : 'easy';
      const diffEntry = difficultyMap.get(diffKey);
      diffEntry.total += 1;
      if (isAccepted) diffEntry.accepted += 1;

      const istDate = getISTDateString(sub.createdAt);
      const dayBucket = dailyMap.get(istDate);
      if (dayBucket) {
        dayBucket.total += 1;
        if (isAccepted) dayBucket.accepted += 1;
      }
    }

    const totalSubmissions = submissions.length;
    const acceptanceRate =
      totalSubmissions > 0
        ? Number(((acceptedCount / totalSubmissions) * 100).toFixed(2))
        : 0;

    return res.status(200).json({
      success: true,
      data: {
        windowDays: days,
        totalSubmissions,
        acceptedSubmissions: acceptedCount,
        acceptanceRate,
        statusBreakdown: Array.from(statusMap.entries()).map(([status, count]) => ({
          status,
          count,
          percentage:
            totalSubmissions > 0
              ? Number(((count / totalSubmissions) * 100).toFixed(2))
              : 0,
        })),
        languageStats: Array.from(languageMap.values())
          .map((item) => ({
            ...item,
            acceptanceRate:
              item.total > 0
                ? Number(((item.accepted / item.total) * 100).toFixed(2))
                : 0,
          }))
          .sort((a, b) => b.total - a.total),
        difficultyStats: Array.from(difficultyMap.values()).map((item) => ({
          ...item,
          acceptanceRate:
            item.total > 0
              ? Number(((item.accepted / item.total) * 100).toFixed(2))
              : 0,
        })),
        dailyTrend: orderedDates.map((d) => dailyMap.get(d)),
        internalErrorCount,
        submissions: filteredList.slice((page - 1) * limit, page * limit).map((s) => ({
          _id: s._id,
          studentName: s.user?.name || 'Student',
          problemTitle: s.problem?.title || 'Problem',
          problemSlug: s.problem?.slug || '',
          difficulty: s.problem?.difficulty || 'Easy',
          language: s.language,
          verdict: s.verdict || s.status || 'Pending',
          passedTestCases: s.passedTestCases ?? 0,
          totalTestCases: s.totalTestCases ?? 0,
          runtime: s.runtime ?? 0,
          memory: s.memory ?? 0,
          submittedAt: s.submittedAt || s.createdAt,
        })),
        pagination: {
          page,
          limit,
          total: filteredList.length,
          totalPages: Math.max(1, Math.ceil(filteredList.length / limit)),
        },
      },
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Failed to compute submission statistics',
    });
  }
}

/**
 * GET /api/admin/audit-log
 * Retrieve paginated admin audit trail with optional action/targetType/date filters.
 */
export async function getAuditLog(req, res) {
  try {
    const AuditLogModel = await resolveModel(
      ['AuditLog', 'AdminAuditLog', 'AdminLog'],
      [
        () => import('../models/AuditLog.js'),
        () => import('../models/AdminAuditLog.js'),
        () => import('../models/AdminLog.js'),
      ]
    );

    if (!AuditLogModel) {
      return res.status(500).json({
        success: false,
        message: 'AuditLog model is unavailable',
      });
    }

    const { action, targetType, adminId, startDate, endDate } = req.query || {};
    const page = Math.max(1, parseInt(req.query?.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query?.limit, 10) || 20));
    const skip = (page - 1) * limit;

    const query = {};
    if (action) query.action = String(action).trim();
    if (targetType) query.targetType = String(targetType).trim();
    if (adminId) {
      if (!mongoose.Types.ObjectId.isValid(adminId)) {
        return res.status(400).json({ success: false, message: 'Invalid adminId filter' });
      }
      query.$or = [{ admin: adminId }, { adminId }];
    }

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) {
        const parsedStart = /^\d{4}-\d{2}-\d{2}$/.test(startDate)
          ? getISTDayRange(startDate).start
          : new Date(startDate);
        if (Number.isNaN(parsedStart.getTime())) {
          return res.status(400).json({ success: false, message: 'Invalid startDate' });
        }
        query.createdAt.$gte = parsedStart;
      }
      if (endDate) {
        const parsedEnd = /^\d{4}-\d{2}-\d{2}$/.test(endDate)
          ? getISTDayRange(endDate).end
          : new Date(endDate);
        if (Number.isNaN(parsedEnd.getTime())) {
          return res.status(400).json({ success: false, message: 'Invalid endDate' });
        }
        query.createdAt.$lte = parsedEnd;
      }
    }

    const [logs, total] = await Promise.all([
      AuditLogModel.find(query)
        .populate('admin', 'name email role')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      AuditLogModel.countDocuments(query),
    ]);

    return res.status(200).json({
      success: true,
      data: logs,
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
      message: error.message || 'Failed to fetch audit log',
    });
  }
}

/**
 * GET /api/v1/admin/users/:id
 * View individual student profile, progress, solved problems, XP, achievements, revision & daily challenge stats.
 * Never exposes passwords or tokens.
 */
export async function getStudentDetail(req, res) {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid student ID' });
    }
    const UserModel = await resolveModel(['User'], [() => import('../models/User.js')]);
    const UserProgressModel = await resolveModel(['UserProgress'], [() => import('../models/UserProgress.js')]);
    const SubmissionModel = await resolveModel(['Submission'], [() => import('../models/Submission.js')]);
    const RevisionModel = await resolveModel(['Revision'], [() => import('../models/Revision.js')]);
    const ChallengeAttemptModel = await resolveModel(['ChallengeAttempt'], [() => import('../models/ChallengeAttempt.js')]);
    const UserAchievementModel = await resolveModel(['UserAchievement'], [() => import('../models/UserAchievement.js')]);

    const user = await UserModel.findById(id)
      .select('-password -resetPasswordToken -resetPasswordExpire')
      .lean();
    if (!user) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    const [completedTopicsCount, subs, revisionsCount, completedRevisions, completedChallenges, earnedAchievements] =
      await Promise.all([
        UserProgressModel ? UserProgressModel.countDocuments({ user: id, isCompleted: true }) : 0,
        SubmissionModel
          ? SubmissionModel.find({ user: id }).select('problem verdict status language').lean()
          : [],
        RevisionModel ? RevisionModel.countDocuments({ user: id }) : 0,
        RevisionModel ? RevisionModel.countDocuments({ user: id, revisionStatus: 'completed' }) : 0,
        ChallengeAttemptModel ? ChallengeAttemptModel.countDocuments({ user: id, isCompleted: true }) : 0,
        UserAchievementModel
          ? UserAchievementModel.find({ user: id }).populate('achievement', 'title description xpReward').lean()
          : [],
      ]);

    const solvedSet = new Set();
    let acceptedCount = 0;
    for (const s of subs) {
      const v = s.verdict || s.status;
      if (v === 'Accepted') {
        acceptedCount += 1;
        if (s.problem) solvedSet.add(String(s.problem));
      }
    }

    return res.status(200).json({
      success: true,
      data: {
        user,
        stats: {
          completedTopics: completedTopicsCount,
          uniqueSolved: solvedSet.size,
          totalSubmissions: subs.length,
          acceptedSubmissions: acceptedCount,
          acceptanceRate: subs.length > 0 ? Number(((acceptedCount / subs.length) * 100).toFixed(2)) : 0,
          revisionsQueued: revisionsCount,
          revisionsCompleted: completedRevisions,
          dailyChallengesCompleted: completedChallenges,
        },
        achievements: earnedAchievements.map((ea) => ({
          _id: ea._id,
          title: ea.achievement?.title || 'Achievement',
          xpReward: ea.achievement?.xpReward || 0,
          earnedAt: ea.earnedAt,
        })),
      },
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Failed to load student details',
    });
  }
}

/**
 * PUT /api/v1/admin/users/:id/activate
 * Re-activate a student account (`isActive = true`) and record audit log.
 */
export async function activateUser(req, res) {
  try {
    const adminId = req.user?._id || req.user?.id;
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid user ID' });
    }
    const UserModel = await resolveModel(['User'], [() => import('../models/User.js')]);
    const targetUser = await UserModel.findByIdAndUpdate(
      id,
      { $set: { isActive: true } },
      { new: true }
    ).select('-password -resetPasswordToken -resetPasswordExpire');

    if (!targetUser) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    await logAdminAction(adminId, 'ACTIVATE_USER', 'User', targetUser._id, {
      targetName: targetUser.name,
    });

    return res.status(200).json({
      success: true,
      data: targetUser,
      message: 'User activated successfully',
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Failed to activate user',
    });
  }
}

/**
 * GET /api/v1/admin/users/:id/report
 * Generate individual student performance report as Admin (delegates to progressController).
 */
export async function getStudentReport(req, res) {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ success: false, message: 'Invalid student ID' });
  }
  const clonedReq = Object.create(req);
  clonedReq.user = { _id: id, id };
  return getPerformanceReport(clonedReq, res);
}

/**
 * GET /api/v1/admin/users/:id/export
 * Export individual student CSV report as Admin (formula-injection safe, no credentials).
 */
export async function exportStudentReport(req, res) {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ success: false, message: 'Invalid student ID' });
  }
  const clonedReq = Object.create(req);
  clonedReq.user = { _id: id, id };
  return exportReport(clonedReq, res);
}

/**
 * GET /api/v1/admin/problems
 * List all coding problems (published, draft, archived) with sample & hidden test case counts.
 */
export async function getAdminProblems(req, res) {
  try {
    const ProblemModel = await resolveModel(['Problem'], [() => import('../models/Problem.js')]);
    const TestCaseModel = await resolveModel(['TestCase'], [() => import('../models/TestCase.js')]);

    const page = Math.max(1, parseInt(req.query?.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query?.limit, 10) || 20));
    const search = String(req.query?.search || '').trim();
    const difficulty = String(req.query?.difficulty || '').trim();
    const status = String(req.query?.status || 'all').trim().toLowerCase();

    const query = {};
    if (search) {
      const safe = new RegExp(escapeRegExp(search), 'i');
      query.$or = [{ title: safe }, { slug: safe }, { tags: safe }];
    }
    if (['Easy', 'Medium', 'Hard'].includes(difficulty)) {
      query.difficulty = difficulty;
    }
    if (status === 'published') {
      query.isPublished = true;
      query.isArchived = { $ne: true };
    } else if (status === 'draft') {
      query.isPublished = false;
      query.isArchived = { $ne: true };
    } else if (status === 'archived') {
      query.isArchived = true;
    }

    const [problems, total] = await Promise.all([
      ProblemModel.find(query)
        .populate('topics', 'title slug')
        .sort({ order: 1, createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      ProblemModel.countDocuments(query),
    ]);

    const pIds = problems.map((p) => p._id);
    const tcAgg = TestCaseModel && pIds.length > 0
      ? await TestCaseModel.aggregate([
          { $match: { problem: { $in: pIds } } },
          {
            $group: {
              _id: { problem: '$problem', isSample: '$isSample' },
              count: { $sum: 1 },
            },
          },
        ])
      : [];

    const countMap = new Map();
    for (const row of tcAgg) {
      const pid = String(row._id.problem);
      if (!countMap.has(pid)) countMap.set(pid, { sampleCount: 0, hiddenCount: 0 });
      if (row._id.isSample) countMap.get(pid).sampleCount = row.count;
      else countMap.get(pid).hiddenCount = row.count;
    }

    const enriched = problems.map((p) => {
      const counts = countMap.get(String(p._id)) || { sampleCount: 0, hiddenCount: 0 };
      return {
        ...p,
        sampleCount: counts.sampleCount,
        hiddenCount: counts.hiddenCount,
      };
    });

    return res.status(200).json({
      success: true,
      data: enriched,
      pagination: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) },
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Failed to load admin problems',
    });
  }
}

/**
 * POST /api/v1/admin/problems/:id/validate-solution
 * Run a reference solution in C, C++, Java, or Python against all problem test cases via Judge0.
 */
export async function validateProblemSolution(req, res) {
  try {
    const adminId = req.user?._id || req.user?.id;
    const { id } = req.params;
    const { language, code } = req.body || {};

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid problem ID' });
    }
    if (!['c', 'cpp', 'java', 'python'].includes(String(language || '').toLowerCase())) {
      return res.status(400).json({ success: false, message: 'Invalid language (c, cpp, java, python)' });
    }
    if (!code || typeof code !== 'string' || !code.trim()) {
      return res.status(400).json({ success: false, message: 'Reference solution code is required' });
    }

    const lang = String(language).toLowerCase();
    const ProblemModel = await resolveModel(['Problem'], [() => import('../models/Problem.js')]);
    const TestCaseModel = await resolveModel(['TestCase'], [() => import('../models/TestCase.js')]);

    const problem = await ProblemModel.findById(id);
    if (!problem) {
      return res.status(404).json({ success: false, message: 'Problem not found' });
    }

    const testCases = await TestCaseModel.find({ problem: id }).sort({ order: 1 }).lean();
    if (testCases.length === 0) {
      return res.status(400).json({ success: false, message: 'Add test cases before validating a reference solution' });
    }

    const results = await batchSubmit(
      testCases.map((tc) => ({
        code,
        language: lang,
        stdin: tc.input,
        expectedOutput: tc.expectedOutput,
        timeLimit: problem.timeLimit,
        memoryLimit: problem.memoryLimit,
      }))
    );

    const passedCount = results.filter((r) => r.verdict === VERDICTS.ACCEPTED).length;
    const allPassed = passedCount === testCases.length;

    problem.referenceSolutions = problem.referenceSolutions || {};
    problem.referenceSolutions[lang] = code;
    problem.validationStatus = problem.validationStatus || {};
    problem.validationStatus[lang] = allPassed ? 'passed' : 'failed';
    problem.validationStatus.lastValidatedAt = new Date();
    if (allPassed) {
      problem.validationStatus.isValidated = true;
      problem.requiresRevalidation = false;
    }
    await problem.save();

    await logAdminAction(adminId, 'VALIDATE_REFERENCE_SOLUTION', 'Problem', problem._id, {
      language: lang,
      passedCount,
      totalCases: testCases.length,
      allPassed,
    });

    return res.status(200).json({
      success: true,
      data: {
        allPassed,
        passedCount,
        totalCases: testCases.length,
        validationStatus: problem.validationStatus,
        results: results.map((r, i) => ({
          index: i + 1,
          isSample: testCases[i].isSample,
          verdict: r.verdict,
          input: testCases[i].input,
          expectedOutput: testCases[i].expectedOutput,
          actualOutput: r.stdout,
          stderr: r.stderr,
          compileOutput: r.compileOutput,
          runtimeMs: r.runtimeMs,
          memory: r.memory,
        })),
      },
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Reference solution validation failed',
    });
  }
}

/**
 * PUT /api/v1/admin/problems/:id/publish
 * Publish a draft problem after enforcing >=1 sample, >=1 hidden test case, and validated reference solution.
 */
export async function publishProblem(req, res) {
  try {
    const adminId = req.user?._id || req.user?.id;
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid problem ID' });
    }

    const ProblemModel = await resolveModel(['Problem'], [() => import('../models/Problem.js')]);
    const TestCaseModel = await resolveModel(['TestCase'], [() => import('../models/TestCase.js')]);

    const [problem, sampleCount, hiddenCount] = await Promise.all([
      ProblemModel.findById(id),
      TestCaseModel.countDocuments({ problem: id, isSample: true }),
      TestCaseModel.countDocuments({ problem: id, isSample: false }),
    ]);

    if (!problem) {
      return res.status(404).json({ success: false, message: 'Problem not found' });
    }
    if (sampleCount < 1 || hiddenCount < 1) {
      return res.status(400).json({
        success: false,
        message: 'At least 1 sample test case and 1 hidden test case are required before publishing.',
      });
    }
    if (!problem.validationStatus?.isValidated || problem.requiresRevalidation) {
      return res.status(400).json({
        success: false,
        message: 'Problem must pass reference-solution validation via Judge0 before publishing.',
      });
    }

    problem.isPublished = true;
    problem.isArchived = false;
    problem.archivedAt = null;
    await problem.save();

    await logAdminAction(adminId, 'PUBLISH_PROBLEM', 'Problem', problem._id, {
      title: problem.title,
      slug: problem.slug,
      sampleCount,
      hiddenCount,
    });

    return res.status(200).json({
      success: true,
      data: problem,
      message: 'Problem published successfully',
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Failed to publish problem',
    });
  }
}

/**
 * GET /api/v1/admin/achievements
 * List all achievements with earned counts.
 */
export async function getAdminAchievements(_req, res) {
  try {
    const AchievementModel = await resolveModel(['Achievement'], [() => import('../models/Achievement.js')]);
    const UserAchievementModel = await resolveModel(['UserAchievement'], [() => import('../models/UserAchievement.js')]);

    const [achievements, counts] = await Promise.all([
      AchievementModel.find({}).sort({ xpReward: 1, title: 1 }).lean(),
      UserAchievementModel
        ? UserAchievementModel.aggregate([{ $group: { _id: '$achievement', count: { $sum: 1 } } }])
        : [],
    ]);
    const countMap = new Map(counts.map((c) => [String(c._id), c.count]));

    return res.status(200).json({
      success: true,
      data: achievements.map((a) => ({
        ...a,
        earnedCount: countMap.get(String(a._id)) || 0,
      })),
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Failed to load achievements',
    });
  }
}

/**
 * POST /api/v1/admin/achievements
 */
export async function createAchievement(req, res) {
  try {
    const adminId = req.user?._id || req.user?.id;
    const AchievementModel = await resolveModel(['Achievement'], [() => import('../models/Achievement.js')]);
    const ach = await AchievementModel.create(req.body);
    await logAdminAction(adminId, 'CREATE_ACHIEVEMENT', 'Achievement', ach._id, {
      key: ach.key,
      title: ach.title,
    });
    return res.status(201).json({ success: true, data: ach });
  } catch (error) {
    return res.status(error.statusCode || 400).json({
      success: false,
      message: error.message || 'Failed to create achievement',
    });
  }
}

/**
 * PUT /api/v1/admin/achievements/:id
 */
export async function updateAchievement(req, res) {
  try {
    const adminId = req.user?._id || req.user?.id;
    const { id } = req.params;
    const AchievementModel = await resolveModel(['Achievement'], [() => import('../models/Achievement.js')]);
    const ach = await AchievementModel.findByIdAndUpdate(
      id,
      { $set: req.body },
      { new: true, runValidators: true }
    );
    if (!ach) {
      return res.status(404).json({ success: false, message: 'Achievement not found' });
    }
    await logAdminAction(adminId, 'UPDATE_ACHIEVEMENT', 'Achievement', ach._id, {
      key: ach.key,
      title: ach.title,
    });
    return res.status(200).json({ success: true, data: ach });
  } catch (error) {
    return res.status(error.statusCode || 400).json({
      success: false,
      message: error.message || 'Failed to update achievement',
    });
  }
}

/**
 * GET /api/v1/admin/daily-challenges
 * Admin view of today's challenge stats, participation, and scheduled/past challenges.
 */
export async function getAdminDailyChallenges(_req, res) {
  try {
    const DailyChallengeModel = await resolveModel(['DailyChallenge'], [() => import('../models/DailyChallenge.js')]);
    const ChallengeAttemptModel = await resolveModel(['ChallengeAttempt'], [() => import('../models/ChallengeAttempt.js')]);
    const todayIST = getISTDateString();

    const [challenges, todayAttempts] = await Promise.all([
      DailyChallengeModel.find({})
        .populate('problem', 'title slug difficulty')
        .sort({ date: -1 })
        .limit(30)
        .lean(),
      ChallengeAttemptModel
        ? ChallengeAttemptModel.find({ dateKey: todayIST }).select('isCompleted difficultyPreference').lean()
        : [],
    ]);

    return res.status(200).json({
      success: true,
      data: {
        todayIST,
        todayStats: {
          assignedCount: todayAttempts.length,
          completedCount: todayAttempts.filter((a) => a.isCompleted).length,
        },
        challenges: challenges.map((c) => ({
          _id: c._id,
          date: getISTDateString(c.date),
          problem: c.problem,
          difficulty: c.difficulty,
        })),
      },
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Failed to load daily challenges',
    });
  }
}

/**
 * POST /api/v1/admin/curriculum/validate-dag
 * Validate prerequisite relationships using `detectCycle` from `dsaAlgorithms.js`.
 */
export async function validateCurriculumDAG(req, res) {
  try {
    const { nodeId, prerequisites = [], type = 'topic' } = req.body || {};
    const TopicModel = await resolveModel(['Topic'], [() => import('../models/Topic.js')]);
    const ModuleModel = await resolveModel(['Module'], [() => import('../models/Module.js')]);

    const items =
      type === 'module'
        ? await ModuleModel.find({}).select('_id prerequisites').lean()
        : await TopicModel.find({}).select('_id prerequisites').lean();

    const adj = new Map();
    for (const item of items) {
      adj.set(String(item._id), []);
    }
    for (const item of items) {
      const id = String(item._id);
      const prereqs = id === String(nodeId) ? prerequisites : item.prerequisites || [];
      for (const p of prereqs) {
        const pId = String(p?._id || p);
        if (!adj.has(pId)) adj.set(pId, []);
        adj.get(pId).push(id);
      }
    }

    const hasCycle = detectCycle(adj);
    return res.status(hasCycle ? 400 : 200).json({
      success: !hasCycle,
      valid: !hasCycle,
      hasCycle,
      message: hasCycle
        ? 'Circular prerequisite detected! Rejecting update to preserve DAG.'
        : 'Prerequisite graph is a valid DAG.',
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to validate curriculum DAG',
    });
  }
}

export default {
  getDashboardStats,
  getUsers,
  getStudentDetail,
  activateUser,
  deactivateUser,
  getStudentReport,
  exportStudentReport,
  getAdminProblems,
  validateProblemSolution,
  publishProblem,
  getSubmissionStats,
  getAdminAchievements,
  createAchievement,
  updateAchievement,
  getAdminDailyChallenges,
  validateCurriculumDAG,
  getAuditLog,
  logAdminAction,
};
