import mongoose from 'mongoose';
import { LANGUAGE_KEYS, VERDICTS, VERDICT_VALUES } from '../config/constants.js';

const submissionSchema = new mongoose.Schema(
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
      required: [true, 'Source code is required'],
    },
    verdict: {
      type: String,
      enum: VERDICT_VALUES,
      default: VERDICTS.PENDING,
    },
    runtime: {
      type: Number,
      default: 0,
      min: [0, 'Runtime cannot be negative'],
    },
    memory: {
      type: Number,
      default: 0,
      min: [0, 'Memory cannot be negative'],
    },
    passedTestCases: {
      type: Number,
      default: 0,
      min: [0, 'Passed test cases cannot be negative'],
    },
    totalTestCases: {
      type: Number,
      default: 0,
      min: [0, 'Total test cases cannot be negative'],
    },
    errorMessage: {
      type: String,
      default: '',
    },
    compilerOutput: {
      type: String,
      default: '',
    },
    submittedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

submissionSchema.index({ user: 1, problem: 1, submittedAt: -1 });
submissionSchema.index({ user: 1, verdict: 1 });
submissionSchema.index({ problem: 1, verdict: 1 });

const Submission = mongoose.model('Submission', submissionSchema);

export default Submission;
