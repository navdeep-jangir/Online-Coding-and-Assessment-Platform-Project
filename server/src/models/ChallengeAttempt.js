import mongoose from 'mongoose';

const challengeAttemptSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User reference is required'],
    },
    dailyChallenge: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'DailyChallenge',
      required: [true, 'Daily challenge reference is required'],
    },
    problem: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Problem',
      default: null,
    },
    date: {
      type: Date,
      required: [true, 'Attempt date is required'],
    },
    dateKey: {
      type: String,
      trim: true,
      default: null,
    },
    difficultyPreference: {
      type: String,
      enum: ['Auto', 'Easy', 'Medium', 'Hard'],
      default: 'Auto',
    },
    isCompleted: {
      type: Boolean,
      default: false,
    },
    completedAt: {
      type: Date,
      default: null,
    },
    xpAwarded: {
      type: Boolean,
      default: false,
    },
    xpAmount: {
      type: Number,
      default: 0,
    },
    submission: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Submission',
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

challengeAttemptSchema.index({ user: 1, dailyChallenge: 1 }, { unique: true });
challengeAttemptSchema.index({ user: 1, dateKey: 1 }, { unique: true, sparse: true });
challengeAttemptSchema.index({ user: 1, date: -1 });

const ChallengeAttempt = mongoose.model('ChallengeAttempt', challengeAttemptSchema);

export default ChallengeAttempt;
