import mongoose from 'mongoose';
import Topic from '../models/Topic.js';
import Module from '../models/Module.js';
import Note from '../models/Note.js';
import Bookmark from '../models/Bookmark.js';
import UserProgress from '../models/UserProgress.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';
import slugify from '../utils/slugify.js';
import { detectCycle } from '../utils/dsaAlgorithms.js';
import { logAdminAction } from './adminController.js';

/**
 * Get topics (optionally filtered by module ID or slug) with optional user progress.
 * GET /api/topics
 */
export const getTopics = asyncHandler(async (req, res) => {
  const moduleParam = req.query.module || req.query.moduleId;
  const filter = { isArchived: { $ne: true } };

  if (moduleParam) {
    if (mongoose.isValidObjectId(moduleParam)) {
      filter.module = moduleParam;
    } else {
      const mod = await Module.findOne({
        slug: String(moduleParam).toLowerCase(),
        isArchived: { $ne: true },
      })
        .select('_id')
        .lean();

      if (!mod) {
        throw new ApiError(400, 'Invalid module identifier');
      }
      filter.module = mod._id;
    }
  }

  const topics = await Topic.find(filter)
    .populate('module', 'title slug order')
    .sort({ order: 1, createdAt: 1 })
    .lean();

  const progressMap = new Map();
  if (req.user && topics.length > 0) {
    const topicIds = topics.map((t) => t._id);
    const progressDocs = await UserProgress.find({
      user: req.user._id,
      topic: { $in: topicIds },
      isCompleted: true,
    })
      .select('topic completedAt')
      .lean();

    for (const doc of progressDocs) {
      progressMap.set(String(doc.topic), doc.completedAt);
    }
  }

  const data = topics.map((topic) => {
    const completedAt = progressMap.get(String(topic._id)) || null;
    return {
      ...topic,
      isCompleted: req.user ? Boolean(completedAt) : false,
      completedAt: req.user ? completedAt : null,
    };
  });

  return res.status(200).json({
    success: true,
    data,
  });
});

/**
 * Get a single topic with resources, optional note, and user progress.
 * GET /api/topics/:id
 */
export const getTopic = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const queryFilter = mongoose.isValidObjectId(id)
    ? { _id: id, isArchived: { $ne: true } }
    : { slug: String(id).toLowerCase(), isArchived: { $ne: true } };

  const topic = await Topic.findOne(queryFilter)
    .populate('module', 'title slug order')
    .lean();
  if (!topic) {
    throw new ApiError(404, 'Topic not found');
  }

  const [note, userProgress, moduleTopics] = await Promise.all([
    Note.findOne({ topic: topic._id }).populate('relatedProblems', 'title slug difficulty').lean(),
    req.user
      ? UserProgress.findOne({ user: req.user._id, topic: topic._id }).lean()
      : Promise.resolve(null),
    Topic.find({ module: topic.module?._id || topic.module, isArchived: { $ne: true } })
      .sort({ order: 1, createdAt: 1 })
      .select('slug title order')
      .lean(),
  ]);

  const idx = moduleTopics.findIndex((t) => String(t._id) === String(topic._id));
  const prevTopic = idx > 0 ? { slug: moduleTopics[idx - 1].slug, title: moduleTopics[idx - 1].title } : null;
  const nextTopic =
    idx >= 0 && idx < moduleTopics.length - 1
      ? { slug: moduleTopics[idx + 1].slug, title: moduleTopics[idx + 1].title }
      : null;

  const isCompleted = Boolean(userProgress?.isCompleted);

  return res.status(200).json({
    success: true,
    data: {
      ...topic,
      note: note || null,
      prevTopic,
      nextTopic,
      progress: req.user
        ? {
            isCompleted,
            completedAt: isCompleted ? userProgress.completedAt : null,
          }
        : null,
    },
  });
});

/**
 * Create a new topic under a module (Admin only).
 * POST /api/topics
 */
