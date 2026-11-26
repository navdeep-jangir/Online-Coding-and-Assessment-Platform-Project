import express from 'express';
import {
  getRecommendation,
  getWeakTopics,
} from '../controllers/recommendationController.js';

let authMod = {};
try {
  authMod = await import('../middleware/auth.js');
} catch {
  try {
    authMod = await import('../middleware/authMiddleware.js');
  } catch {
    authMod = {};
  }
}

const protect =
  authMod.protect ||
  authMod.authenticate ||
  authMod.requireAuth ||
  authMod.verifyToken ||
  ((_req, res) =>
    res.status(401).json({ success: false, message: 'Authentication middleware unavailable' }));

const router = express.Router();

// Protected recommendation endpoints
router.get('/next', protect, getRecommendation);
router.get('/weak-topics', protect, getWeakTopics);

export default router;
