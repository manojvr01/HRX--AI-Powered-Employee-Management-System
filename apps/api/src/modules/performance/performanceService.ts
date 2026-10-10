import mongoose from 'mongoose';
import { PerformanceReview, IPerformanceReviewDocument } from '../../models/PerformanceReview.js';
import { Employee } from '../../models/Employee.js';
import { PerformanceReviewStatus, UserRole } from '@hrx/shared';
import { ForbiddenError, NotFoundError } from '../../utils/errors.js';
import { logAudit } from '../../services/auditService.js';
import { createAndSendNotification } from '../../services/notificationService.js';
import { aiService } from '../../services/aiService.js';
import { AuthenticatedUser } from '../../middleware/auth.js';
import { Request } from 'express';

export class PerformanceService {
  async createReview(
    data: {
      employeeId: string;
      reviewPeriod: string;
      ratings: { category: string; score: number; comments?: string }[];
      overallRating: number;
      strengths?: string;
      areasForImprovement?: string;
      goals?: string;
      aiSummary?: string;
      status?: PerformanceReviewStatus;
    },
    currentUser: AuthenticatedUser,
    req?: Request
  ): Promise<IPerformanceReviewDocument> {
    const employee = await Employee.findById(data.employeeId);
    if (!employee) {
      throw new NotFoundError('Employee not found');
    }

    // Role check: HR and Admin can create for anyone. Managers can create only for direct reports.
    if (currentUser.role === UserRole.MANAGER) {
      if (employee.managerId?.toString() !== currentUser.employeeId) {
        throw new ForbiddenError('Managers can only create performance reviews for direct reports');
      }
    } else if (currentUser.role === UserRole.EMPLOYEE) {
      throw new ForbiddenError('Employees cannot create performance reviews');
    }

    const review = await PerformanceReview.create({
      employeeId: new mongoose.Types.ObjectId(data.employeeId),
      reviewerId: new mongoose.Types.ObjectId(currentUser.id),
      reviewPeriod: data.reviewPeriod,
      ratings: data.ratings,
      overallRating: data.overallRating,
      strengths: data.strengths,
      areasForImprovement: data.areasForImprovement,
      goals: data.goals,
      aiSummary: data.aiSummary,
      status: data.status || PerformanceReviewStatus.DRAFT,
    });

    await logAudit({
      userId: currentUser.id,
      action: 'PERFORMANCE_REVIEW_CREATED',
      entity: 'PerformanceReview',
      entityId: review._id.toString(),
      details: {
        employeeId: data.employeeId,
        reviewPeriod: data.reviewPeriod,
        overallRating: data.overallRating,
        status: review.status,
      },
      req,
    });

    if (review.status === PerformanceReviewStatus.FINALIZED && employee.userId) {
      await createAndSendNotification({
        userId: employee.userId.toString(),
        title: 'Performance Review Finalized',
        message: `Your performance review for ${data.reviewPeriod} has been finalized.`,
        type: 'SUCCESS',
        link: '/performance',
      });
    }

    return review;
  }

  async updateReview(
    id: string,
    data: Partial<{
      reviewPeriod: string;
      ratings: { category: string; score: number; comments?: string }[];
      overallRating: number;
      strengths: string;
      areasForImprovement: string;
      goals: string;
      aiSummary: string;
      status: PerformanceReviewStatus;
    }>,
    currentUser: AuthenticatedUser,
    req?: Request
  ): Promise<IPerformanceReviewDocument> {
    const review = await PerformanceReview.findById(id);
    if (!review) {
      throw new NotFoundError('Performance review not found');
    }

    const employee = await Employee.findById(review.employeeId);

    // Permissions check
    if (currentUser.role === UserRole.MANAGER) {
      if (employee?.managerId?.toString() !== currentUser.employeeId) {
        throw new ForbiddenError('Managers can only update performance reviews for direct reports');
      }
    } else if (currentUser.role === UserRole.EMPLOYEE) {
      throw new ForbiddenError('Employees cannot modify performance reviews');
    }

    if (data.reviewPeriod !== undefined) review.reviewPeriod = data.reviewPeriod;
    if (data.ratings !== undefined) review.ratings = data.ratings;
    if (data.overallRating !== undefined) review.overallRating = data.overallRating;
    if (data.strengths !== undefined) review.strengths = data.strengths;
    if (data.areasForImprovement !== undefined) review.areasForImprovement = data.areasForImprovement;
    if (data.goals !== undefined) review.goals = data.goals;
    if (data.aiSummary !== undefined) review.aiSummary = data.aiSummary;

    const wasDraft = review.status === PerformanceReviewStatus.DRAFT;
    if (data.status !== undefined) {
      review.status = data.status;
    }

    await review.save();

    await logAudit({
      userId: currentUser.id,
      action: 'PERFORMANCE_REVIEW_UPDATED',
      entity: 'PerformanceReview',
      entityId: review._id.toString(),
      details: { status: review.status },
      req,
    });

    if (wasDraft && review.status === PerformanceReviewStatus.FINALIZED && employee?.userId) {
      await createAndSendNotification({
        userId: employee.userId.toString(),
        title: 'Performance Review Finalized',
        message: `Your performance review for ${review.reviewPeriod} has been finalized.`,
        type: 'SUCCESS',
        link: '/performance',
      });
    }

    return review;
  }

