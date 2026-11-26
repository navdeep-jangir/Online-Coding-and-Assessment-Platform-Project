import mongoose from 'mongoose';

const noteSchema = new mongoose.Schema(
  {
    topic: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Topic',
      required: [true, 'Topic reference is required'],
    },
    title: {
      type: String,
      required: [true, 'Note title is required'],
      trim: true,
      maxlength: [200, 'Note title cannot exceed 200 characters'],
    },
    content: {
      type: String,
      default: '',
    },
    definition: {
      type: String,
      default: '',
    },
    explanation: {
      type: String,
      default: '',
    },
    realWorldAnalogy: {
      type: String,
      default: '',
    },
    algorithm: {
      type: String,
      default: '',
    },
    pseudocode: {
      type: String,
      default: '',
    },
    dryRunExample: {
      type: String,
      default: '',
    },
    timeComplexity: {
      type: String,
      default: '',
    },
    spaceComplexity: {
      type: String,
      default: '',
    },
    commonMistakes: {
      type: [String],
      default: [],
    },
    interviewTips: {
      type: [String],
      default: [],
    },
    implementations: {
      c: { type: String, default: '' },
      cpp: { type: String, default: '' },
      java: { type: String, default: '' },
      python: { type: String, default: '' },
    },
    relatedProblems: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Problem',
      },
    ],
  },
  {
    timestamps: true,
  }
);

noteSchema.index({ topic: 1 });

const Note = mongoose.model('Note', noteSchema);

export default Note;
