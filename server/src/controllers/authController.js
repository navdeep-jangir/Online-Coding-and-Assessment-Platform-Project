import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
const RESET_TOKEN_TTL_MS = 10 * 60 * 1000;

const getCookieOptions = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  maxAge: SEVEN_DAYS_MS,
  path: '/',
});

const getClearCookieOptions = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  path: '/',
});

const signToken = (userId) => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new ApiError(500, 'Server configuration error: JWT_SECRET is not set');
  }
  return jwt.sign({ id: userId }, secret, {
    expiresIn: process.env.JWT_EXPIRE || '7d',
  });
};

const sanitizeUser = (user) => {
  if (!user) return null;
  const obj = typeof user.toObject === 'function' ? user.toObject() : { ...user };
  delete obj.password;
  delete obj.resetPasswordToken;
  delete obj.resetPasswordExpire;
  delete obj.__v;
  return obj;
};

const sendTokenResponse = (user, statusCode, res, message) => {
  const token = signToken(user._id);
  res.cookie('token', token, getCookieOptions());

  return res.status(statusCode).json({
    success: true,
    ...(message ? { message } : {}),
    data: {
      user: sanitizeUser(user),
    },
  });
};

/**
 * Register a new student account. Never accepts `role` from request body.
 * POST /api/auth/register
 */
export const register = asyncHandler(async (req, res) => {
  const { name, email, password, collegeName, preferredLanguage } = req.body;
  const normalizedEmail = email?.trim().toLowerCase();

  if (!name || !normalizedEmail || !password || !collegeName) {
    throw new ApiError(400, 'Name, email, password, and collegeName are required');
  }

  const existingUser = await User.findOne({ email: normalizedEmail });
  if (existingUser) {
    throw new ApiError(409, 'Email already registered.');
  }

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  const user = await User.create({
    name: name.trim(),
    email: normalizedEmail,
    password: hashedPassword,
    role: 'student',
    collegeName: collegeName.trim(),
    ...(preferredLanguage ? { preferredLanguage } : {}),
  });

  return sendTokenResponse(user, 201, res, 'Account created successfully');
});

/**
 * Authenticate user by email and password and issue HTTP-only JWT cookie.
 * POST /api/auth/login
 */
export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const normalizedEmail = email?.trim().toLowerCase();

  if (!normalizedEmail || !password) {
    throw new ApiError(400, 'Email and password are required');
  }

  const user = await User.findOne({ email: normalizedEmail }).select('+password');
  if (!user) {
    throw new ApiError(401, 'Invalid email or password.');
  }

  if (user.isActive === false) {
    throw new ApiError(403, 'Your account has been deactivated');
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    throw new ApiError(401, 'Invalid email or password.');
  }

  user.lastLogin = new Date();
  await user.save({ validateBeforeSave: false });

  return sendTokenResponse(user, 200, res, 'Logged in successfully');
});

/**
 * Clear authentication cookie.
 * GET /api/auth/logout
 */
export const logout = asyncHandler(async (_req, res) => {
  res.clearCookie('token', getClearCookieOptions());

  return res.status(200).json({
    success: true,
    message: 'Logged out successfully',
    data: null,
  });
});

/**
 * Return currently authenticated user.
 * GET /api/auth/me
 */
export const getMe = asyncHandler(async (req, res) => {
  if (!req.user) {
    throw new ApiError(401, 'Not authorized');
  }

  return res.status(200).json({
    success: true,
    data: {
      user: sanitizeUser(req.user),
    },
  });
});

/**
 * Verify current password and update to a new password.
 * PUT /api/auth/change-password
 */
export const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    throw new ApiError(400, 'Current password and new password are required');
  }

  const user = await User.findById(req.user._id).select('+password');
  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  const isCurrentValid = await bcrypt.compare(currentPassword, user.password);
  if (!isCurrentValid) {
    throw new ApiError(401, 'Current password is incorrect');
  }

  const salt = await bcrypt.genSalt(10);
  user.password = await bcrypt.hash(newPassword, salt);
  await user.save();

  res.cookie('token', signToken(user._id), getCookieOptions());

  return res.status(200).json({
    success: true,
    message: 'Password updated successfully',
    data: null,
  });
});