export const createTopic = asyncHandler(async (req, res) => {
  const moduleId = req.body.module || req.body.moduleId;
  const { title, slug, description, order, difficulty, estimatedMinutes, resources, problems } =
    req.body;

  if (!title || typeof title !== 'string' || !title.trim()) {
    throw new ApiError(400, 'Topic title is required');
  }
  if (!moduleId || !mongoose.isValidObjectId(moduleId)) {
    throw new ApiError(400, 'A valid module ID is required');
  }

  const parentModule = await Module.findOne({
    _id: moduleId,
    isArchived: { $ne: true },
  }).lean();
  if (!parentModule) {
    throw new ApiError(404, 'Parent module not found');
  }

  const normalizedSlug = slug ? slugify(slug) : slugify(title);
  if (!normalizedSlug) {
    throw new ApiError(400, 'Valid topic title or slug is required');
  }

  const duplicate = await Topic.findOne({
    module: moduleId,
    slug: normalizedSlug,
  }).lean();
  if (duplicate) {
    throw new ApiError(409, 'A topic with this slug already exists in this module');
  }

  const topic = await Topic.create({
    module: moduleId,
    title: title.trim(),
    slug: normalizedSlug,
    ...(description !== undefined ? { description: String(description).trim() } : {}),
    ...(order !== undefined ? { order: Number(order) } : {}),
    ...(difficulty !== undefined ? { difficulty } : {}),
    ...(estimatedMinutes !== undefined ? { estimatedMinutes: Number(estimatedMinutes) } : {}),
    ...(Array.isArray(resources) ? { resources } : {}),
    ...(Array.isArray(problems) ? { problems } : {}),
    createdBy: req.user._id,
  });

  return res.status(201).json({
    success: true,
    message: 'Topic created successfully',
    data: topic,
  });
});

/**
 * Update an existing topic (Admin only).
 * PUT /api/topics/:id
 */
export const updateTopic = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) {
    throw new ApiError(400, 'Invalid topic ID');
  }

  const topic = await Topic.findById(id);
  if (!topic) {
    throw new ApiError(404, 'Topic not found');
  }

  const targetModuleId = req.body.module || req.body.moduleId;
  if (targetModuleId !== undefined) {
    if (!mongoose.isValidObjectId(targetModuleId)) {
      throw new ApiError(400, 'Invalid module ID');
    }
    const parentModule = await Module.findOne({
      _id: targetModuleId,
      isArchived: { $ne: true },
    }).lean();
    if (!parentModule) {
      throw new ApiError(404, 'Target module not found');
    }
    topic.module = targetModuleId;
  }

  const {
    title,
    slug,
    description,
    order,
    difficulty,
    estimatedMinutes,
    resources,
    problems,
    prerequisites,
    isArchived,
  } = req.body;

  if (title !== undefined) {
    if (typeof title !== 'string' || !title.trim()) {
      throw new ApiError(400, 'Topic title cannot be empty');
    }
    topic.title = title.trim();
  }

  if (slug !== undefined) {
    const normalizedSlug = slugify(slug);
    if (!normalizedSlug) {
      throw new ApiError(400, 'Slug cannot be empty');
    }
    topic.slug = normalizedSlug;
  }

  if (slug !== undefined || targetModuleId !== undefined) {
    const conflict = await Topic.findOne({
      module: topic.module,
      slug: topic.slug,
      _id: { $ne: topic._id },
    }).lean();
    if (conflict) {
      throw new ApiError(409, 'Another topic with this slug exists in the target module');
    }
  }

  if (description !== undefined) topic.description = String(description).trim();
  if (order !== undefined) topic.order = Number(order);
  if (difficulty !== undefined) topic.difficulty = difficulty;
  if (estimatedMinutes !== undefined) topic.estimatedMinutes = Number(estimatedMinutes);
  if (resources !== undefined) topic.resources = resources;
  if (problems !== undefined) topic.problems = problems;
  if (prerequisites !== undefined) {
    const cleanPrereqs = Array.isArray(prerequisites)
      ? prerequisites.filter((p) => mongoose.isValidObjectId(p))
      : [];
    const allTopics = await Topic.find({}).select('_id prerequisites').lean();
    const adj = new Map();
    for (const t of allTopics) adj.set(String(t._id), []);
    for (const t of allTopics) {
      const tid = String(t._id);
      const list = tid === String(topic._id) ? cleanPrereqs : t.prerequisites || [];
      for (const p of list) {
        const pid = String(p?._id || p);
        if (!adj.has(pid)) adj.set(pid, []);
        adj.get(pid).push(tid);
      }
    }
    if (detectCycle(adj)) {
      throw new ApiError(400, 'Circular prerequisite detected! Cannot save cyclic topic prerequisites.');
    }
    topic.prerequisites = cleanPrereqs;
  }
  if (isArchived !== undefined) topic.isArchived = Boolean(isArchived);

  await topic.save();

  if (req.user?._id) {
    await logAdminAction(
      req.user._id,
      resources !== undefined ? 'UPDATE_TOPIC_RESOURCES' : 'UPDATE_TOPIC',
      'Topic',
      topic._id,
      { title: topic.title, slug: topic.slug }
    );
  }

  return res.status(200).json({
    success: true,
    message: 'Topic updated successfully',
    data: topic,
  });
});

