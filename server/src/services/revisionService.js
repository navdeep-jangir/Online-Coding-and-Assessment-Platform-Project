import mongoose from 'mongoose';
import Revision from '../models/Revision.js';
import Problem from '../models/Problem.js';
import ApiError from '../utils/ApiError.js';
import { REVISION_SCHEDULE } from '../config/constants.js';
import { PriorityQueue } from '../utils/dsaAlgorithms.js';

const MS_PER_DAY = 24 * 60 * 60 * 1000;

const MISTAKE_REASONS = new Set([
  'wrong_answer',
  'compilation_error',
  'runtime_error',
  'time_limit_exceeded',
  'memory_limit_exceeded',
  'incorrect',
]);

const IGNORED_SYSTEM_REASONS = new Set(['internal_error', 'service_unavailable', 'pending']);

/**
 * Min-Heap Priority Queue (backed by `PriorityQueue` from `dsaAlgorithms.js`)
 * used to order due revisions by earliest `nextRevisionDate` ascending
 * (tie-breaking on higher `incorrectAttempts` descending).
 */
export class RevisionPriorityQueue {
  constructor() {
    this.pq = new PriorityQueue((a, b) => {
      const timeA = a.nextRevisionDate ? new Date(a.nextRevisionDate).getTime() : 0;
      const timeB = b.nextRevisionDate ? new Date(b.nextRevisionDate).getTime() : 0;
      if (timeA !== timeB) return timeA - timeB;
      return (b.incorrectAttempts || 0) - (a.incorrectAttempts || 0);
    });
  }

  get size() {
    return this.pq.size();
  }

  push(item) {
    this.pq.insert(item);
  }

  pop() {
    return this.pq.extractMin();
  }

  toSortedArray() {
    const clone = new RevisionPriorityQueue();
    for (const item of this.pq.heap) {
      clone.push(item);
    }
    const sorted = [];
    while (clone.size > 0) {
      sorted.push(clone.pop());
    }
    return sorted;
  }
}

/**
 * Compute spaced-repetition interval in days from [1, 3, 7, 14] based on attempts/step.
 */
export const getIntervalDays = (incorrectAttempts = 1) => {
  const attempts = Math.max(1, Number(incorrectAttempts) || 1);
  const index = Math.min(attempts - 1, REVISION_SCHEDULE.length - 1);
  return REVISION_SCHEDULE[index];
};

/**
 * Calculate the next revision Date using spaced repetition schedule [1, 3, 7, 14] days.
 */
export const calculateNextRevisionDate = (incorrectAttempts = 1, fromDate = new Date()) => {
  const base = fromDate instanceof Date ? fromDate : new Date(fromDate);
  const days = getIntervalDays(incorrectAttempts);
  return new Date(base.getTime() + days * MS_PER_DAY);
};

/**
 * Create or update a Revision entry when a user submits an incorrect/error solution
 * or manually adds a problem for review.
 */
export const addToRevision = async (userId, problemId, reason = 'wrong_answer') => {
  if (!userId || !mongoose.isValidObjectId(userId)) {
    throw new ApiError(400, 'Valid userId is required.');
  }
  if (!problemId || !mongoose.isValidObjectId(problemId)) {
    throw new ApiError(400, 'Valid problemId is required.');
  }

  const normalizedReason = String(reason || 'wrong_answer')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '_');

  // Do not classify execution service outages or network failures as student mistakes
  if (IGNORED_SYSTEM_REASONS.has(normalizedReason)) {
    return null;
  }

  const isManual = normalizedReason === 'manual' || normalizedReason === 'bookmark';
  const markedDifficult = normalizedReason === 'difficult';
  const isMistake = MISTAKE_REASONS.has(normalizedReason);
  const now = new Date();

  let revision = await Revision.findOne({ user: userId, problem: problemId });

  if (revision) {
    if (isMistake) {
      revision.incorrectAttempts = (revision.incorrectAttempts || 0) + 1;
      revision.revisionReason = normalizedReason;
    } else if (!revision.revisionReason) {
      revision.revisionReason = markedDifficult ? 'difficult' : 'manual';
    }
    revision.lastAttemptDate = now;
    revision.revisionStatus = 'pending';
    // Immediate due date for difficult/manual or 1d->3d->7d->14d spaced repetition for mistakes
    revision.nextRevisionDate = isMistake
      ? calculateNextRevisionDate(revision.incorrectAttempts || 1, now)
      : now;
    if (isManual) revision.isManual = true;
    if (markedDifficult) revision.markedDifficult = true;
    await revision.save();
  } else {
    const initialAttempts = isMistake ? 1 : 0;
    revision = await Revision.create({
      user: userId,
      problem: problemId,
      incorrectAttempts: initialAttempts,
      lastAttemptDate: now,
      revisionReason: isMistake ? normalizedReason : markedDifficult ? 'difficult' : 'manual',
      revisionStatus: 'pending',
      nextRevisionDate: isMistake ? calculateNextRevisionDate(1, now) : now,
      isManual,
      markedDifficult,
    });
  }

  return revision;
};

/**
 * Retrieve due revisions ordered by priority (earliest nextRevisionDate first via Min-Heap).
 */
