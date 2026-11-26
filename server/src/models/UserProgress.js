import mongoose from 'mongoose';

const userProgressSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User reference is required'],
    },
    topic: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Topic',
      required: [true, 'Topic reference is required'],
    },
    isCompleted: {
      type: Boolean,
      default: false,
    },
    completedAt: {
      type: Date,
      default: null,
    },
    selfReportedExternal: {
      codechef: {
        type: Boolean,
        default: false,
      },
      leetcode: {
        type: Boolean,
        default: false,
      },
    },
  },
  {
    timestamps: true,
  }
);

userProgressSchema.index({ user: 1, topic: 1 }, { unique: true });
userProgressSchema.index({ user: 1, isCompleted: 1 });

const UserProgress = mongoose.model('UserProgress', userProgressSchema);

export default UserProgress;
