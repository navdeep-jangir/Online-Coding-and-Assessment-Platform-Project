import { Router } from 'express';
import { body } from 'express-validator';
import {
  getPublicStats,
  getModules,
  getModule,
  createModule,
  updateModule,
  deleteModule,
} from '../controllers/moduleController.js';
import { protect, optionalAuth, adminOnly } from '../middleware/auth.js';
import validate from '../middleware/validate.js';

const router = Router();

const sharedModuleValidation = [
  body('description')
    .optional()
    .isString()
    .isLength({ max: 2000 })
    .withMessage('Description cannot exceed 2000 characters'),
  body('order').optional().isNumeric().withMessage('Order must be a number'),
  body('difficulty')
    .optional()
    .isIn(['beginner', 'intermediate', 'advanced'])
    .withMessage('Difficulty must be beginner, intermediate, or advanced'),
  body('estimatedHours')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Estimated hours must be a non-negative number'),
];

const titleValidation = (isUpdate = false) => {
  const chain = body('title');
  if (isUpdate) chain.optional();
  return chain
    .trim()
    .notEmpty()
    .withMessage(isUpdate ? 'Module title cannot be empty' : 'Module title is required')
    .isString()
    .isLength({ max: 120 })
    .withMessage('Module title cannot exceed 120 characters');
};

router.get('/public-stats', getPublicStats);
router.get('/', optionalAuth, getModules);
router.get('/:id', optionalAuth, getModule);
router.post(
  '/',
  protect,
  adminOnly,
  [titleValidation(false), ...sharedModuleValidation],
  validate,
  createModule
);
router.put(
  '/:id',
  protect,
  adminOnly,
  [titleValidation(true), ...sharedModuleValidation],
  validate,
  updateModule
);
router.delete('/:id', protect, adminOnly, deleteModule);

export default router;
