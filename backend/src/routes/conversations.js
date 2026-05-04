import { Router } from 'express';
import {
  getConversations,
  getConversation,
  getTranscript,
  streamConversations,
  exportConversations,
  createConversation,
  completeConversation,
  addTranscriptEntry,
} from '../controllers/conversationController.js';
import { protect } from '../middleware/auth.js';

const router = Router();

router.get('/stream', protect, streamConversations);
router.get('/', protect, getConversations);
router.get('/export', protect, exportConversations);
router.get('/:id', protect, getConversation);
router.get('/:id/transcript', protect, getTranscript);
router.post('/', protect, createConversation);
// Called by agent.py — no auth (internal use)
router.post('/:roomName/complete', completeConversation);
router.post('/:roomName/transcript-entry', addTranscriptEntry);

export default router;
