import { Router } from 'express';
import {
  handleApplyLeave,
  handleApproveLeave,
  handleRejectLeave,
  handleCancelLeave,
  handleListLeaves,
  handleGetBalances,
  handleListLeaveTypes,
} from './leaveController.js';
import { authenticate, authorize } from '../../middleware/auth.js';
import { validateObjectId } from '../../middleware/objectId.js';
import { validateBody } from '../../middleware/validate.js';
import { Permission, applyLeaveSchema } from '@hrx/shared';

const router = Router();

router.use(authenticate);

router.get('/types', handleListLeaveTypes);
router.get('/balances', handleGetBalances);
router.get('/requests', handleListLeaves);
router.get('/', handleListLeaves);
router.post(
  '/',
  authorize(Permission.LEAVE_APPLY),
  validateBody(applyLeaveSchema),
  handleApplyLeave
);
router.patch(
  '/:id/approve',
  validateObjectId('id'),
  authorize(Permission.LEAVE_APPROVE),
  handleApproveLeave
);
router.patch(
  '/:id/reject',
  validateObjectId('id'),
  authorize(Permission.LEAVE_APPROVE),
  handleRejectLeave
);
router.patch(
  '/:id/cancel',
  validateObjectId('id'),
  handleCancelLeave
);

export const leaveRoutes = router;
