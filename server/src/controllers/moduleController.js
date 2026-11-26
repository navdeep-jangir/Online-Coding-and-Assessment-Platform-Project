import mongoose from 'mongoose';
import Module from '../models/Module.js';
import Topic from '../models/Topic.js';
import Problem from '../models/Problem.js';
import Bookmark from '../models/Bookmark.js';
import Submission from '../models/Submission.js';
import UserProgress from '../models/UserProgress.js';
import { LANGUAGE_KEYS } from '../config/constants.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';
import slugify from '../utils/slugify.js';

const buildProgressSummary = (completedCount, totalTopics) => ({
  completedTopics: completedCount,
  totalTopics,
  percentage: totalTopics > 0 ? Math.round((completedCount / totalTopics) * 100) : 0,
});

/**
 * Get public platform curriculum & problem statistics from MongoDB.
 * GET /api/v1/modules/public-stats
 */
export const getPublicStats = asyncHandler(async (_req, res) => {
  const [modulesCount, conceptsCount, problemsCount] = await Promise.all([
    Module.countDocuments({ isArchived: { $ne: true } }),
    Topic.countDocuments({ isArchived: { $ne: true } }),
    Problem.countDocuments({ isPublished: true, isArchived: { $ne: true } }),
  ]);

  return res.status(200).json({
    success: true,
    data: {
      modulesCount,
      conceptsCount,
      problemsCount,
      languagesCount: LANGUAGE_KEYS.length,
    },
  });
});

/**
 * Get all active modules with topic counts and authenticated user progress, sorted by order.
 * GET /api/modules
 */
export const getModules = asyncHandler(async (req, res) => {
  const includeArchived =
    req.query.includeArchived === 'true' && req.user?.role === 'admin';
  const filter = includeArchived ? {} : { isArchived: { $ne: true } };

  const modules = await Module.find(filter).sort({ order: 1, createdAt: 1 }).lean();
  const moduleIds = modules.map((mod) => mod._id);

  const activeTopics = moduleIds.length
    ? await Topic.find({ module: { $in: moduleIds }, isArchived: { $ne: true } })
        .select('_id module')
        .lean()
    : [];

  const topicCountByModule = new Map();
  const moduleByTopic = new Map();
  const activeTopicIds = [];
  for (const topic of activeTopics) {
    const modKey = String(topic.module);
    topicCountByModule.set(modKey, (topicCountByModule.get(modKey) || 0) + 1);
    moduleByTopic.set(String(topic._id), modKey);
    activeTopicIds.push(topic._id);
  }

  const completedByModule = new Map();
  if (req.user && activeTopicIds.length > 0) {
    const progressEntries = await UserProgress.find({
      user: req.user._id,
      topic: { $in: activeTopicIds },
      isCompleted: true,
    })
      .select('topic')
      .lean();

    for (const entry of progressEntries) {
      const modKey = moduleByTopic.get(String(entry.topic));
      if (modKey) {
        completedByModule.set(modKey, (completedByModule.get(modKey) || 0) + 1);
      }
    }
  }

  const data = modules.map((mod) => {
    const modKey = String(mod._id);
    const topicCount = topicCountByModule.get(modKey) || 0;
    const completedTopics = completedByModule.get(modKey) || 0;

    return {
      ...mod,
      topicCount,
      completedTopics: req.user ? completedTopics : 0,
      progress: req.user ? buildProgressSummary(completedTopics, topicCount) : null,
    };
  });

  return res.status(200).json({
    success: true,
    data,
  });
});

/**
 * Get a single module by ID or slug along with its topics and optional user progress.
 * GET /api/modules/:id
 */
export const getModule = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const includeArchived =
    req.query.includeArchived === 'true' && req.user?.role === 'admin';

  const baseQuery = mongoose.isValidObjectId(id)
    ? { _id: id }
    : { slug: String(id).toLowerCase() };
  if (!includeArchived) {
    baseQuery.isArchived = { $ne: true };
  }

  const moduleDoc = await Module.findOne(baseQuery).lean();
  if (!moduleDoc) {
    throw new ApiError(404, 'Module not found');
  }

  const topics = await Topic.find({
    module: moduleDoc._id,
    isArchived: { $ne: true },
  })
    .sort({ order: 1, createdAt: 1 })
    .lean();

  const topicIds = topics.map((t) => t._id);
  const isDbConnected = mongoose.connection.readyState === 1;

  // Map linked CodeClimb practice problems to topics (when DB is connected)
  const linkedProblems =
    isDbConnected && topicIds.length
      ? await Problem.find({
          topics: { $in: topicIds },
          isPublished: true,
          isArchived: { $ne: true },
        })
          .select('_id slug title topics')
          .sort({ order: 1 })
          .lean()
      : [];

  const problemByTopic = new Map();
  const problemIds = [];
  for (const prob of linkedProblems) {
    problemIds.push(prob._id);
    for (const tId of prob.topics || []) {
      const key = String(tId);
      if (!problemByTopic.has(key)) {
        problemByTopic.set(key, { _id: prob._id, slug: prob.slug, title: prob.title });
      }
    }
  }

  const progressByTopic = new Map();
  const bookmarkedTopicIds = new Set();
  const solvedProblemIds = new Set();

  if (req.user && topicIds.length > 0) {
    const [progressDocs, bookmarkDocs, acceptedProblemIds] = await Promise.all([
      UserProgress.find({
        user: req.user._id,
        topic: { $in: topicIds },
      })
        .select('topic isCompleted completedAt selfReportedExternal')
        .lean(),
      Bookmark.find({
        user: req.user._id,
        targetType: 'topic',
        targetId: { $in: topicIds },
      })
        .select('targetId')
        .lean(),
      isDbConnected && problemIds.length
        ? Submission.distinct('problem', {
            user: req.user._id,
            problem: { $in: problemIds },
            verdict: 'Accepted',
          })
        : Promise.resolve([]),
    ]);

    for (const doc of progressDocs) {
      progressByTopic.set(String(doc.topic), doc);
    }
    for (const b of bookmarkDocs) {
      bookmarkedTopicIds.add(String(b.targetId));
    }
    for (const pid of acceptedProblemIds) {
      solvedProblemIds.add(String(pid));
    }
  }

  let completedCount = 0;
  const topicsWithProgress = topics.map((topic) => {
    const key = String(topic._id);
    const prog = progressByTopic.get(key);
    const isCompleted = Boolean(prog?.isCompleted);
    if (isCompleted) completedCount += 1;
    const linkedProblem = problemByTopic.get(key);
    const isVerified = linkedProblem ? solvedProblemIds.has(String(linkedProblem._id)) : false;

    return {
      ...topic,
      problemId: linkedProblem ? String(linkedProblem._id) : undefined,
      problemSlug: linkedProblem ? linkedProblem.slug : undefined,
      isCompleted: req.user ? isCompleted : false,
      completedAt: req.user && isCompleted ? prog?.completedAt || null : null,
      selfReportedExternal: req.user
        ? prog?.selfReportedExternal || { codechef: false, leetcode: false }
        : { codechef: false, leetcode: false },
      isBookmarked: req.user ? bookmarkedTopicIds.has(key) : false,
      isVerified: req.user ? isVerified : false,
    };
  });

  return res.status(200).json({
    success: true,
    data: {
      ...moduleDoc,
      topics: topicsWithProgress,
      topicCount: topicsWithProgress.length,
      progress: req.user
        ? buildProgressSummary(completedCount, topicsWithProgress.length)
        : null,
    },
  });
});

