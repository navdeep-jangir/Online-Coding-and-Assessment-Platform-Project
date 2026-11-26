import mongoose from 'mongoose';
import { CONCEPT_TYPES, DIFFICULTIES } from '../config/constants.js';
import slugify from '../utils/slugify.js';

const resourceLinkSchema = new mongoose.Schema(
  {
    url: {
      type: String,
      trim: true,
      default: '',
    },
    title: {
      type: String,
      trim: true,
      default: '',
    },
    channel: {
      type: String,
      trim: true,
      default: '',
    },
    language: {
      type: String,
      trim: true,
      default: '',
    },
    difficulty: {
      type: String,
      trim: true,
      default: '',
    },
    verified: {
      type: Boolean,
      default: false,
    },
  },
  { _id: false }
);

const topicSchema = new mongoose.Schema(
  {
    module: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Module',
      required: [true, 'Module reference is required'],
    },
    title: {
      type: String,
      required: [true, 'Topic title is required'],
      trim: true,
      maxlength: [200, 'Topic title cannot exceed 200 characters'],
    },
    slug: {
      type: String,
      required: [true, 'Topic slug is required'],
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
      required: [true, 'Topic order is required'],
      min: [0, 'Order must be a non-negative number'],
    },
    difficulty: {
      type: String,
      enum: DIFFICULTIES,
      default: 'Easy',
    },
    conceptType: {
      type: String,
      enum: CONCEPT_TYPES,
      default: 'both',
    },
    resources: {
      codechef: {
        type: resourceLinkSchema,
        default: () => ({}),
      },
      codechefLinks: {
        type: [resourceLinkSchema],
        default: [],
      },
      leetcode: {
        type: resourceLinkSchema,
        default: () => ({}),
      },
      leetcodeLinks: {
        type: [resourceLinkSchema],
        default: [],
      },
      youtube: {
        type: [resourceLinkSchema],
        default: [],
      },
    },
    hasNotes: {
      type: Boolean,
      default: false,
    },
    prerequisites: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Topic',
      },
    ],
  },
  {
    timestamps: true,
  }
);

topicSchema.index({ module: 1, order: 1 });
topicSchema.index({ module: 1, slug: 1 }, { unique: true });
topicSchema.index({ slug: 1 });

topicSchema.pre('validate', function () {
  if (!this.slug && this.title) {
    this.slug = slugify(this.title);
  }
});

const Topic = mongoose.model('Topic', topicSchema);

export default Topic;
