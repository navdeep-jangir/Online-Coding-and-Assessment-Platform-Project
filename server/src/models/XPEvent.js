import mongoose from 'mongoose';
import { XP_SOURCES } from '../config/constants.js';

const xpEventSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User reference is required'],
    },
    amount: {
      type: Number,
      required: [true, 'XP amount is required'],
      min: [0, 'XP amount cannot be negative'],
    },
    source: {
      type: String,
      enum: XP_SOURCES,
      required: [true, 'XP source is required'],
    },
    sourceId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

xpEventSchema.index({ user: 1, createdAt: -1 });
xpEventSchema.index({ user: 1, source: 1, sourceId: 1 });

const XPEvent = mongoose.model('XPEvent', xpEventSchema);

export default XPEvent;