export const getRevisionQueue = async (userId, filters = {}) => {
  if (!userId || !mongoose.isValidObjectId(userId)) {
    throw new ApiError(400, 'Valid userId is required.');
  }

  const now = new Date();
  const statusFilter = filters.status ? String(filters.status).trim().toLowerCase() : null;
  const dueOnly =
    filters.dueOnly !== undefined
      ? Boolean(filters.dueOnly)
      : filters.includeUpcoming === true
        ? false
        : statusFilter !== 'all' && statusFilter !== 'completed';

  const query = { user: userId };

  if (statusFilter === 'completed') {
    query.revisionStatus = 'completed';
  } else if (statusFilter === 'pending' || statusFilter === 'due') {
    query.revisionStatus = { $in: ['pending', 'due'] };
  } else if (statusFilter !== 'all') {
    query.revisionStatus = { $ne: 'completed' };
  }

  if (dueOnly) {
    query.nextRevisionDate = { $lte: now };
  }

  const revisions = await Revision.find(query)
    .populate({
      path: 'problem',
      select: 'title slug difficulty topics tags order isPublished isArchived',
      populate: { path: 'topics', select: 'title slug' },
    })
    .lean();

  const difficultyFilter = filters.difficulty
    ? String(filters.difficulty).trim().toLowerCase()
    : null;
  const topicFilter = filters.topic ? String(filters.topic).trim().toLowerCase() : null;

  const pq = new RevisionPriorityQueue();

  for (const rev of revisions) {
    const problem = rev.problem;
    if (!problem || problem.isArchived) continue;

    if (difficultyFilter && String(problem.difficulty || '').toLowerCase() !== difficultyFilter) {
      continue;
    }

    if (topicFilter) {
      const topicMatch =
        (Array.isArray(problem.topics) &&
          problem.topics.some(
            (t) =>
              String(t?._id || t).toLowerCase() === topicFilter ||
              String(t?.slug || '').toLowerCase() === topicFilter ||
              String(t?.title || '').toLowerCase() === topicFilter
          )) ||
        (Array.isArray(problem.tags) &&
          problem.tags.some((tag) => String(tag).toLowerCase() === topicFilter));

      if (!topicMatch) continue;
    }

    const nextDate = rev.nextRevisionDate ? new Date(rev.nextRevisionDate) : now;
    const isDue = rev.revisionStatus !== 'completed' && nextDate.getTime() <= now.getTime();
    const overdueDays = isDue
      ? Math.max(0, Math.floor((now.getTime() - nextDate.getTime()) / MS_PER_DAY))
      : 0;

    pq.push({
      ...rev,
      isDue,
      overdueDays,
      intervalDays: getIntervalDays(rev.incorrectAttempts || 1),
    });
  }

  const ordered = pq.toSortedArray();
  const limit = filters.limit ? Math.max(1, Number(filters.limit)) : null;
  return limit ? ordered.slice(0, limit) : ordered;
};

/**
 * Mark a revision entry as completed for a user and problem.
 */
export const markRevisionComplete = async (
  userId,
  problemId,
  { ignoreNotFound = false } = {}
) => {
  if (!userId || !mongoose.isValidObjectId(userId)) {
    throw new ApiError(400, 'Valid userId is required.');
  }
  if (!problemId || !mongoose.isValidObjectId(problemId)) {
    throw new ApiError(400, 'Valid problemId is required.');
  }

  const revision = await Revision.findOne({ user: userId, problem: problemId });
  if (!revision) {
    if (ignoreNotFound) return null;
    throw new ApiError(404, 'Revision entry not found.');
  }

  const now = new Date();
  revision.revisionStatus = 'completed';
  revision.lastSuccessfulRevision = now;
  revision.lastAttemptDate = now;
  await revision.save();

  return revision;
};

/**
 * Reschedule a revision entry to its next spaced-repetition interval in [1, 3, 7, 14] days.
 */
export const rescheduleRevision = async (userId, problemId, options = {}) => {
  if (!userId || !mongoose.isValidObjectId(userId)) {
    throw new ApiError(400, 'Valid userId is required.');
  }
  if (!problemId || !mongoose.isValidObjectId(problemId)) {
    throw new ApiError(400, 'Valid problemId is required.');
  }

  let revision = await Revision.findOne({ user: userId, problem: problemId });
  if (!revision) {
    const problemExists = await Problem.exists({ _id: problemId });
    if (!problemExists) {
      throw new ApiError(404, 'Problem not found.');
    }
    throw new ApiError(404, 'Revision entry not found.');
  }

  const now = new Date();
  let stepAttempts;

  if (options.incorrectAttempts !== undefined) {
    stepAttempts = Number(options.incorrectAttempts);
  } else {
    // Determine current interval in days and advance to next step in [1, 3, 7, 14]
    const prevBase = revision.lastAttemptDate || revision.updatedAt || now;
    const prevNext = revision.nextRevisionDate;
    let currentIndex = 0;

    if (prevNext && prevBase) {
      const currentDays = Math.round(
        (new Date(prevNext).getTime() - new Date(prevBase).getTime()) / MS_PER_DAY
      );
      const matchedIdx = REVISION_SCHEDULE.findIndex((d) => currentDays <= d);
      currentIndex = matchedIdx >= 0 ? matchedIdx : REVISION_SCHEDULE.length - 1;
    }

    const nextIndex = Math.min(currentIndex + 1, REVISION_SCHEDULE.length - 1);
    stepAttempts = nextIndex + 1;
  }

  revision.lastAttemptDate = now;
  revision.revisionStatus = 'pending';
  revision.nextRevisionDate = calculateNextRevisionDate(stepAttempts, now);
  await revision.save();

  return revision;
};

export default {
  addToRevision,
  getRevisionQueue,
  markRevisionComplete,
  rescheduleRevision,
  calculateNextRevisionDate,
  getIntervalDays,
  RevisionPriorityQueue,
};
