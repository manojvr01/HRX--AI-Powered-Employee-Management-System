import { Request, Response, Router } from 'express';
import { analyticsService } from './analyticsService.js';
import { authenticate } from '../../middleware/auth.js';
import { UnauthorizedError } from '../../utils/errors.js';

export class AnalyticsController {
  async getOverview(req: Request, res: Response): Promise<void> {
    if (!req.user) throw new UnauthorizedError();
    const metrics = await analyticsService.getOverviewMetrics(req.user);
    res.status(200).json({
      success: true,
      data: metrics,
    });
  }
}

export const analyticsController = new AnalyticsController();

const router = Router();
router.use(authenticate);
router.get('/overview', analyticsController.getOverview.bind(analyticsController));

export const analyticsRoutes = router;
