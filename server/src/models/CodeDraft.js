import mongoose from 'mongoose';
import { LANGUAGE_KEYS } from '../config/constants.js';

const codeDraftSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User reference is required'],
    },
    problem: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Problem',
      required: [true, 'Problem reference is required'],
    },
    language: {
      type: String,
      enum: LANGUAGE_KEYS,
      required: [true, 'Programming language is required'],
    },
    code: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

codeDraftSchema.index({ user: 1, problem: 1, language: 1 }, { unique: true });

const CodeDraft = mongoose.model('CodeDraft', codeDraftSchema);

export default CodeDraft;
