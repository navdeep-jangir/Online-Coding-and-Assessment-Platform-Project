import mongoose from 'mongoose';
import Note from '../models/Note.js';
import Topic from '../models/Topic.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';
import { logAdminAction } from './adminController.js';

/**
 * Get the study note for a specific topic.
 * GET /api/notes/topic/:topicId
 */
export const getNoteByTopic = asyncHandler(async (req, res) => {
  const { topicId } = req.params;
  if (!mongoose.isValidObjectId(topicId)) {
    throw new ApiError(400, 'Invalid topic ID');
  }

  const note = await Note.findOne({ topic: topicId })
    .populate('topic', 'title slug module')
    .lean();

  if (!note) {
    throw new ApiError(404, 'Note not found for this topic');
  }

  return res.status(200).json({
    success: true,
    data: note,
  });
});

/**
 * Create a study note for a topic (Admin only).
 * POST /api/notes
 */
export const createNote = asyncHandler(async (req, res) => {
  const topicId = req.body.topic || req.body.topicId;
  const { title, content, summary, codeExamples, keyTakeaways } = req.body;

  if (!topicId || !mongoose.isValidObjectId(topicId)) {
    throw new ApiError(400, 'A valid topic ID is required');
  }
  if (!title || typeof title !== 'string' || !title.trim()) {
    throw new ApiError(400, 'Note title is required');
  }
  if (!content || typeof content !== 'string' || !content.trim()) {
    throw new ApiError(400, 'Note content is required');
  }

  const topicExists = await Topic.findOne({
    _id: topicId,
    isArchived: { $ne: true },
  }).lean();
  if (!topicExists) {
    throw new ApiError(404, 'Topic not found');
  }

  const existingNote = await Note.findOne({ topic: topicId }).lean();
  if (existingNote) {
    throw new ApiError(409, 'A note already exists for this topic');
  }

  const note = await Note.create({
    topic: topicId,
    title: title.trim(),
    content,
    ...(summary !== undefined ? { summary: String(summary).trim() } : {}),
    ...(Array.isArray(codeExamples) ? { codeExamples } : {}),
    ...(Array.isArray(keyTakeaways) ? { keyTakeaways } : {}),
    createdBy: req.user._id,
    updatedBy: req.user._id,
  });

  return res.status(201).json({
    success: true,
    message: 'Note created successfully',
    data: note,
  });
});

/**
 * Update an existing note (Admin only).
 * PUT /api/notes/:id
 */
export const updateNote = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) {
    throw new ApiError(400, 'Invalid note ID');
  }

  const note = await Note.findById(id);
  if (!note) {
    throw new ApiError(404, 'Note not found');
  }

  const { title, content, summary, codeExamples, keyTakeaways } = req.body;

  if (title !== undefined) {
    if (typeof title !== 'string' || !title.trim()) {
      throw new ApiError(400, 'Note title cannot be empty');
    }
    note.title = title.trim();
  }
  if (content !== undefined) {
    if (typeof content !== 'string' || !content.trim()) {
      throw new ApiError(400, 'Note content cannot be empty');
    }
    note.content = content;
  }
  if (summary !== undefined) note.summary = String(summary).trim();
  if (codeExamples !== undefined) note.codeExamples = codeExamples;
  if (keyTakeaways !== undefined) note.keyTakeaways = keyTakeaways;
  note.updatedBy = req.user._id;

  await note.save();

  if (req.user?._id) {
    await logAdminAction(req.user._id, 'UPDATE_NOTE', 'Note', note._id, {
      title: note.title,
      topicId: String(note.topic),
    });
  }

  return res.status(200).json({
    success: true,
    message: 'Note updated successfully',
    data: note,
  });
});

export default {
  getNoteByTopic,
  createNote,
  updateNote,
};
