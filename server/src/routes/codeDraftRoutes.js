import { Router } from 'express';
import { protect } from '../middleware/auth.js';
import { saveDraft, getDraft } from '../controllers/codeDraftController.js';

const router = Router();

router.post('/', protect, saveDraft);
router.get('/:problemId', protect, getDraft);

export default router;
