import express from 'express';
import { authMiddleware, adminMiddleware } from '../middleware/auth.js';
import {
  getAllStories,
  getStoryById,
  createStory,
  updateStory,
  deleteStory
} from '../controllers/storiesController.js';

const router = express.Router();

router.get('/', authMiddleware, getAllStories);
router.get('/:id', authMiddleware, getStoryById);
router.post('/', authMiddleware, adminMiddleware, createStory);
router.put('/:id', authMiddleware, adminMiddleware, updateStory);
router.delete('/:id', authMiddleware, adminMiddleware, deleteStory);

export default router;