/**
 * Create a new curriculum module (Admin only).
 * POST /api/modules
 */
export const createModule = asyncHandler(async (req, res) => {
  const { title, slug, description, order, icon, difficulty, estimatedHours, isPublished } =
    req.body;

  if (!title || typeof title !== 'string' || !title.trim()) {
    throw new ApiError(400, 'Module title is required');
  }

  const normalizedSlug = slug ? slugify(slug) : slugify(title);
  if (!normalizedSlug) {
    throw new ApiError(400, 'Valid module title or slug is required');
  }

  const existing = await Module.findOne({ slug: normalizedSlug }).lean();
  if (existing) {
    throw new ApiError(409, 'A module with this slug already exists');
  }

  const moduleDoc = await Module.create({
    title: title.trim(),
    slug: normalizedSlug,
    ...(description !== undefined ? { description: String(description).trim() } : {}),
    ...(order !== undefined ? { order: Number(order) } : {}),
    ...(icon !== undefined ? { icon: String(icon).trim() } : {}),
    ...(difficulty !== undefined ? { difficulty } : {}),
    ...(estimatedHours !== undefined ? { estimatedHours: Number(estimatedHours) } : {}),
    ...(isPublished !== undefined ? { isPublished: Boolean(isPublished) } : {}),
    createdBy: req.user._id,
  });

  return res.status(201).json({
    success: true,
    message: 'Module created successfully',
    data: moduleDoc,
  });
});

/**
 * Update an existing module (Admin only).
 * PUT /api/modules/:id
 */
export const updateModule = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) {
    throw new ApiError(400, 'Invalid module ID');
  }

  const moduleDoc = await Module.findById(id);
  if (!moduleDoc) {
    throw new ApiError(404, 'Module not found');
  }

  const {
    title,
    slug,
    description,
    order,
    icon,
    difficulty,
    estimatedHours,
    isPublished,
    isArchived,
  } = req.body;

  if (slug !== undefined) {
    const normalizedSlug = slugify(slug);
    if (!normalizedSlug) {
      throw new ApiError(400, 'Slug cannot be empty');
    }
    const conflict = await Module.findOne({
      slug: normalizedSlug,
      _id: { $ne: moduleDoc._id },
    }).lean();
    if (conflict) {
      throw new ApiError(409, 'Another module already uses this slug');
    }
    moduleDoc.slug = normalizedSlug;
  }

  if (title !== undefined) {
    if (typeof title !== 'string' || !title.trim()) {
      throw new ApiError(400, 'Module title cannot be empty');
    }
    moduleDoc.title = title.trim();
  }
  if (description !== undefined) moduleDoc.description = String(description).trim();
  if (order !== undefined) moduleDoc.order = Number(order);
  if (icon !== undefined) moduleDoc.icon = String(icon).trim();
  if (difficulty !== undefined) moduleDoc.difficulty = difficulty;
  if (estimatedHours !== undefined) moduleDoc.estimatedHours = Number(estimatedHours);
  if (isPublished !== undefined) moduleDoc.isPublished = Boolean(isPublished);
  if (isArchived !== undefined) moduleDoc.isArchived = Boolean(isArchived);

  await moduleDoc.save();

  return res.status(200).json({
    success: true,
    message: 'Module updated successfully',
    data: moduleDoc,
  });
});

/**
 * Soft-delete (archive) a module (Admin only).
 * DELETE /api/modules/:id
 */
export const deleteModule = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) {
    throw new ApiError(400, 'Invalid module ID');
  }

  const moduleDoc = await Module.findById(id);
  if (!moduleDoc) {
    throw new ApiError(404, 'Module not found');
  }

  moduleDoc.isArchived = true;
  moduleDoc.isPublished = false;
  await moduleDoc.save();

  return res.status(200).json({
    success: true,
    message: 'Module archived successfully',
    data: moduleDoc,
  });
});

export default {
  getModules,
  getModule,
  createModule,
  updateModule,
  deleteModule,
};
