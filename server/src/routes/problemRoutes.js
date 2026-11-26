import { Router } from 'express';
import { protect, optionalAuth, authorize } from '../middleware/auth.js';
import {
  getProblems,
  getProblemTags,
  getRecommendedProblems,
  getProblem,
  createProblem,
  updateProblem,
  deleteProblem,
} from '../controllers/problemController.js';

const router = Router();

router.get('/', optionalAuth, getProblems);
router.get('/tags', getProblemTags);
router.get('/recommended', protect, getRecommendedProblems);
router.get('/:slug', optionalAuth, getProblem);

router.post('/', protect, authorize('admin'), createProblem);
router.put('/:id', protect, authorize('admin'), updateProblem);
router.delete('/:id', protect, authorize('admin'), deleteProblem);

export default router;
