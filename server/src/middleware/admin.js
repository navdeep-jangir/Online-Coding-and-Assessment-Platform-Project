import { ROLES } from '../config/constants.js';
import { AppError } from './errorHandler.js';

/**
 * Ensure the authenticated user has the 'admin' role.
 * Must be placed after `protect` middleware.
 */
export const requireAdmin = (req, res, next) => {
  if (!req.user) {
    return next(new AppError('Authentication required', 401));
  }

  if (req.user.role !== ROLES.ADMIN) {
    return next(new AppError('Admin privileges required to perform this action', 403));
  }

  next();
};

export const adminOnly = requireAdmin;
export const isAdmin = requireAdmin;

export default requireAdmin;
