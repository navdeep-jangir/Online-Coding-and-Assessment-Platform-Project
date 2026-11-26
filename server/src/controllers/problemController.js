import Problem from '../models/Problem.js';
import TestCase from '../models/TestCase.js';
import Submission from '../models/Submission.js';
import CodeDraft from '../models/CodeDraft.js';
import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/ApiError.js';
import { logAdminAction } from './adminController.js';

/**
 * @desc    Get problems with pagination, filters, search
 * @route   GET /api/v1/problems
 * @access  Public (solved status requires auth)
 *
 * DSA usage: Binary search concept via MongoDB indexed queries on difficulty,
 * Hash set for tracking solved problem IDs - O(1) lookup per problem.
 */
export const getProblems = asyncHandler(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 20));
  const skip = (page - 1) * limit;

  const filter = { isPublished: true, isArchived: { $ne: true } };

  if (req.query.difficulty && ['Easy', 'Medium', 'Hard'].includes(req.query.difficulty)) {
    filter.difficulty = req.query.difficulty;
  }

  if (req.query.topic) {
    filter.topics = req.query.topic;
  }

  if (req.query.search) {
    filter.$text = { $search: req.query.search };
  }

  // Get solved problem IDs for the user (Hash Set for O(1) lookups)
  let solvedSet = new Set();
  if (req.user) {
    const solvedSubmissions = await Submission.distinct('problem', {
      user: req.user._id,
      verdict: 'Accepted',
    });
    solvedSet = new Set(solvedSubmissions.map(id => id.toString()));

    if (req.query.status === 'solved') {
      filter._id = { $in: [...solvedSet] };
    } else if (req.query.status === 'unsolved') {
      filter._id = { $nin: [...solvedSet] };
    }
  }

  const [problems, total] = await Promise.all([
    Problem.find(filter)
      .select('title slug difficulty tags order')
      .sort({ order: 1, createdAt: 1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Problem.countDocuments(filter),
  ]);

  const data = problems.map(p => ({
    ...p,
    isSolved: solvedSet.has(p._id.toString()),
  }));

  res.status(200).json({
    success: true,
    data,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  });
});

/**
 * @desc    Get distinct problem tags
 * @route   GET /api/v1/problems/tags
 * @access  Public
 */
export const getProblemTags = asyncHandler(async (_req, res) => {
  const tags = await Problem.distinct('tags', {
    isPublished: true,
    isArchived: { $ne: true },
  });
  res.status(200).json({
    success: true,
    data: tags.filter(Boolean).sort((a, b) => a.localeCompare(b)),
  });
});

/**
 * @desc    Get recommended problems based on weak topics
 * @route   GET /api/v1/problems/recommended
 * @access  Private
 */
export const getRecommendedProblems = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  // Find topics with low acceptance rate
  const submissions = await Submission.aggregate([
    { $match: { user: userId } },
    { $group: {
      _id: '$problem',
      total: { $sum: 1 },
      accepted: { $sum: { $cond: [{ $eq: ['$verdict', 'Accepted'] }, 1, 0] } },
    }},
  ]);

  const solvedIds = submissions.filter(s => s.accepted > 0).map(s => s._id);

  const problems = await Problem.find({
    isPublished: true,
    isArchived: { $ne: true },
    _id: { $nin: solvedIds },
  })
    .select('title slug difficulty tags')
    .sort({ difficulty: 1, order: 1 })
    .limit(10)
    .lean();

  res.status(200).json({ success: true, data: problems });
});

/**
 * @desc    Get single problem by slug
 * @route   GET /api/v1/problems/:slug
 * @access  Public
 */
export const getProblem = asyncHandler(async (req, res) => {
  const problem = await Problem.findOne({
    slug: req.params.slug,
    isArchived: { $ne: true },
  })
    .select('-referenceSolutions')
    .populate('topics', 'title slug')
    .lean();

  if (!problem) {
    throw new ApiError(404, 'Problem not found');
  }

  // Get sample test cases only (hide hidden tests from students)
  const isAdmin = req.user?.role === 'admin';
  const testCaseFilter = { problem: problem._id };
  if (!isAdmin) {
    testCaseFilter.isSample = true;
  }
  const testCases = await TestCase.find(testCaseFilter).sort({ order: 1 }).lean();

  // Get user's draft code if authenticated
  let drafts = {};
  if (req.user) {
    const userDrafts = await CodeDraft.find({
      user: req.user._id,
      problem: problem._id,
    }).lean();
    userDrafts.forEach(d => { drafts[d.language] = d.code; });
  }

  res.status(200).json({
    success: true,
    data: { ...problem, testCases, drafts },
  });
});

