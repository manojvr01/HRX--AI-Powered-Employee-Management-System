import { Router, Request, Response } from 'express';
import { AuditLog } from '../../models/AuditLog.js';
import { authenticate, authorize } from '../../middleware/auth.js';
import { Permission } from '@hrx/shared';

const router = Router();
router.use(authenticate);

// View audit logs: Admin only
router.get(
  '/',
  authorize(Permission.AUDIT_READ),
  async (req: Request, res: Response): Promise<void> => {
    const page = Math.max(1, parseInt((req.query.page as string) || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt((req.query.limit as string) || '20', 10)));
    const skip = (page - 1) * limit;

    const filter: Record<string, unknown> = {};
    if (req.query.action) filter.action = req.query.action;
    if (req.query.entity) filter.entity = req.query.entity;
    if (req.query.userId) filter.userId = req.query.userId;
    if (req.query.startDate && req.query.endDate) {
      filter.createdAt = {
        $gte: new Date(req.query.startDate as string),
        $lte: new Date(req.query.endDate as string),
      };
    }

    const [logs, total] = await Promise.all([
      AuditLog.find(filter)
        .populate('userId', 'email role')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      AuditLog.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      data: logs,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  }
);

export const auditRoutes = router;
