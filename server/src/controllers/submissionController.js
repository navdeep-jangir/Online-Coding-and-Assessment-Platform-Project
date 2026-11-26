import Problem from '../models/Problem.js';
import TestCase from '../models/TestCase.js';
import Submission from '../models/Submission.js';
import User from '../models/User.js';
import UserProgress from '../models/UserProgress.js';
import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/ApiError.js';
import { executeCode, batchSubmit } from '../services/judge0Service.js';
import { awardXP, checkAndAwardAchievements } from '../services/xpService.js';
import { addToRevision, markRevisionComplete } from '../services/revisionService.js';
import { completeDailyChallengeFromSubmission } from './dailyChallengeController.js';
import { XP_VALUES, VERDICTS } from '../config/constants.js';

const MAX_SOURCE_CODE_BYTES = 64 * 1024; // 64 KB
const MAX_CUSTOM_INPUT_BYTES = 64 * 1024; // 64 KB
const MAX_OUTPUT_CHARS = 32768; // 32 KB
const activeSubmissions = new Set();

const truncateOutput = (val) => {
  if (typeof val !== 'string') return '';
  if (val.length <= MAX_OUTPUT_CHARS) return val;
  return `${val.slice(0, MAX_OUTPUT_CHARS)}\n... [Output truncated]`;
};

const validateCodeAndInput = (code, customInput) => {
  if (Buffer.byteLength(String(code), 'utf8') > MAX_SOURCE_CODE_BYTES) {
    throw new ApiError(400, 'Source code exceeds maximum allowed size of 64 KB.');
  }
  if (customInput !== undefined && Buffer.byteLength(String(customInput), 'utf8') > MAX_CUSTOM_INPUT_BYTES) {
    throw new ApiError(400, 'Custom input exceeds maximum allowed size of 64 KB.');
  }
};

/**
 * @desc    Run code against selected test cases or custom input (no verdict saved)
 * @route   POST /api/v1/submissions/run
 * @access  Private
 */
export const runCode = asyncHandler(async (req, res) => {
  const { code, language, problemId, customInput, testCaseIds } = req.body;

  if (!code || !language) {
    throw new ApiError(400, 'Code and language are required');
  }
  validateCodeAndInput(code, customInput);

  // If custom input provided, run against it
  if (customInput !== undefined) {
    const result = await executeCode(code, language, customInput);
    return res.status(200).json({
      success: true,
      data: {
        verdict: result.verdict,
        stdout: truncateOutput(result.stdout),
        stderr: truncateOutput(result.stderr),
        compileOutput: truncateOutput(result.compileOutput),
        runtimeMs: result.runtimeMs,
        memory: result.memory,
      },
    });
  }

  // Run against sample test cases
  if (!problemId) {
    throw new ApiError(400, 'problemId or customInput is required');
  }

  const problem = await Problem.findById(problemId);
  if (!problem) {
    throw new ApiError(404, 'Problem not found');
  }

  let testCases;
  if (testCaseIds && testCaseIds.length > 0) {
    testCases = await TestCase.find({
      _id: { $in: testCaseIds },
      problem: problemId,
      isSample: true,
    }).sort({ order: 1 });
  } else {
    testCases = await TestCase.find({ problem: problemId, isSample: true }).sort({ order: 1 });
  }

  if (testCases.length === 0) {
    throw new ApiError(404, 'No test cases found');
  }

  const submissions = testCases.map(tc => ({
    code,
    language,
    stdin: tc.input,
    expectedOutput: tc.expectedOutput,
    timeLimit: problem.timeLimit,
    memoryLimit: problem.memoryLimit,
  }));

  const results = await batchSubmit(submissions);

  const testResults = results.map((r, i) => ({
    input: testCases[i].input,
    expectedOutput: testCases[i].expectedOutput,
    actualOutput: r.stdout,
    verdict: r.verdict,
    runtimeMs: r.runtimeMs,
    memory: r.memory,
    stderr: r.stderr,
    compileOutput: r.compileOutput,
    isSample: testCases[i].isSample,
  }));

  const passed = testResults.filter(r => r.verdict === VERDICTS.ACCEPTED).length;

  res.status(200).json({
    success: true,
    data: {
      passed,
      total: testResults.length,
      results: testResults,
    },
  });
});