/**
 * Delete a topic and clean up associated progress, notes, and bookmarks (Admin only).
 * DELETE /api/topics/:id
 */
export const deleteTopic = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) {
    throw new ApiError(400, 'Invalid topic ID');
  }

  const topic = await Topic.findByIdAndDelete(id);
  if (!topic) {
    throw new ApiError(404, 'Topic not found');
  }

  await Promise.all([
    UserProgress.deleteMany({ topic: topic._id }),
    Note.deleteMany({ topic: topic._id }),
    Bookmark.deleteMany({ targetType: 'topic', targetId: topic._id }),
  ]);

  return res.status(200).json({
    success: true,
    message: 'Topic deleted successfully',
    data: null,
  });
});

/**
 * Toggle (or explicitly set) topic completion for the authenticated user.
 * PUT /api/topics/:id/progress
 */
export const updateProgress = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) {
    throw new ApiError(400, 'Invalid topic ID');
  }

  const topic = await Topic.findOne({
    _id: id,
    isArchived: { $ne: true },
  }).lean();
  if (!topic) {
    throw new ApiError(404, 'Topic not found');
  }

  const existing = await UserProgress.findOne({
    user: req.user._id,
    topic: topic._id,
  });

  const requestedCompleted =
    typeof req.body?.isCompleted === 'boolean'
      ? req.body.isCompleted
      : typeof req.body?.completed === 'boolean'
        ? req.body.completed
        : undefined;
  const hasCompletedParam = requestedCompleted !== undefined;
  const extUpdate = req.body?.selfReportedExternal;

  const nextCompleted = hasCompletedParam
    ? requestedCompleted
    : extUpdate
      ? Boolean(existing?.isCompleted)
      : existing
        ? !existing.isCompleted
        : true;

  const completedAt = nextCompleted ? existing?.completedAt || new Date() : null;
  const nextExternal = {
    codechef:
      typeof extUpdate?.codechef === 'boolean'
        ? extUpdate.codechef
        : Boolean(existing?.selfReportedExternal?.codechef),
    leetcode:
      typeof extUpdate?.leetcode === 'boolean'
        ? extUpdate.leetcode
        : Boolean(existing?.selfReportedExternal?.leetcode),
  };

  let progressDoc;
  if (existing) {
    existing.isCompleted = nextCompleted;
    existing.completedAt = completedAt;
    existing.selfReportedExternal = nextExternal;
    progressDoc = await existing.save();
  } else {
    progressDoc = await UserProgress.create({
      user: req.user._id,
      topic: topic._id,
      isCompleted: nextCompleted,
      completedAt,
      selfReportedExternal: nextExternal,
    });
  }

  return res.status(200).json({
    success: true,
    message: nextCompleted ? 'Topic marked as completed' : 'Topic marked as incomplete',
    data: {
      topic: topic._id,
      module: topic.module,
      isCompleted: progressDoc.isCompleted,
      completed: progressDoc.isCompleted,
      completedAt: progressDoc.completedAt,
      selfReportedExternal: progressDoc.selfReportedExternal,
    },
  });
});

export default {
  getTopics,
  getTopic,
  createTopic,
  updateTopic,
  deleteTopic,
  updateProgress,
};
