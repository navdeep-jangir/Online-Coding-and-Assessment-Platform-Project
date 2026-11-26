import rateLimit from 'express-rate-limit';

const shouldSkipRateLimit = () =>
  process.env.DISABLE_RATE_LIMIT === 'true' ||
  (process.env.NODE_ENV === 'test' && process.env.TEST_RATE_LIMIT !== 'true');

/**
 * Build a configured express-rate-limit middleware instance.
 * @param {import('express-rate-limit').Options} [options={}]
 */
export const createRateLimiter = (options = {}) =>
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 200,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    skip: shouldSkipRateLimit,
    message: {
      success: false,
      message: 'Too many requests from this IP, please try again later.',
    },
    ...options,
  });

/** General rate limiter applied across all /api/v1 routes. */
export const apiLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  limit: 300,
});

/** Strict rate limiter for authentication endpoints (login/register). */
export const authLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  message: {
    success: false,
    message: 'Too many authentication attempts, please try again after 15 minutes.',
  },
});

/** Rate limiter for code execution / submission endpoints. */
export const submissionLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  limit: 15,
  message: {
    success: false,
    message: 'Submission rate limit exceeded. Please wait a minute before submitting again.',
  },
});

export default apiLimiter;