/**
 * @desc    Submit code for full evaluation (all test cases including hidden)
 * @route   POST /api/v1/submissions/submit
 * @access  Private
 *
 * DSA usage: Queue-like processing of test cases in batches,
 * Hash set for checking if problem was previously solved.
 */
export const submitCode = asyncHandler(async (req, res) => {
  const { code, language, problemId } = req.body;
  const userId = req.user._id;

  if (!code || !language || !problemId) {
    throw new ApiError(400, 'Code, language, and problemId are required');
  }
  validateCodeAndInput(code);

  const lockKey = `${userId}:${problemId}`;
  if (activeSubmissions.has(lockKey)) {
    throw new ApiError(429, 'A submission for this problem is already being evaluated. Please wait.');
  }
  activeSubmissions.add(lockKey);

  try {
    const problem = await Problem.findById(problemId);
    if (!problem) {
      throw new ApiError(404, 'Problem not found');
    }

    const testCases = await TestCase.find({ problem: problemId }).sort({ order: 1 });
    if (testCases.length === 0) {
      throw new ApiError(500, 'No test cases configured for this problem');
    }

    // Check if already solved (for XP deduplication)
    const alreadySolved = await Submission.exists({
      user: userId,
      problem: problemId,
      verdict: VERDICTS.ACCEPTED,
    });

    // Execute against all test cases
    const submissions = testCases.map((tc) => ({
      code,
      language,
      stdin: tc.input,
      expectedOutput: tc.expectedOutput,
      timeLimit: problem.timeLimit,
      memoryLimit: problem.memoryLimit,
    }));

    const results = await batchSubmit(submissions);

    let overallVerdict = VERDICTS.ACCEPTED;
    let passed = 0;
    let totalRuntime = 0;
    let maxMemory = 0;
    let errorMessage = '';
    let compilerOutput = '';

    for (const r of results) {
      if (r.verdict === VERDICTS.ACCEPTED) {
        passed++;
      } else if (overallVerdict === VERDICTS.ACCEPTED) {
        overallVerdict = r.verdict;
        errorMessage = truncateOutput(r.stderr || r.message || '');
        compilerOutput = truncateOutput(r.compileOutput || '');
      }
      totalRuntime += r.runtimeMs;
      maxMemory = Math.max(maxMemory, r.memory);
    }

    // Create submission record
    const submission = await Submission.create({
      user: userId,
      problem: problemId,
      language,
      code,
      verdict: overallVerdict,
      runtime: totalRuntime,
      memory: maxMemory,
      passedTestCases: passed,
      totalTestCases: testCases.length,
      errorMessage,
      compilerOutput,
    });

    // Update user activity date for streak calculation
    await User.findByIdAndUpdate(userId, { lastActiveDate: new Date() });

    let xpAwarded = 0;
    let dailyChallengeCompleted = false;
    let dailyChallengeXpAwarded = 0;

    // Award XP on first accepted (prevent duplicate awards)
    if (overallVerdict === VERDICTS.ACCEPTED) {
      if (!alreadySolved) {
        const difficultyKey = problem.difficulty.toLowerCase();
        xpAwarded = XP_VALUES[difficultyKey] || XP_VALUES.easy;
        await awardXP(userId, xpAwarded, 'problem', problemId, `Solved: ${problem.title}`);
        await checkAndAwardAchievements(userId);
      }
      // Mark linked roadmap topics as completed/verified
      if (Array.isArray(problem.topics) && problem.topics.length > 0) {
        await Promise.all(
          problem.topics.map((topicId) =>
            UserProgress.findOneAndUpdate(
              { user: userId, topic: topicId },
              {
                $set: { isCompleted: true, completedAt: new Date() },
                $addToSet: { solvedProblems: problemId },
              },
              { upsert: true }
            )
          )
        );
      }
      // Update Revision Mode if this problem is in the student's revision queue
      await markRevisionComplete(userId, problemId, { ignoreNotFound: true });

      // Check & complete today's personalized Daily Coding Challenge (+20 bonus XP once)
      try {
        const dailyRes = await completeDailyChallengeFromSubmission(userId, problemId, submission._id);
        dailyChallengeCompleted = Boolean(dailyRes?.completed);
        dailyChallengeXpAwarded = Number(dailyRes?.xpAwarded || 0);
      } catch {
        // Non-fatal if daily challenge check fails
      }
    } else if (overallVerdict !== VERDICTS.INTERNAL_ERROR && overallVerdict !== VERDICTS.PENDING) {
      const reasonMap = {
        [VERDICTS.WRONG_ANSWER]: 'wrong_answer',
        [VERDICTS.COMPILATION_ERROR]: 'compilation_error',
        [VERDICTS.RUNTIME_ERROR]: 'runtime_error',
        [VERDICTS.TIME_LIMIT_EXCEEDED]: 'time_limit_exceeded',
        [VERDICTS.MEMORY_LIMIT_EXCEEDED]: 'memory_limit_exceeded',
      };
      const reason = reasonMap[overallVerdict] || 'wrong_answer';
      await addToRevision(userId, problemId, reason);
    }

    res.status(200).json({
      success: true,
      data: {
        submissionId: submission._id,
        verdict: overallVerdict,
        passed,
        total: testCases.length,
        runtime: totalRuntime,
        memory: maxMemory,
        xpAwarded,
        dailyChallengeCompleted,
        dailyChallengeXpAwarded,
        alreadySolved: Boolean(alreadySolved),
        errorMessage,
        compilerOutput,
        results: results.map((r, i) => ({
          verdict: r.verdict,
          runtimeMs: r.runtimeMs,
          memory: r.memory,
          // Only show input/output for sample test cases
          ...(testCases[i].isSample
            ? {
                input: testCases[i].input,
                expectedOutput: testCases[i].expectedOutput,
                actualOutput: truncateOutput(r.stdout),
              }
            : {}),
          isSample: testCases[i].isSample,
        })),
      },
    });
  } finally {
    activeSubmissions.delete(lockKey);
  }
});

