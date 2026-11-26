import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { COOKIE_NAME } from '../config/constants.js';
import { AppError } from './errorHandler.js';

/**
 * Extract JWT from the HTTP-only 'token' cookie (with optional Bearer fallback).
 * @param {import('express').Request} req
 * @returns {string | null}
 */
const extractToken = (req) => {
  const cookieToken = req.cookies?.[COOKIE_NAME];
  if (cookieToken && cookieToken !== 'none' && cookieToken !== 'null') {
    return cookieToken;
  }
  const authHeader = req.headers?.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.slice(7).trim();
  }
  return null;
};

/**
 * Verify JWT from the HTTP-only 'token' cookie and attach the active user to req.user.
 */
export const protect = async (req, res, next) => {
  try {
    const token = extractToken(req);

    if (!token) {
      return next(new AppError('Not authorized to access this route', 401));
    }

    if (!process.env.JWT_SECRET) {
      return next(new AppError('JWT_SECRET is not configured on the server', 500));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.id || decoded._id || decoded.userId;
    const user = await User.findById(userId).select('-password');

    if (!user) {
      return next(new AppError('User belonging to this token no longer exists', 401));
    }

    if (!user.isActive) {
      return next(new AppError('User account has been deactivated', 403));
    }

    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Optional authentication: attaches req.user when a valid cookie token is present,
 * otherwise proceeds anonymously without throwing.
 */
export const optionalAuth = async (req, res, next) => {
  try {
    const token = extractToken(req);
    if (!token || !process.env.JWT_SECRET) {
      return next();
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.id || decoded._id || decoded.userId;
    const user = await User.findById(userId).select('-password');
    if (user && user.isActive) {
      req.user = user;
    }
    next();
  } catch {
    next();
  }
};

/**
 * Restrict route access to users having one of the allowed roles.
 * @param {...string} roles
 */
export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AppError('Not authorized to access this route', 401));
    }

    if (!roles.includes(req.user.role)) {
      return next(
        new AppError(`User role '${req.user.role}' is not authorized to access this route`, 403)
      );
    }

    next();
  };
};

export const adminOnly = authorize('admin');

export default { protect, authorize, optionalAuth, adminOnly };
