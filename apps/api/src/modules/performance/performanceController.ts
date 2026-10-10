import { Request, Response } from 'express';
import { performanceService } from './performanceService.js';
import { createPerformanceReviewSchema, updatePerformanceReviewSchema } from '@hrx/shared';
import { UnauthorizedError } from '../../utils/errors.js';

export class PerformanceController {
  async createReview(req: Request, res: Response): Promise<void> {
    if (!req.user) throw new UnauthorizedError();
    const data = createPerformanceReviewSchema.parse(req.body);
    const review = await performanceService.createReview(data, req.user, req);

    res.status(201).json({
      success: true,
      data: review,
      message: 'Performance review created successfully',
    });
  }

  async updateReview(req: Request, res: Response): Promise<void> {
    if (!req.user) throw new UnauthorizedError();
    const data = updatePerformanceReviewSchema.parse(req.body);
    const review = await performanceService.updateReview(req.params.id as string, data, req.user, req);

    res.status(200).json({
      success: true,
      data: review,
      message: 'Performance review updated successfully',
    });
  }

  async getReviewById(req: Request, res: Response): Promise<void> {
    if (!req.user) throw new UnauthorizedError();
    const review = await performanceService.getReviewById(req.params.id as string, req.user);
    res.status(200).json({
      success: true,
      data: review,
    });
  }

  async listReviews(req: Request, res: Response): Promise<void> {
    if (!req.user) throw new UnauthorizedError();
    const reviews = await performanceService.listReviews(req.user, {
      employeeId: req.query.employeeId as string,
      status: req.query.status as string,
    });

    res.status(200).json({
      success: true,
      data: reviews,
    });
  }

  async generateAiSummary(req: Request, res: Response): Promise<void> {
    if (!req.user) throw new UnauthorizedError();
    const summary = await performanceService.generateAiSummaryForReview(req.params.id as string, req.user);
    res.status(200).json({
      success: true,
      data: { aiSummary: summary },
      message: 'AI performance summary generated successfully',
    });
  }
}

export const performanceController = new PerformanceController();
