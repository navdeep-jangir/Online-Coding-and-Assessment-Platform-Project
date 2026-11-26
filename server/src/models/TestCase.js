import mongoose from 'mongoose';

const testCaseSchema = new mongoose.Schema(
  {
    problem: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Problem',
      required: [true, 'Problem reference is required'],
    },
    input: {
      type: String,
      default: '',
    },
    expectedOutput: {
      type: String,
      required: [
        function () {
          return typeof this.expectedOutput !== 'string';
        },
        'Expected output is required',
      ],
    },
    isSample: {
      type: Boolean,
      default: false,
    },
    order: {
      type: Number,
      default: 0,
      min: [0, 'Order must be a non-negative number'],
    },
    explanation: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

testCaseSchema.index({ problem: 1, isSample: 1, order: 1 });

const TestCase = mongoose.model('TestCase', testCaseSchema);

export default TestCase;
