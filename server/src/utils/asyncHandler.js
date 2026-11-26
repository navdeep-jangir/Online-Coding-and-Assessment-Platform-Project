/**
 * Wraps async Express route handlers and forwards rejected promises to `next`.
 *
 * @param {Function} requestHandler - Async Express route handler or controller
 * @returns {Function} Wrapped Express middleware
 */
export const asyncHandler = (requestHandler) => (req, res, next) =>
  Promise.resolve(requestHandler(req, res, next)).catch((err) => {
    if (typeof next === 'function') {
      return next(err);
    }
    throw err;
  });

export default asyncHandler;
