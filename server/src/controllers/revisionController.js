import mongoose from 'mongoose';
import Revision from '../models/Revision.js';
import Problem from '../models/Problem.js';
import {
  RevisionPriorityQueue,
  addToRevision,
  calculateNextRevisionDate,
  getIntervalDays,
} from '../services/revisionService.js';
import { getISTDateString, getISTDayRange } from './dailyChallengeController.js';

const MS_PER_DAY = 24 * 60 * 60 * 1000;

function getEndOfTodayIST() {
  const todayIST = getISTDateString();
  return getISTDayRange(todayIST).end;
}

function enrichRevisionItem(rev, now = new Date(), endOfToday = getEndOfTodayIST()) {
  const nextDate = rev.nextRevisionDate ? new Date(rev.nextRevisionDate) : now;
  const isCompleted = rev.revisionStatus === 'completed';
  const isDueToday = !isCompleted && nextDate.getTime() <= endOfToday.getTime();
  const isOverdue = !isCompleted && nextDate.getTime() < now.getTime();
  const isUpcoming = !isCompleted && nextDate.getTime() > endOfToday.getTime();
  const isIncorrect = (rev.incorrectAttempts || 0) > 0;
  const isDifficult = rev.markedDifficult === true || rev.revisionReason === 'difficult';
  const overdueDays = isOverdue
    ? Math.max(0, Math.floor((now.getTime() - nextDate.getTime()) / MS_PER_DAY))
    : 0;

  return {
    ...rev,
    isDue: isDueToday,
    isDueToday,
    isOverdue,
    isUpcoming,
    isIncorrect,
    isDifficult,
    overdueDays,
    intervalDays: getIntervalDays(rev.incorrectAttempts || 1),
  };
}

/**
 * GET /api/v1/revisions
 * Retrieve authenticated user's revision queue ordered by Min-Heap PriorityQueue,
 * with summary counts and filters (due_today, upcoming, incorrect, difficult, completed, all, topic, difficulty, search).
 */
