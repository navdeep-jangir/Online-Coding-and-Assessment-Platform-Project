import { Router } from 'express';
import { body } from 'express-validator';
import mongoose from 'mongoose';
import {
  getTopics,
  getTopic,
  createTopic,
  updateTopic,
  deleteTopic,
  updateProgress,
} from '../controllers/topicController.js';
import { protect, optionalAuth, adminOnly } from '../middleware/auth.js';
import validate from '../middleware/validate.js';

const router = Router();

const sharedTopicValidation = [
  body('description')
    .optional()
    .isString()
    .isLength({ max: 3000 })
    .withMessage('Description cannot exceed 3000 characters'),
  body('order').optional().isNumeric().withMessage('Order must be a number'),
  body('difficulty')
    .optional()
    .isIn(['beginner', 'intermediate', 'advanced', 'easy', 'medium', 'hard'])
    .withMessage('Invalid difficulty level'),
  body('estimatedMinutes')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Estimated minutes must be a non-negative number'),
];

const topicValidation = (isUpdate = false) => {
  const titleChain = body('title');
  if (isUpdate) titleChain.optional();

  return [
    titleChain
      .trim()
      .notEmpty()
      .withMessage(isUpdate ? 'Topic title cannot be empty' : 'Topic title is required')
      .isString()
      .isLength({ max: 150 })
      .withMessage('Topic title cannot exceed 150 characters'),
    body().custom((_, { req }) => {
      const moduleId = req.body?.module ?? req.body?.moduleId;
      if (!isUpdate && (!moduleId || !mongoose.isValidObjectId(moduleId))) {
        throw new Error('A valid module ID is required');
      }
      if (isUpdate && moduleId !== undefined && !mongoose.isValidObjectId(moduleId)) {
        throw new Error('Invalid module ID');
      }
      return true;
    }),
    ...sharedTopicValidation,
  ];
};

router.get('/', optionalAuth, getTopics);
router.get('/:id', optionalAuth, getTopic);
router.post('/', protect, adminOnly, topicValidation(false), validate, createTopic);
router.put('/:id', protect, adminOnly, topicValidation(true), validate, updateTopic);
router.delete('/:id', protect, adminOnly, deleteTopic);
router.put('/:id/progress', protect, updateProgress);

export default router;
