import mongoose from 'mongoose';
import { REVISION_STATUSES } from '../config/constants.js';

const revisionSchema = new mongoose.Schema(
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
    incorrectAttempts: {
      type: Number,
      default: 0,
      min: [0, 'Incorrect attempts cannot be negative'],
    },
    lastAttemptDate: {
      type: Date,
      default: null,
    },
    lastSuccessfulRevision: {
      type: Date,
      default: null,
    },
    revisionReason: {
      type: String,
      enum: [
        'wrong_answer',
        'compilation_error',
        'runtime_error',
        'time_limit_exceeded',
        'memory_limit_exceeded',
        'difficult',
        'manual',
        'incorrect',
      ],
      default: 'wrong_answer',
    },
    revisionStatus: {
      type: String,
      enum: REVISION_STATUSES,
      default: 'pending',
    },
    nextRevisionDate: {
      type: Date,
      default: null,
    },
    isManual: {
      type: Boolean,
      default: false,
    },
    markedDifficult: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

revisionSchema.index({ user: 1, problem: 1 }, { unique: true });
revisionSchema.index({ user: 1, revisionStatus: 1, nextRevisionDate: 1 });

const Revision = mongoose.model('Revision', revisionSchema);

export default Revision;
