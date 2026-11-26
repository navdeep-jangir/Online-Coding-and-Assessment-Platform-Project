import mongoose from 'mongoose';
import { DIFFICULTIES } from '../config/constants.js';

const dailyChallengeSchema = new mongoose.Schema(
  {
    date: {
      type: Date,
      required: [true, 'Daily challenge date is required'],
      unique: true,
    },
    problem: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Problem',
      required: [true, 'Problem reference is required'],
    },
    difficulty: {
      type: String,
      enum: DIFFICULTIES,
      required: [true, 'Difficulty is required'],
    },
  },
  {
    timestamps: true,
  }
);

dailyChallengeSchema.index({ date: -1 });

const DailyChallenge = mongoose.model('DailyChallenge', dailyChallengeSchema);

export default DailyChallenge;
