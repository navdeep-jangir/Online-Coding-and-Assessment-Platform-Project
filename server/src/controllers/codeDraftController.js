import CodeDraft from '../models/CodeDraft.js';
import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/ApiError.js';

/**
 * @desc    Save or update a code draft
 * @route   POST /api/v1/code-drafts
 * @access  Private
 */
export const saveDraft = asyncHandler(async (req, res) => {
  const { problemId, language, code } = req.body;

  if (!problemId || !language || code === undefined) {
    throw new ApiError(400, 'problemId, language, and code are required');
  }

  const draft = await CodeDraft.findOneAndUpdate(
    { user: req.user._id, problem: problemId, language },
    { code },
    { new: true, upsert: true, runValidators: true }
  );

  res.status(200).json({ success: true, data: draft });
});

/**
 * @desc    Get user's drafts for a problem
 * @route   GET /api/v1/code-drafts/:problemId
 * @access  Private
 */
export const getDraft = asyncHandler(async (req, res) => {
  const drafts = await CodeDraft.find({
    user: req.user._id,
    problem: req.params.problemId,
  }).lean();

  const draftMap = {};
  drafts.forEach(d => { draftMap[d.language] = d.code; });

  res.status(200).json({ success: true, data: draftMap });
});

export default { saveDraft, getDraft };
