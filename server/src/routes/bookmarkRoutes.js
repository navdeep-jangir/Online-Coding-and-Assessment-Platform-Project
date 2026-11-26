import { Router } from 'express';
import {
  getBookmarks,
  toggleBookmark,
  checkBookmark,
} from '../controllers/bookmarkController.js';
import { protect } from '../middleware/auth.js';

const router = Router();

router.get('/', protect, getBookmarks);
router.post('/toggle', protect, toggleBookmark);
router.get('/check', protect, checkBookmark);

export default router;
