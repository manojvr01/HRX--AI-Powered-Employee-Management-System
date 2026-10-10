import { Router, Request, Response } from 'express';
import { reportService } from './reportService.js';
import { authenticate, authorize } from '../../middleware/auth.js';
import { Permission, exportReportSchema } from '@hrx/shared';
import { UnauthorizedError } from '../../utils/errors.js';

const router = Router();
router.use(authenticate);

router.get(
  '/export',
  authorize(Permission.REPORTS_READ),
  async (req: Request, res: Response): Promise<void> => {
    if (!req.user) throw new UnauthorizedError();
    const validated = exportReportSchema.parse({
      type: req.query.type,
      format: req.query.format || 'csv',
      startDate: req.query.startDate,
      endDate: req.query.endDate,
      departmentId: req.query.departmentId,
    });

    const result = await reportService.exportReport(validated, req.user, req);

    res.setHeader('Content-Type', result.mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`);
    res.status(200).send(result.csvContent);
  }
);

export const reportRoutes = router;
