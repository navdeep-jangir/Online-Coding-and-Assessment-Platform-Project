import express from 'express';
import {
  getTodayChallenge,
  attemptChallenge,
  getChallengeHistory,
  assignDailyChallenge,
} from '../controllers/dailyChallengeController.js';

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

const adminOnly =
  authMod.admin ||
  authMod.adminOnly ||
  authMod.isAdmin ||
  authMod.requireAdmin ||
  (typeof authMod.authorize === 'function' ? authMod.authorize('admin') : null) ||
  ((req, res, next) => {
    if (req.user && req.user.role === 'admin') {
      return next();
    }
    return res.status(403).json({ success: false, message: 'Admin access required' });
  });

const router = express.Router();

// Authenticated user routes
router.get('/today', protect, getTodayChallenge);
router.post('/attempt', protect, attemptChallenge);
router.get('/history', protect, getChallengeHistory);

// Admin-only assignment route
router.post('/assign', protect, adminOnly, assignDailyChallenge);

export default router;
