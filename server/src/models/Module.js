import mongoose from 'mongoose';
import { DIFFICULTIES } from '../config/constants.js';
import slugify from '../utils/slugify.js';

const moduleSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Module title is required'],
      trim: true,
      maxlength: [150, 'Module title cannot exceed 150 characters'],
    },
    slug: {
      type: String,
      required: [true, 'Module slug is required'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    order: {
      type: Number,
      required: [true, 'Module order is required'],
      min: [0, 'Order must be a non-negative number'],
    },
    difficulty: {
      type: String,
      enum: DIFFICULTIES,
      default: 'Easy',
    },
    prerequisites: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Module',
      },
    ],
    totalConcepts: {
      type: Number,
      default: 0,
      min: [0, 'Total concepts cannot be negative'],
    },
    iconName: {
      type: String,
      trim: true,
      default: 'BookOpen',
    },
  },
  {
    timestamps: true,
  }
);

moduleSchema.index({ order: 1 });

moduleSchema.pre('validate', function () {
  if (!this.slug && this.title) {
    this.slug = slugify(this.title);
  }
});

const Module = mongoose.model('Module', moduleSchema);

export default Module;
