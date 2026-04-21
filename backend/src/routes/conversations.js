import { Router } from 'express';
import {
  getConversations,
  getConversation,
  getTranscript,
  exportConversations,
  createConversation,
  completeConversation,
} from '../controllers/conversationController.js';
import { protect } from '../middleware/auth.js';

const router = Router();

router.get('/', protect, getConversations);
router.get('/export', protect, exportConversations);
router.get('/:id', protect, getConversation);
router.get('/:id/transcript', protect, getTranscript);
router.post('/', protect, createConversation);
// Called by agent.py when session closes (no auth — internal use)
router.post('/:roomName/complete', completeConversation);

export default router;
