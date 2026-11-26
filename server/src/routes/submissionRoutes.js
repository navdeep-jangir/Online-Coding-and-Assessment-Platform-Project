import { Router } from 'express';
import { protect, authorize } from '../middleware/auth.js';
import { submissionLimiter } from '../middleware/rateLimiter.js';
import {
  runCode,
  submitCode,
  getSubmissions,
  getSubmissionById,
  getAllSubmissions,
} from '../controllers/submissionController.js';

const router = Router();

router.post('/run', protect, submissionLimiter, runCode);
router.post('/submit', protect, submissionLimiter, submitCode);
router.get('/problem/:problemId', protect, getSubmissions);
router.get('/all', protect, authorize('admin'), getAllSubmissions);
router.get('/:id', protect, getSubmissionById);

export default router;
