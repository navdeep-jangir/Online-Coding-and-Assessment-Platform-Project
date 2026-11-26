import mongoose from 'mongoose';
import Bookmark, { BOOKMARK_MODEL_MAP } from '../models/Bookmark.js';
import Topic from '../models/Topic.js';
import Note from '../models/Note.js';
import Module from '../models/Module.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';

const VALID_TYPES = Object.keys(BOOKMARK_MODEL_MAP);

const REGISTERED_MODELS = {
  Topic,
  Note,
  Module,
};

const getTargetModel = (modelName) =>
  mongoose.models[modelName] || REGISTERED_MODELS[modelName] || null;

const parseBookmarkTarget = (source = {}) => {
  const type = String(source.type || source.targetType || '')
    .toLowerCase()
    .trim();
  const targetId = source.targetId || source.itemId;

  if (!type || !BOOKMARK_MODEL_MAP[type]) {
    throw new ApiError(
      400,
      `Bookmark type must be one of: ${VALID_TYPES.join(', ')}`
    );
  }
  if (!targetId || !mongoose.isValidObjectId(targetId)) {
    throw new ApiError(400, 'A valid targetId is required');
  }

  return {
    targetType: type,
    targetModel: BOOKMARK_MODEL_MAP[type],
    targetId,
  };
};

/**
 * Get authenticated user's bookmarks (optionally filtered by type) with populated target data.
 * GET /api/bookmarks
 */
export const getBookmarks = asyncHandler(async (req, res) => {
  const filter = { user: req.user._id };
  const rawType = req.query.type || req.query.targetType;

  if (rawType !== undefined && String(rawType).trim() !== '') {
    const normalizedType = String(rawType).toLowerCase().trim();
    if (!BOOKMARK_MODEL_MAP[normalizedType]) {
      throw new ApiError(
        400,
        `Bookmark type must be one of: ${VALID_TYPES.join(', ')}`
      );
    }
    filter.targetType = normalizedType;
  }

  const bookmarks = await Bookmark.find(filter).sort({ createdAt: -1 });

  // Populate only targets whose Mongoose model is currently registered.
  const populatable = bookmarks.filter((item) =>
    Boolean(getTargetModel(item.targetModel))
  );
  if (populatable.length > 0) {
    await Bookmark.populate(populatable, { path: 'targetId' });
  }

  return res.status(200).json({
    success: true,
    data: bookmarks,
  });
});

/**
 * Add or remove a bookmark for the authenticated user.
 * POST /api/bookmarks/toggle
 */
export const toggleBookmark = asyncHandler(async (req, res) => {
  const { targetType, targetModel, targetId } = parseBookmarkTarget(req.body);

  const TargetModel = getTargetModel(targetModel);
  if (TargetModel) {
    const targetExists =
      typeof TargetModel.exists === 'function'
        ? await TargetModel.exists({ _id: targetId })
        : await TargetModel.findById(targetId).select('_id').lean();
    if (!targetExists) {
      throw new ApiError(404, `${targetModel} not found`);
    }
  }

  const existing = await Bookmark.findOne({
    user: req.user._id,
    targetType,
    targetId,
  });

  if (existing) {
    await existing.deleteOne();
    return res.status(200).json({
      success: true,
      message: 'Bookmark removed',
      data: {
        bookmarked: false,
        targetType,
        targetId,
      },
    });
  }

  const bookmark = await Bookmark.create({
    user: req.user._id,
    targetType,
    targetModel,
    targetId,
    ...(req.body.notes !== undefined ? { notes: String(req.body.notes).trim() } : {}),
  });

  return res.status(201).json({
    success: true,
    message: 'Bookmark added',
    data: {
      bookmarked: true,
      bookmark,
    },
  });
});

/**
 * Check whether a specific item is bookmarked by the authenticated user.
 * GET /api/bookmarks/check
 */
export const checkBookmark = asyncHandler(async (req, res) => {
  const { targetType, targetId } = parseBookmarkTarget(req.query);

  const bookmark = await Bookmark.findOne({
    user: req.user._id,
    targetType,
    targetId,
  })
    .select('_id')
    .lean();

  return res.status(200).json({
    success: true,
    data: {
      bookmarked: Boolean(bookmark),
      bookmarkId: bookmark?._id || null,
    },
  });
});

export default {
  getBookmarks,
  toggleBookmark,
  checkBookmark,
};