/**
 * @desc    Create a problem
 * @route   POST /api/v1/problems
 * @access  Admin
 */
export const createProblem = asyncHandler(async (req, res) => {
  const payload = { ...req.body };
  // Newly created problems start as draft unless explicitly validated
  if (payload.isPublished === true) {
    throw new ApiError(
      400,
      'New problems must be saved as draft, have at least 1 sample & 1 hidden test case, and pass reference-solution validation before publishing.'
    );
  }
  payload.isPublished = false;
  payload.requiresRevalidation = true;

  const problem = await Problem.create(payload);

  // Create test cases if provided
  if (req.body.testCases && Array.isArray(req.body.testCases)) {
    const testCases = req.body.testCases.map((tc, i) => ({
      ...tc,
      problem: problem._id,
      order: tc.order ?? i,
    }));
    await TestCase.insertMany(testCases);
  }

  if (req.user?._id) {
    await logAdminAction(req.user._id, 'CREATE_PROBLEM', 'Problem', problem._id, {
      title: problem.title,
      slug: problem.slug,
      difficulty: problem.difficulty,
    });
  }

  res.status(201).json({ success: true, data: problem });
});

/**
 * @desc    Update a problem
 * @route   PUT /api/v1/problems/:id
 * @access  Admin
 */
export const updateProblem = asyncHandler(async (req, res) => {
  const updates = { ...req.body };
  const materialFields = ['examples', 'timeLimit', 'memoryLimit', 'inputFormat', 'outputFormat'];
  const isMaterialEdit = materialFields.some((f) => updates[f] !== undefined);
  if (isMaterialEdit && updates.isPublished === undefined) {
    updates.requiresRevalidation = true;
  }

  // Prevent direct publish without validation/test cases
  if (updates.isPublished === true) {
    const [sampleCount, hiddenCount, existing] = await Promise.all([
      TestCase.countDocuments({ problem: req.params.id, isSample: true }),
      TestCase.countDocuments({ problem: req.params.id, isSample: false }),
      Problem.findById(req.params.id).select('validationStatus requiresRevalidation').lean(),
    ]);
    if (sampleCount < 1 || hiddenCount < 1) {
      throw new ApiError(400, 'At least 1 sample and 1 hidden test case are required before publishing.');
    }
    if (!existing?.validationStatus?.isValidated || existing?.requiresRevalidation) {
      throw new ApiError(
        400,
        'Reference solution validation via Judge0 is required before publishing.'
      );
    }
  }

  const problem = await Problem.findByIdAndUpdate(
    req.params.id,
    { $set: updates },
    { new: true, runValidators: true }
  );

  if (!problem) {
    throw new ApiError(404, 'Problem not found');
  }

  if (req.user?._id) {
    await logAdminAction(req.user._id, 'UPDATE_PROBLEM', 'Problem', problem._id, {
      title: problem.title,
      slug: problem.slug,
      isPublished: problem.isPublished,
      isArchived: problem.isArchived,
    });
  }

  res.status(200).json({ success: true, data: problem });
});

/**
 * @desc    Archive a problem (soft delete — preserves historical student submissions)
 * @route   DELETE /api/v1/problems/:id
 * @access  Admin
 */
export const deleteProblem = asyncHandler(async (req, res) => {
  const problem = await Problem.findByIdAndUpdate(
    req.params.id,
    { isArchived: true, isPublished: false, archivedAt: new Date() },
    { new: true }
  );

  if (!problem) {
    throw new ApiError(404, 'Problem not found');
  }

  if (req.user?._id) {
    await logAdminAction(req.user._id, 'ARCHIVE_PROBLEM', 'Problem', problem._id, {
      title: problem.title,
      slug: problem.slug,
    });
  }

  res.status(200).json({ success: true, message: 'Problem archived', data: problem });
});

export default {
  getProblems,
  getProblemTags,
  getRecommendedProblems,
  getProblem,
  createProblem,
  updateProblem,
  deleteProblem,
};
