import express from 'express';
import {
  getDashboardStats,
  getPerformanceReport,
  exportReport,
} from '../controllers/progressController.js';

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

// Protected user progress & analytics routes
router.get('/dashboard', protect, getDashboardStats);
router.get('/performance', protect, getPerformanceReport);
router.get('/export', protect, exportReport);

export default router;
