import { Router } from 'express';
import {
  handleGetNotifications,
  handleMarkRead,
  handleMarkAllRead,
} from './notificationController.js';
import { authenticate } from '../../middleware/auth.js';
import { validateObjectId } from '../../middleware/objectId.js';

const router = Router();

router.use(authenticate);

router.get('/', handleGetNotifications);
router.patch('/read-all', handleMarkAllRead);
router.patch('/:id/read', validateObjectId('id'), handleMarkRead);

export const notificationRoutes = router;
