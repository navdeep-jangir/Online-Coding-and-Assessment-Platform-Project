import express from 'express';
import {
  getDashboardStats,
  getUsers,
  getStudentDetail,
  activateUser,
  deactivateUser,
  getStudentReport,
  exportStudentReport,
  getAdminProblems,
  validateProblemSolution,
  publishProblem,
  getSubmissionStats,
  getAdminAchievements,
  createAchievement,
  updateAchievement,
  getAdminDailyChallenges,
  validateCurriculumDAG,
  getAuditLog,
} from '../controllers/adminController.js';
import { protect, adminOnly } from '../middleware/auth.js';

const router = express.Router();

// All admin routes are protected and restricted to admin role
router.get('/stats', protect, adminOnly, getDashboardStats);
router.get('/users', protect, adminOnly, getUsers);
router.get('/users/:id', protect, adminOnly, getStudentDetail);
router.get('/users/:id/report', protect, adminOnly, getStudentReport);
router.get('/users/:id/export', protect, adminOnly, exportStudentReport);
router.put('/users/:id/activate', protect, adminOnly, activateUser);
router.put('/users/:id/deactivate', protect, adminOnly, deactivateUser);

router.get('/problems', protect, adminOnly, getAdminProblems);
router.post('/problems/:id/validate-solution', protect, adminOnly, validateProblemSolution);
router.put('/problems/:id/publish', protect, adminOnly, publishProblem);

router.get('/submissions', protect, adminOnly, getSubmissionStats);
router.get('/achievements', protect, adminOnly, getAdminAchievements);
router.post('/achievements', protect, adminOnly, createAchievement);
router.put('/achievements/:id', protect, adminOnly, updateAchievement);
router.get('/daily-challenges', protect, adminOnly, getAdminDailyChallenges);
router.post('/curriculum/validate-dag', protect, adminOnly, validateCurriculumDAG);
router.get('/audit-log', protect, adminOnly, getAuditLog);

export default router;
