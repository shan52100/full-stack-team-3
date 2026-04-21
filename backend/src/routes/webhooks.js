import { Router } from 'express';
import { handleLivekitWebhook, testWebhook } from '../controllers/webhookController.js';
import { protect } from '../middleware/auth.js';

const router = Router();

// LiveKit sends webhook events here
router.post('/livekit', handleLivekitWebhook);

// Test configured webhook URL
router.post('/test', protect, testWebhook);

export default router;
