import { Router } from 'express';
import { performanceController } from './performanceController.js';
import { authenticate, authorize } from '../../middleware/auth.js';
import { Permission } from '@hrx/shared';

const router = Router();

router.use(authenticate);

// List reviews: HR/Admin all, Manager team/self, Employee finalized self
router.get(
  '/',
  authorize(Permission.PERFORMANCE_READ_SELF),
  performanceController.listReviews.bind(performanceController)
);

// Get single review
router.get(
  '/:id',
  authorize(Permission.PERFORMANCE_READ_SELF),
  performanceController.getReviewById.bind(performanceController)
);

// Create review: Admin, HR, Manager
router.post(
  '/',
  authorize(Permission.PERFORMANCE_MANAGE),
  performanceController.createReview.bind(performanceController)
);

// Update review: Admin, HR, Manager
router.patch(
  '/:id',
  authorize(Permission.PERFORMANCE_MANAGE),
  performanceController.updateReview.bind(performanceController)
);

// Generate AI summary
router.post(
  '/:id/ai-summary',
  authorize(Permission.PERFORMANCE_MANAGE),
  performanceController.generateAiSummary.bind(performanceController)
);

export const performanceRoutes = router;
