import { Router } from 'express';
import { getDashboardMetrics } from './dashboardController.js';
import { authenticate } from '../../middleware/auth.js';

const router = Router();

router.use(authenticate);

router.get('/metrics', getDashboardMetrics);

export const dashboardRoutes = router;
