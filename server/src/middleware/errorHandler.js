import ApiError from '../utils/ApiError.js';

/**
 * Custom operational application error carrying an HTTP status code
 * and optional structured field validation details.
 */
export class AppError extends Error {
  /**
   * @param {string} message
   * @param {number} [statusCode=500]
   * @param {Array<{field: string, message: string}> | null} [errors=null]
   */
  constructor(message, statusCode = 500, errors = null) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;
    this.errors = errors;

    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Catch-all middleware for unmatched routes.
 */
export const notFound = (req, res, next) => {
  next(new AppError(`Route not found: ${req.method} ${req.originalUrl}`, 404));
};

/**
 * Format Mongoose CastError into a 400 AppError.
 */
const handleCastErrorDB = (err) => {
  const message = `Invalid ${err.path || 'resource'}: ${err.value}`;
  return new AppError(message, 400);
};

/**
 * Format Mongoose duplicate key error (code 11000) into a 409 AppError.
 */
const handleDuplicateFieldsDB = (err) => {
  const fields = err.keyValue ? Object.keys(err.keyValue) : [];
  const fieldList = fields.length > 0 ? fields.join(', ') : 'field';
  return new AppError(`Duplicate value for ${fieldList}`, 409);
};

/**
 * Format Mongoose ValidationError into a 400 AppError with field details.
 */
const handleValidationErrorDB = (err) => {
  const errors = Object.values(err.errors || {}).map((el) => ({
    field: el.path,
    message: el.message,
  }));
  const message = errors.map((e) => e.message).join('. ') || 'Validation failed';
  return new AppError(message, 400, errors);
};

/**
 * Centralized Express error-handling middleware.
 */
export const errorHandler = (err, req, res, next) => {
  let error = err;

  if (err.name === 'CastError') {
    error = handleCastErrorDB(err);
  } else if (err.code === 11000) {
    error = handleDuplicateFieldsDB(err);
  } else if (err.name === 'ValidationError' && err.errors && !Array.isArray(err.errors)) {
    error = handleValidationErrorDB(err);
  } else if (err.name === 'JsonWebTokenError') {
    error = new AppError('Invalid authentication token. Please log in again.', 401);
  } else if (err.name === 'TokenExpiredError') {
    error = new AppError('Your authentication token has expired. Please log in again.', 401);
  } else if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    error = new AppError('Malformed JSON in request body', 400);
  }

  const statusCode = error.statusCode || error.status || 500;
  let message = error.message || 'Internal Server Error';
  if (!(error instanceof AppError) && !(error instanceof ApiError) && statusCode >= 500 && process.env.NODE_ENV === 'production') {
    message = 'Internal Server Error';
  }

  if (statusCode >= 500 && process.env.NODE_ENV !== 'test') {
    console.error('[ErrorHandler]', err);
  }

  const hasErrors = Array.isArray(error.errors) && error.errors.length > 0;

  res.status(statusCode).json({
    success: false,
    message,
    ...(hasErrors ? { errors: error.errors } : {}),
    ...(typeof err.code === 'string' ? { code: err.code } : {}),
    ...(process.env.NODE_ENV === 'development' ? { stack: err.stack } : {}),
  });
};

export default errorHandler;
