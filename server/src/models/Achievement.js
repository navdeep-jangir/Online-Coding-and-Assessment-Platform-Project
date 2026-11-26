import mongoose from 'mongoose';

const achievementSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: [true, 'Achievement key is required'],
      unique: true,
      trim: true,
      lowercase: true,
    },
    title: {
      type: String,
      required: [true, 'Achievement title is required'],
      trim: true,
      maxlength: [150, 'Achievement title cannot exceed 150 characters'],
    },
    description: {
      type: String,
      required: [true, 'Achievement description is required'],
      trim: true,
    },
    iconName: {
      type: String,
      trim: true,
      default: 'Award',
    },
    criteria: {
      type: {
        type: String,
        required: [true, 'Achievement criteria type is required'],
        trim: true,
      },
      threshold: {
        type: Number,
        required: [true, 'Achievement criteria threshold is required'],
        min: [0, 'Threshold cannot be negative'],
      },
    },
    xpReward: {
      type: Number,
      default: 0,
      min: [0, 'XP reward cannot be negative'],
    },
  },
  {
    timestamps: true,
  }
);

const Achievement = mongoose.model('Achievement', achievementSchema);

export default Achievement;
