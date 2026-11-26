import { Router } from 'express';
import { body } from 'express-validator';
import mongoose from 'mongoose';
import {
  getNoteByTopic,
  createNote,
  updateNote,
} from '../controllers/noteController.js';
import { protect, adminOnly } from '../middleware/auth.js';
import validate from '../middleware/validate.js';

const router = Router();

const noteValidation = (isUpdate = false) => {
  const titleChain = body('title');
  const contentChain = body('content');
  if (isUpdate) {
    titleChain.optional();
    contentChain.optional();
  }

  const rules = [
    titleChain
      .trim()
      .notEmpty()
      .withMessage(isUpdate ? 'Note title cannot be empty' : 'Note title is required')
      .isString()
      .isLength({ max: 200 })
      .withMessage('Note title cannot exceed 200 characters'),
    contentChain
      .notEmpty()
      .withMessage(isUpdate ? 'Note content cannot be empty' : 'Note content is required')
      .isString()
      .withMessage('Note content must be a string'),
  ];

  if (!isUpdate) {
    rules.unshift(
      body().custom((_, { req }) => {
        const topicId = req.body?.topic || req.body?.topicId;
        if (!topicId || !mongoose.isValidObjectId(topicId)) {
          throw new Error('A valid topic ID is required');
        }
        return true;
      })
    );
  }

  return rules;
};

router.get('/topic/:topicId', getNoteByTopic);
router.post('/', protect, adminOnly, noteValidation(false), validate, createNote);
router.put('/:id', protect, adminOnly, noteValidation(true), validate, updateNote);

export default router;
