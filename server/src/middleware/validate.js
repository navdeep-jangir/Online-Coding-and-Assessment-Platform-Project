import { validationResult, param } from 'express-validator';
import { AppError } from './errorHandler.js';

/**
 * Inspect express-validator results on the current request and forward a 400
 * AppError if any validation rule failed.
 */
export const validateRequest = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const formattedErrors = errors.array().map((err) => ({
      field: err.path || err.param || 'unknown',
      message: err.msg,
    }));

    return next(new AppError('Validation failed', 400, formattedErrors));
  }

  next();
};

/**
 * Flexible request validation middleware.
 * Supports both:
 *  - direct middleware usage: router.post('/...', rules, validate, handler)
 *  - factory usage: router.post('/...', validate(rules), handler)
 */
export const validate = (validationsOrReq, res, next) => {
  if (!Array.isArray(validationsOrReq) && res && typeof next === 'function') {
    return validateRequest(validationsOrReq, res, next);
  }

  const validations = Array.isArray(validationsOrReq) ? validationsOrReq : [validationsOrReq];

  return async (req, resInner, nextInner) => {
    try {
      await Promise.all(validations.map((validation) => validation.run(req)));
      return validateRequest(req, resInner, nextInner);
    } catch (error) {
      return nextInner(error);
    }
  };
};

/**
 * Helper validator chain for MongoDB ObjectId route parameters.
 * @param {string} [paramName='id']
 */
export const validateObjectId = (paramName = 'id') => [
  param(paramName).isMongoId().withMessage(`Invalid ${paramName} parameter`),
  validateRequest,
];

export default validate;
