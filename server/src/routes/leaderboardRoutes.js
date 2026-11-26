import express from 'express';
import {
  getLeaderboard,
  getUserRank,
} from '../controllers/leaderboardController.js';

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

// Protected leaderboard routes
router.get('/', protect, getLeaderboard);
router.get('/rank', protect, getUserRank);

export default router;