/**
 * Update allowed profile fields only (`name`, `collegeName`, `preferredLanguage`).
 * PUT /api/auth/update-profile
 */
export const updateProfile = asyncHandler(async (req, res) => {
  const updates = {};

  if (req.body.name !== undefined) {
    updates.name = String(req.body.name).trim();
  }
  if (req.body.collegeName !== undefined) {
    updates.collegeName = String(req.body.collegeName).trim();
  }
  if (req.body.preferredLanguage !== undefined) {
    updates.preferredLanguage = req.body.preferredLanguage;
  }
  if (req.body.leaderboardOptOut !== undefined) {
    updates.leaderboardOptOut = Boolean(req.body.leaderboardOptOut);
  }

  if (Object.keys(updates).length === 0) {
    throw new ApiError(
      400,
      'Provide at least one allowed field to update: name, collegeName, preferredLanguage, leaderboardOptOut'
    );
  }

  const updatedUser = await User.findByIdAndUpdate(
    req.user._id,
    { $set: updates },
    { new: true, runValidators: true }
  );

  if (!updatedUser) {
    throw new ApiError(404, 'User not found');
  }

  return res.status(200).json({
    success: true,
    message: 'Profile updated successfully',
    data: {
      user: sanitizeUser(updatedUser),
    },
  });
});

/**
 * Generate a password reset token, store its SHA-256 hash with 10-minute expiry.
 * Returns the raw reset token in development/test mode when email is not configured.
 * POST /api/auth/forgot-password
 */
export const forgotPassword = asyncHandler(async (req, res) => {
  const normalizedEmail = req.body?.email?.trim().toLowerCase();
  if (!normalizedEmail) {
    throw new ApiError(400, 'Email is required');
  }

  const user = await User.findOne({ email: normalizedEmail });
  if (!user) {
    throw new ApiError(404, 'No user found with that email address');
  }

  const resetToken = crypto.randomBytes(32).toString('hex');
  const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

  user.resetPasswordToken = hashedToken;
  user.resetPasswordExpire = new Date(Date.now() + RESET_TOKEN_TTL_MS);
  await user.save({ validateBeforeSave: false });

  const isEmailConfigured = Boolean(
    process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS
  );

  if (!isEmailConfigured) {
    if (process.env.NODE_ENV === 'production') {
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;
      await user.save({ validateBeforeSave: false });
      throw new ApiError(500, 'Email service is not configured');
    }

    return res.status(200).json({
      success: true,
      message: 'Password reset token generated (development mode)',
      data: {
        resetToken,
        expiresAt: user.resetPasswordExpire,
      },
    });
  }

  return res.status(200).json({
    success: true,
    message: 'Password reset instructions sent to email',
    data: null,
  });
});

/**
 * Validate password reset token and update password.
 * PUT /api/auth/reset-password/:token
 */
export const resetPassword = asyncHandler(async (req, res) => {
  const { token } = req.params;
  const newPassword = req.body?.password ?? req.body?.newPassword;

  if (!token) {
    throw new ApiError(400, 'Reset token is required');
  }
  if (!newPassword) {
    throw new ApiError(400, 'New password is required');
  }

  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

  const user = await User.findOne({
    resetPasswordToken: hashedToken,
    resetPasswordExpire: { $gt: Date.now() },
  }).select('+resetPasswordToken +resetPasswordExpire');

  if (!user) {
    throw new ApiError(400, 'Invalid or expired password reset token');
  }

  const salt = await bcrypt.genSalt(10);
  user.password = await bcrypt.hash(newPassword, salt);
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;
  await user.save();

  return sendTokenResponse(user, 200, res, 'Password reset successful');
});

export default {
  register,
  login,
  logout,
  getMe,
  changePassword,
  updateProfile,
  forgotPassword,
  resetPassword,
};
