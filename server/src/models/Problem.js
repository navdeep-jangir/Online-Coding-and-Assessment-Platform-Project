import mongoose from 'mongoose';
import { DIFFICULTIES } from '../config/constants.js';

const exampleSchema = new mongoose.Schema(
  {
    input: {
      type: String,
      default: '',
    },
    output: {
      type: String,
      required: [
        function () {
          return typeof this.output !== 'string';
        },
        'Example output is required',
      ],
    },
    explanation: {
      type: String,
      default: '',
    },
  },
  { _id: false }
);

const problemSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Problem title is required'],
      trim: true,
      maxlength: [200, 'Problem title cannot exceed 200 characters'],
    },
    slug: {
      type: String,
      required: [true, 'Problem slug is required'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Problem description is required'],
    },
    inputFormat: {
      type: String,
      default: '',
    },
    outputFormat: {
      type: String,
      default: '',
    },
    constraints: {
      type: String,
      default: '',
    },
    examples: {
      type: [exampleSchema],
      default: [],
    },
    difficulty: {
      type: String,
      enum: DIFFICULTIES,
      required: [true, 'Problem difficulty is required'],
    },
    topics: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Topic',
      },
    ],
    tags: {
      type: [String],
      default: [],
    },
    hints: {
      type: [String],
      default: [],
    },
    starterCode: {
      c: { type: String, default: '' },
      cpp: { type: String, default: '' },
      java: { type: String, default: '' },
      python: { type: String, default: '' },
    },
    referenceSolutions: {
      c: { type: String, default: '' },
      cpp: { type: String, default: '' },
      java: { type: String, default: '' },
      python: { type: String, default: '' },
    },
    validationStatus: {
      c: { type: String, enum: ['untested', 'passed', 'failed'], default: 'untested' },
      cpp: { type: String, enum: ['untested', 'passed', 'failed'], default: 'untested' },
      java: { type: String, enum: ['untested', 'passed', 'failed'], default: 'untested' },
      python: { type: String, enum: ['untested', 'passed', 'failed'], default: 'untested' },
      isValidated: { type: Boolean, default: false },
      lastValidatedAt: { type: Date, default: null },
    },
    requiresRevalidation: {
      type: Boolean,
      default: false,
    },
    editorial: {
      type: String,
      default: '',
    },
    timeLimit: {
      type: Number,
      default: 2000,
      min: [100, 'Time limit must be at least 100ms'],
      max: [30000, 'Time limit cannot exceed 30000ms'],
    },
    memoryLimit: {
      type: Number,
      default: 262144,
      min: [16384, 'Memory limit must be at least 16384KB'],
    },
    isPublished: {
      type: Boolean,
      default: true,
    },
    isArchived: {
      type: Boolean,
      default: false,
      index: true,
    },
    archivedAt: {
      type: Date,
      default: null,
    },
    order: {
      type: Number,
      default: 0,
      min: [0, 'Order must be a non-negative number'],
    },
  },
  {
    timestamps: true,
  }
);

problemSchema.index({ difficulty: 1, isPublished: 1 });
problemSchema.index({ topics: 1 });
problemSchema.index({ tags: 1 });
problemSchema.index({ order: 1 });
problemSchema.index({ title: 'text', tags: 'text' });

const Problem = mongoose.model('Problem', problemSchema);

export default Problem;
