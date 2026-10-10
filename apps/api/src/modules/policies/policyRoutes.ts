import { Router } from 'express';
import { policyController } from './policyController.js';
import { authenticate, authorize } from '../../middleware/auth.js';
import { Permission } from '@hrx/shared';

const router = Router();

router.use(authenticate);

// All users can read active policies
router.get('/', policyController.listPolicies.bind(policyController));
router.get('/:id', policyController.getPolicyById.bind(policyController));

// HR & Admin can manage policies
router.post(
  '/',
  authorize(Permission.SETTINGS_MANAGE),
  policyController.createPolicy.bind(policyController)
);

router.delete(
  '/:id',
  authorize(Permission.SETTINGS_MANAGE),
  policyController.deletePolicy.bind(policyController)
);

export const policyRoutes = router;
