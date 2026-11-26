import { Router } from 'express';
import { protect, authorize } from '../middleware/auth.js';
import {
  getTestCases,
  addTestCase,
  updateTestCase,
  deleteTestCase,
} from '../controllers/testCaseController.js';

const router = Router();

router.get('/problem/:problemId', protect, getTestCases);
router.post('/', protect, authorize('admin'), addTestCase);
router.put('/:id', protect, authorize('admin'), updateTestCase);
router.delete('/:id', protect, authorize('admin'), deleteTestCase);

export default router;
