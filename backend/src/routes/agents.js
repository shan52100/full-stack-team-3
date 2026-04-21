import { Router } from 'express';
import {
  getAgents,
  getAgent,
  createAgent,
  updateAgent,
  deleteAgent,
  toggleAgentStatus,
  startCall,
} from '../controllers/agentController.js';
import { protect } from '../middleware/auth.js';

const router = Router();

router.get('/', protect, getAgents);
router.get('/:id', protect, getAgent);
router.post('/', protect, createAgent);
router.patch('/:id', protect, updateAgent);
router.delete('/:id', protect, deleteAgent);
router.patch('/:id/toggle', protect, toggleAgentStatus);
router.post('/:id/call', protect, startCall);

export default router;