  async getReviewById(id: string, currentUser: AuthenticatedUser): Promise<IPerformanceReviewDocument> {
    const review = await PerformanceReview.findById(id).populate('employeeId').populate('reviewerId', 'email role');
    if (!review) {
      throw new NotFoundError('Performance review not found');
    }

    const empDoc = review.employeeId as any;
    const empId = empDoc?._id ? empDoc._id.toString() : empDoc ? String(empDoc) : '';

    // IDOR Check
    if (currentUser.role === UserRole.EMPLOYEE) {
      if (empId !== currentUser.employeeId) {
        throw new ForbiddenError('Access denied to other employee reviews');
      }
      if (review.status !== PerformanceReviewStatus.FINALIZED) {
        throw new ForbiddenError('Employees can only view finalized reviews');
      }
    } else if (currentUser.role === UserRole.MANAGER) {
      const employee = await Employee.findById(empId);
      const isDirectReport = employee?.managerId?.toString() === currentUser.employeeId;
      const isSelf = empId === currentUser.employeeId;
      if (!isDirectReport && !isSelf) {
        throw new ForbiddenError('Managers can only view reviews for themselves or direct reports');
      }
      if (isSelf && !isDirectReport && review.status !== PerformanceReviewStatus.FINALIZED) {
        throw new ForbiddenError('Cannot view unfinalized self-review');
      }
    }

    return review;
  }

  async listReviews(currentUser: AuthenticatedUser, query: { employeeId?: string; status?: string }): Promise<IPerformanceReviewDocument[]> {
    const filter: Record<string, unknown> = {};

    if (currentUser.role === UserRole.EMPLOYEE) {
      if (!currentUser.employeeId) return [];
      filter.employeeId = new mongoose.Types.ObjectId(currentUser.employeeId);
      filter.status = PerformanceReviewStatus.FINALIZED;
    } else if (currentUser.role === UserRole.MANAGER) {
      if (!currentUser.employeeId) return [];
      const directReports = await Employee.find({ managerId: currentUser.employeeId }).select('_id');
      const allowedEmpIds = [
        ...(directReports as any[]).map((r) => r._id),
        new mongoose.Types.ObjectId(currentUser.employeeId),
      ];
      filter.employeeId = { $in: allowedEmpIds };
    } else {
      if (query.employeeId) {
        filter.employeeId = new mongoose.Types.ObjectId(query.employeeId);
      }
    }

    if (query.status && currentUser.role !== UserRole.EMPLOYEE) {
      filter.status = query.status;
    }

    return PerformanceReview.find(filter)
      .populate('employeeId', 'firstName lastName employeeCode position departmentId')
      .populate('reviewerId', 'email role')
      .sort({ createdAt: -1 });
  }

  async generateAiSummaryForReview(id: string, currentUser: AuthenticatedUser): Promise<string> {
    if (currentUser.role === UserRole.EMPLOYEE) {
      throw new ForbiddenError('Employees cannot generate AI summaries');
    }

    const review = await PerformanceReview.findById(id).populate('employeeId');
    if (!review) {
      throw new NotFoundError('Review not found');
    }

    const emp = review.employeeId as unknown as { firstName?: string; lastName?: string; position?: string };
    const empName = emp ? `${emp.firstName || ''} ${emp.lastName || ''}`.trim() : 'Employee';
    const position = emp?.position || 'Team Member';

    const summary = await aiService.summarizeReview({
      employeeName: empName,
      position,
      reviewPeriod: review.reviewPeriod,
      overallRating: review.overallRating,
      strengths: review.strengths,
      areasForImprovement: review.areasForImprovement,
      goals: review.goals,
      ratings: review.ratings,
    });

    review.aiSummary = summary;
    await review.save();

    return summary;
  }
}

export const performanceService = new PerformanceService();
