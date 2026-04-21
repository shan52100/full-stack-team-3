import { Router } from 'express';
import { getCallLogs, getCallLog, getCallStats } from '../controllers/logController.js';

const router = Router();

router.get('/', getCallLogs);
router.get('/stats', getCallStats);
router.get('/:id', getCallLog);

export default router;