export async function getRevisions(req, res) {
  try {
    const userId = req.user?._id || req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const filterParam = String(
      req.query?.filter || req.query?.status || req.query?.tab || 'all'
    )
      .trim()
      .toLowerCase();
    const difficultyFilter = req.query?.difficulty
      ? String(req.query.difficulty).trim().toLowerCase()
      : null;
    const topicFilter = req.query?.topic ? String(req.query.topic).trim().toLowerCase() : null;
    const searchFilter = req.query?.search ? String(req.query.search).trim().toLowerCase() : null;
    const page = Math.max(1, parseInt(req.query?.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query?.limit, 10) || 50));

    const allRevisions = await Revision.find({ user: userId })
      .populate({
        path: 'problem',
        select: 'title slug difficulty topics tags order isPublished isArchived',
        populate: { path: 'topics', select: 'title slug' },
      })
      .lean();

    const now = new Date();
    const endOfToday = getEndOfTodayIST();

    const summary = {
      total: 0,
      dueToday: 0,
      upcoming: 0,
      incorrect: 0,
      difficult: 0,
      completed: 0,
      pending: 0,
      overdue: 0,
    };

    const pq = new RevisionPriorityQueue();
    const completedItems = [];

    for (const rawRev of allRevisions) {
      if (!rawRev.problem || rawRev.problem.isArchived) continue;
      const item = enrichRevisionItem(rawRev, now, endOfToday);

      summary.total += 1;
      if (item.revisionStatus === 'completed') {
        summary.completed += 1;
      } else {
        summary.pending += 1;
        if (item.isDueToday) summary.dueToday += 1;
        if (item.isUpcoming) summary.upcoming += 1;
        if (item.isOverdue) summary.overdue += 1;
      }
      if (item.isIncorrect) summary.incorrect += 1;
      if (item.isDifficult) summary.difficult += 1;

      if (difficultyFilter && String(item.problem.difficulty || '').toLowerCase() !== difficultyFilter) {
        continue;
      }

      if (topicFilter) {
        const topicsArr = Array.isArray(item.problem.topics) ? item.problem.topics : [];
        const tagsArr = Array.isArray(item.problem.tags) ? item.problem.tags : [];
        const matchesTopic =
          topicsArr.some(
            (t) =>
              String(t?._id || t).toLowerCase() === topicFilter ||
              String(t?.slug || '').toLowerCase() === topicFilter ||
              String(t?.title || '').toLowerCase() === topicFilter
          ) || tagsArr.some((tag) => String(tag).toLowerCase() === topicFilter);
        if (!matchesTopic) continue;
      }

      if (searchFilter) {
        const title = String(item.problem.title || '').toLowerCase();
        const slug = String(item.problem.slug || '').toLowerCase();
        const topicTitles = (Array.isArray(item.problem.topics) ? item.problem.topics : [])
          .map((t) => String(t?.title || '').toLowerCase())
          .join(' ');
        if (
          !title.includes(searchFilter) &&
          !slug.includes(searchFilter) &&
          !topicTitles.includes(searchFilter)
        ) {
          continue;
        }
      }

      if (filterParam === 'due_today' || filterParam === 'due' || filterParam === 'overdue') {
        if (!item.isDueToday) continue;
      } else if (filterParam === 'upcoming') {
        if (!item.isUpcoming) continue;
      } else if (filterParam === 'incorrect' || filterParam === 'failed') {
        if (!item.isIncorrect) continue;
      } else if (filterParam === 'difficult') {
        if (!item.isDifficult) continue;
      } else if (filterParam === 'completed') {
        if (item.revisionStatus !== 'completed') continue;
      } else if (filterParam === 'pending') {
        if (item.revisionStatus === 'completed') continue;
      }

      if (item.revisionStatus === 'completed') {
        completedItems.push(item);
      } else {
        pq.push(item);
      }
    }

    // Pending/due items ordered via Min-Heap PriorityQueue; completed sorted by most recent revision
    const orderedPending = pq.toSortedArray();
    completedItems.sort(
      (a, b) =>
        new Date(b.lastSuccessfulRevision || b.lastAttemptDate || b.updatedAt).getTime() -
        new Date(a.lastSuccessfulRevision || a.lastAttemptDate || a.updatedAt).getTime()
    );
    const ordered = [...orderedPending, ...completedItems];

    const total = ordered.length;
    const startIdx = (page - 1) * limit;
    const paginated = ordered.slice(startIdx, startIdx + limit);

    return res.status(200).json({
      success: true,
      filter: filterParam,
      summary,
      data: paginated,
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
      message: error.message || 'Failed to retrieve revisions',
    });
  }
}

/**
 * GET /api/v1/revisions/due
 * Return due-today revisions prioritized via Min-Heap PriorityQueue.
 */
export async function getDueRevisions(req, res) {
  req.query = { ...req.query, filter: 'due_today' };
  return getRevisions(req, res);
}

/**
 * POST /api/v1/revisions
 * Manually add a problem to revision queue or mark it as difficult.
 */
export async function createOrAddRevision(req, res) {
  try {
    const userId = req.user?._id || req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const { problemId, reason = 'manual' } = req.body || {};
    if (!problemId || !mongoose.Types.ObjectId.isValid(problemId)) {
      return res.status(400).json({ success: false, message: 'Valid problemId is required' });
    }

    const problem = await Problem.findById(problemId).select('_id title slug difficulty').lean();
    if (!problem) {
      return res.status(404).json({ success: false, message: 'Problem not found' });
    }

    const revision = await addToRevision(userId, problemId, reason);
    const populated = await Revision.findById(revision._id)
      .populate({
        path: 'problem',
        select: 'title slug difficulty topics tags',
        populate: { path: 'topics', select: 'title slug' },
      })
      .lean();

    return res.status(201).json({
      success: true,
      data: enrichRevisionItem(populated),
      message:
        reason === 'difficult'
          ? 'Problem marked as difficult and added to Revision Mode'
          : 'Problem added to Revision Mode',
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Failed to add problem to revision queue',
    });
  }
}

/**
 * PUT /api/v1/revisions/:id/complete
 * Mark a revision item as revised/completed without deleting historical attempt counts.
 */
