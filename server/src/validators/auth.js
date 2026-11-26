import { body } from 'express-validator';

const ALLOWED_LANGUAGES = ['c', 'cpp', 'java', 'python'];

const validatePasswordStrength = (value, label = 'Password') => {
  if (typeof value !== 'string' || value.length === 0) {
    throw new Error(`${label} is required`);
  }
  if (value.length < 8) {
    throw new Error(`${label} must be at least 8 characters long`);
  }
  if (!/[A-Z]/.test(value)) {
    throw new Error(`${label} must contain at least one uppercase letter`);
  }
  if (!/[a-z]/.test(value)) {
    throw new Error(`${label} must contain at least one lowercase letter`);
  }
  if (!/[0-9]/.test(value)) {
    throw new Error(`${label} must contain at least one number`);
  }
  return true;
};

const passwordChain = (field = 'password', label = 'Password') =>
  body(field)
    .notEmpty()
    .withMessage(`${label} is required`)
    .isString()
    .withMessage(`${label} must be a string`)
    .custom((value) => validatePasswordStrength(value, label));

const nameChain = ({ optional = false } = {}) => {
  const chain = body('name');
  if (optional) {
    chain.optional();
  } else {
    chain.notEmpty().withMessage('Name is required');
  }
  return chain
    .isString()
    .withMessage('Name must be a string')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters');
};

const collegeNameChain = ({ optional = false } = {}) => {
  const chain = body('collegeName');
  if (optional) {
    chain.optional();
  } else {
    chain.notEmpty().withMessage('College name is required');
  }
  return chain
    .isString()
    .withMessage('College name must be a string')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('College name must be between 2 and 100 characters');
};

const preferredLanguageChain = ({ optional = false } = {}) => {
  const chain = body('preferredLanguage');
  if (optional) {
    chain.optional();
  }
  return chain
    .isIn(ALLOWED_LANGUAGES)
    .withMessage(`Preferred language must be one of: ${ALLOWED_LANGUAGES.join(', ')}`);
};

const emailChain = () =>
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Please provide a valid email address')
    .toLowerCase();

export const registerValidation = [
  nameChain({ optional: false }),
  emailChain(),
  passwordChain('password', 'Password'),
  collegeNameChain({ optional: false }),
  preferredLanguageChain({ optional: true }),
];

export const loginValidation = [
  emailChain(),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
    .isString()
    .withMessage('Password must be a string'),
];

export const changePasswordValidation = [
  body('currentPassword')
    .notEmpty()
    .withMessage('Current password is required')
    .isString()
    .withMessage('Current password must be a string'),
  passwordChain('newPassword', 'New password'),
];

export const updateProfileValidation = [
  nameChain({ optional: true }),
  collegeNameChain({ optional: true }),
  preferredLanguageChain({ optional: true }),
];

export const forgotPasswordValidation = [emailChain()];

export const resetPasswordValidation = [
  body().custom((_, { req }) => {
    const candidate = req.body?.password ?? req.body?.newPassword;
    return validatePasswordStrength(candidate, 'Password');
  }),
];

export default {
  registerValidation,
  loginValidation,
  changePasswordValidation,
  updateProfileValidation,
  forgotPasswordValidation,
  resetPasswordValidation,
};
