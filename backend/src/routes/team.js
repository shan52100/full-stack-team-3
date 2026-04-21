import { Router } from 'express';
import {
  getTeamMembers,
  inviteMember,
  updateMemberRole,
  removeMember,
} from '../controllers/teamController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = Router();

router.get('/', getTeamMembers);
router.post('/invite', protect, authorize('admin'), inviteMember);
router.patch('/:id/role', protect, authorize('admin'), updateMemberRole);
router.delete('/:id', protect, authorize('admin'), removeMember);

export default router;
