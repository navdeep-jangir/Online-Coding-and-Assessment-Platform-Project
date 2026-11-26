import { Router } from 'express';
import {
  register,
  login,
  logout,
  getMe,
  changePassword,
  updateProfile,
  forgotPassword,
  resetPassword,
} from '../controllers/authController.js';
import {
  registerValidation,
  loginValidation,
  changePasswordValidation,
  updateProfileValidation,
  forgotPasswordValidation,
  resetPasswordValidation,
} from '../validators/auth.js';
import { protect } from '../middleware/auth.js';
import validate from '../middleware/validate.js';

const router = Router();

router.post('/register', registerValidation, validate, register);
router.post('/login', loginValidation, validate, login);
router.get('/logout', logout);
router.post('/logout', logout);
router.get('/me', protect, getMe);
router.put('/change-password', protect, changePasswordValidation, validate, changePassword);
router.put('/password', protect, changePasswordValidation, validate, changePassword);
router.put('/update-profile', protect, updateProfileValidation, validate, updateProfile);
router.put('/profile', protect, updateProfileValidation, validate, updateProfile);
router.post('/forgot-password', forgotPasswordValidation, validate, forgotPassword);
router.put('/reset-password/:token', resetPasswordValidation, validate, resetPassword);

export default router;