export async function markComplete(req, res) {
  try {
    const userId = req.user?._id || req.user?.id;
    const { id } = req.params || {};

    if (!userId) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid revision ID' });
    }

    const revision = await Revision.findOne({ _id: id, user: userId });
    if (!revision) {
      return res.status(404).json({ success: false, message: 'Revision item not found' });
    }

    const now = new Date();
    revision.revisionStatus = 'completed';
    revision.lastSuccessfulRevision = now;
    revision.lastAttemptDate = now;
    await revision.save();

    const populated = await Revision.findById(revision._id)
      .populate({
        path: 'problem',
        select: 'title slug difficulty topics tags',
        populate: { path: 'topics', select: 'title slug' },
      })
      .lean();

    return res.status(200).json({
      success: true,
      data: enrichRevisionItem(populated),
      message: 'Revision marked as revised',
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Failed to mark revision complete',
    });
  }
}

/**
 * PUT /api/v1/revisions/:id/reschedule
 * Reschedule a revision item using explicit date, `days` offset, or next [1, 3, 7, 14] interval.
 */
export async function reschedule(req, res) {
  try {
    const userId = req.user?._id || req.user?.id;
    const { id } = req.params || {};

    if (!userId) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid revision ID' });
    }

    const revision = await Revision.findOne({ _id: id, user: userId });
    if (!revision) {
      return res.status(404).json({ success: false, message: 'Revision item not found' });
    }

    const { date, nextRevisionDate, nextReviewDate, scheduledFor, dueDate, days } = req.body || {};
    const rawDate = nextRevisionDate || nextReviewDate || scheduledFor || dueDate || date;
    const now = new Date();
    let targetDate;

    if (rawDate !== undefined && rawDate !== null && rawDate !== '') {
      if (typeof rawDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(rawDate.trim())) {
        targetDate = getISTDayRange(rawDate.trim()).start;
      } else {
        targetDate = new Date(rawDate);
      }
      if (Number.isNaN(targetDate.getTime())) {
        return res.status(400).json({ success: false, message: 'Invalid reschedule date' });
      }
      const todayISTStart = getISTDayRange(getISTDateString()).start;
      if (targetDate.getTime() < todayISTStart.getTime()) {
        return res.status(400).json({ success: false, message: 'Reschedule date cannot be in the past' });
      }
    } else if (days !== undefined) {
      const numDays = Number(days);
      if (!Number.isFinite(numDays) || numDays < 0 || numDays > 365) {
        return res.status(400).json({ success: false, message: 'days must be a number between 0 and 365' });
      }
      targetDate = new Date(now.getTime() + numDays * MS_PER_DAY);
    } else {
      const nextStep = Math.max(1, (revision.incorrectAttempts || 1) + 1);
      targetDate = calculateNextRevisionDate(nextStep, now);
    }

    revision.nextRevisionDate = targetDate;
    revision.revisionStatus = 'pending';
    await revision.save();

    const populated = await Revision.findById(revision._id)
      .populate({
        path: 'problem',
        select: 'title slug difficulty topics tags',
        populate: { path: 'topics', select: 'title slug' },
      })
      .lean();

    return res.status(200).json({
      success: true,
      data: enrichRevisionItem(populated),
      message: 'Revision rescheduled successfully',
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Failed to reschedule revision',
    });
  }
}

/**
 * DELETE /api/v1/revisions/:id
 * Remove a revision entry (owner-scoped).
 */
export async function deleteRevision(req, res) {
  try {
    const userId = req.user?._id || req.user?.id;
    const { id } = req.params || {};

    if (!userId) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid revision ID' });
    }

    const deleted = await Revision.findOneAndDelete({ _id: id, user: userId });
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Revision item not found' });
    }

    return res.status(200).json({
      success: true,
      message: 'Removed from Revision Mode',
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Failed to remove revision item',
    });
  }
}

export default {
  getRevisions,
  getDueRevisions,
  createOrAddRevision,
  markComplete,
  reschedule,
  deleteRevision,
};
