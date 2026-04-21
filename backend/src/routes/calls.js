import { Router } from 'express';
import {
  initiateCall,
  terminateCall,
  getActiveRooms,
  getRoomParticipants,
  getCallToken,
  getTrunks,
} from '../controllers/callController.js';
import { protect } from '../middleware/auth.js';

const router = Router();

// Voice call management (LiveKit + SIP)
router.post('/initiate', protect, initiateCall);
router.post('/terminate', protect, terminateCall);
router.get('/rooms', getActiveRooms);
router.get('/rooms/:roomName/participants', getRoomParticipants);
router.post('/token', protect, getCallToken);
router.get('/trunks', getTrunks);

export default router;
