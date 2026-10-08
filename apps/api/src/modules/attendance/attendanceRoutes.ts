import { Router } from 'express';
import {
  handleCheckIn,
  handleCheckOut,
  handleGetHistory,
  handleGetSummary,
} from './attendanceController.js';
import { authenticate, authorize } from '../../middleware/auth.js';
import { Permission } from '@hrx/shared';

const router = Router();

router.use(authenticate);

router.post('/check-in', authorize(Permission.ATTENDANCE_CHECKIN), handleCheckIn);
router.post('/check-out', authorize(Permission.ATTENDANCE_CHECKIN), handleCheckOut);
router.get('/', handleGetHistory);
router.get('/summary', handleGetSummary);

export const attendanceRoutes = router;
