import { Router } from 'express';
import { aiController } from './aiController.js';
import { authenticate, authorize } from '../../middleware/auth.js';
import { Permission } from '@hrx/shared';
import { aiRateLimiter } from '../../middleware/rateLimiter.js';

const router = Router();

router.use(authenticate);
router.use(aiRateLimiter);

// AI HR Assistant query: all authenticated roles with AI_USE permission
router.post(
  '/assistant',
  authorize(Permission.AI_USE),
  aiController.askAssistant.bind(aiController)
);

export const aiRoutes = router;
