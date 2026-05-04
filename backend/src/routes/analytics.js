import { Router } from 'express';
import {
  getDashboardStats,
  getCallVolume,
  getSuccessRate,
  getDurationTrend,
  getAgentPerformance,
  getRecentConversations,
  streamAnalytics,
} from '../controllers/analyticsController.js';
import { protect } from '../middleware/auth.js';

const router = Router();

router.get('/stream', protect, streamAnalytics);
router.get('/dashboard', protect, getDashboardStats);
router.get('/call-volume', protect, getCallVolume);
router.get('/success-rate', protect, getSuccessRate);
router.get('/duration', protect, getDurationTrend);
router.get('/agents', protect, getAgentPerformance);
router.get('/recent', protect, getRecentConversations);

export default router;
