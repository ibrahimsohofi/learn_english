import express from 'express';
import { authMiddleware } from '../middleware/auth.js';
import {
  analyzeReading,
  getUserSessions,
  getSessionDetails,
  getUserStats
} from '../controllers/sessionsController.js';

const router = express.Router();

router.post('/analyze', authMiddleware, analyzeReading);
router.get('/', authMiddleware, getUserSessions);
router.get('/stats', authMiddleware, getUserStats);
router.get('/:id', authMiddleware, getSessionDetails);

export default router;