/**
 * @desc    Get user's submission history for a problem
 * @route   GET /api/v1/submissions/problem/:problemId
 * @access  Private
 */
export const getSubmissions = asyncHandler(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(50, parseInt(req.query.limit) || 20);

  const [submissions, total] = await Promise.all([
    Submission.find({ user: req.user._id, problem: req.params.problemId })
      .sort({ submittedAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .select('language code verdict runtime memory passedTestCases totalTestCases errorMessage compilerOutput submittedAt')
      .lean(),
    Submission.countDocuments({ user: req.user._id, problem: req.params.problemId }),
  ]);

  res.status(200).json({
    success: true,
    data: submissions,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  });
});

/**
 * @desc    Get a single private submission by ID (owner only)
 * @route   GET /api/v1/submissions/:id
 * @access  Private
 */
export const getSubmissionById = asyncHandler(async (req, res) => {
  const submission = await Submission.findOne({
    _id: req.params.id,
    user: req.user._id,
  }).lean();

  if (!submission) {
    throw new ApiError(404, 'Submission not found');
  }

  res.status(200).json({
    success: true,
    data: submission,
  });
});

/**
 * @desc    Get all submissions (admin)
 * @route   GET /api/v1/submissions/all
 * @access  Admin
 */
export const getAllSubmissions = asyncHandler(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(100, parseInt(req.query.limit) || 20);

  const filter = {};
  if (req.query.verdict) filter.verdict = req.query.verdict;
  if (req.query.userId) filter.user = req.query.userId;
  if (req.query.problemId) filter.problem = req.query.problemId;

  const [submissions, total] = await Promise.all([
    Submission.find(filter)
      .populate('user', 'name email')
      .populate('problem', 'title slug difficulty')
      .sort({ submittedAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    Submission.countDocuments(filter),
  ]);

  res.status(200).json({
    success: true,
    data: submissions,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  });
});

export default { runCode, submitCode, getSubmissions, getSubmissionById, getAllSubmissions };
