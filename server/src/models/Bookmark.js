import mongoose from 'mongoose';
import { BOOKMARK_TARGETS } from '../config/constants.js';

export const BOOKMARK_MODEL_MAP = Object.freeze({
  problem: 'Problem',
  topic: 'Topic',
  note: 'Note',
});

const bookmarkSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User reference is required'],
    },
    targetType: {
      type: String,
      enum: BOOKMARK_TARGETS,
      required: [true, 'Target type is required'],
    },
    targetId: {
      type: mongoose.Schema.Types.ObjectId,
      required: [true, 'Target ID is required'],
    },
  },
  {
    timestamps: true,
  }
);

bookmarkSchema.index({ user: 1, targetType: 1, targetId: 1 }, { unique: true });
bookmarkSchema.index({ user: 1, createdAt: -1 });

const Bookmark = mongoose.model('Bookmark', bookmarkSchema);

export default Bookmark;
