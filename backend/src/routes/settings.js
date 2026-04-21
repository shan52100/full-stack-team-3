import { Router } from 'express';
import {
  getSettings,
  updateSettings,
  getApiKeys,
  revealApiKey,
  generateNewApiKey,
  revokeApiKey,
} from '../controllers/settingsController.js';
import { protect } from '../middleware/auth.js';

const router = Router();

router.get('/', getSettings);
router.put('/', protect, updateSettings);
router.get('/api-keys', protect, getApiKeys);
router.get('/api-keys/:keyId/reveal', protect, revealApiKey);
router.post('/api-keys/generate', protect, generateNewApiKey);
router.delete('/api-keys/:keyId', protect, revokeApiKey);

export default router;
