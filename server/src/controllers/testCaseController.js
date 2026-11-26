import TestCase from '../models/TestCase.js';
import Problem from '../models/Problem.js';
import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/ApiError.js';
import { logAdminAction } from './adminController.js';

/**
 * @desc    Get test cases for a problem (sample only for students, all for admin)
 * @route   GET /api/v1/test-cases/problem/:problemId
 * @access  Private
 */
export const getTestCases = asyncHandler(async (req, res) => {
  const { problemId } = req.params;
  const isAdmin = req.user?.role === 'admin';

  const filter = { problem: problemId };
  if (!isAdmin) {
    filter.isSample = true;
  }

  const testCases = await TestCase.find(filter).sort({ order: 1 }).lean();

  res.status(200).json({
    success: true,
    data: testCases,
  });
});

/**
 * @desc    Add a test case to a problem
 * @route   POST /api/v1/test-cases
 * @access  Admin
 */
export const addTestCase = asyncHandler(async (req, res) => {
  const { problem, input = '', expectedOutput, isSample = false, order = 0, explanation = '' } = req.body;

  if (!problem || typeof expectedOutput !== 'string') {
    throw new ApiError(400, 'problem and expectedOutput are required');
  }

  const problemExists = await Problem.exists({ _id: problem });
  if (!problemExists) {
    throw new ApiError(404, 'Problem not found');
  }

  const testCase = await TestCase.create({
    problem,
    input,
    expectedOutput,
    isSample,
    order,
    explanation,
  });

  await Problem.findByIdAndUpdate(problem, { $set: { requiresRevalidation: true } });
  if (req.user?._id) {
    await logAdminAction(req.user._id, 'ADD_TEST_CASE', 'TestCase', testCase._id, {
      problemId: String(problem),
      isSample: Boolean(isSample),
    });
  }

  res.status(201).json({ success: true, data: testCase });
});

/**
 * @desc    Update a test case
 * @route   PUT /api/v1/test-cases/:id
 * @access  Admin
 */
export const updateTestCase = asyncHandler(async (req, res) => {
  const testCase = await TestCase.findByIdAndUpdate(
    req.params.id,
    { $set: req.body },
    { new: true, runValidators: true }
  );

  if (!testCase) {
    throw new ApiError(404, 'Test case not found');
  }

  await Problem.findByIdAndUpdate(testCase.problem, { $set: { requiresRevalidation: true } });
  if (req.user?._id) {
    await logAdminAction(req.user._id, 'UPDATE_TEST_CASE', 'TestCase', testCase._id, {
      problemId: String(testCase.problem),
      isSample: Boolean(testCase.isSample),
    });
  }

  res.status(200).json({ success: true, data: testCase });
});

/**
 * @desc    Delete a test case
 * @route   DELETE /api/v1/test-cases/:id
 * @access  Admin
 */
export const deleteTestCase = asyncHandler(async (req, res) => {
  const testCase = await TestCase.findByIdAndDelete(req.params.id);

  if (!testCase) {
    throw new ApiError(404, 'Test case not found');
  }

  await Problem.findByIdAndUpdate(testCase.problem, { $set: { requiresRevalidation: true } });
  if (req.user?._id) {
    await logAdminAction(req.user._id, 'DELETE_TEST_CASE', 'TestCase', testCase._id, {
      problemId: String(testCase.problem),
    });
  }

  res.status(200).json({ success: true, message: 'Test case deleted', data: null });
});

export default { getTestCases, addTestCase, updateTestCase, deleteTestCase };
