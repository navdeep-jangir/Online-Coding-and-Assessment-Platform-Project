import express from 'express';
import {
  getRevisions,
  getDueRevisions,
  createOrAddRevision,
  markComplete,
  reschedule,
  deleteRevision,
} from '../controllers/revisionController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// Protected owner-scoped revision queue routes
router.get('/', protect, getRevisions);
router.get('/due', protect, getDueRevisions);
router.post('/', protect, createOrAddRevision);
router.put('/:id/complete', protect, markComplete);
router.put('/:id/reschedule', protect, reschedule);
router.delete('/:id', protect, deleteRevision);

export default router;
