import { Router } from 'express';
import {
  handleCreatePayroll,
  handleUpdatePayroll,
  handleGetPayroll,
  handleListPayrolls,
  handleGetPayrollMetrics,
} from './payrollController.js';
import { authenticate, authorize } from '../../middleware/auth.js';
import { validateObjectId } from '../../middleware/objectId.js';
import { validateBody } from '../../middleware/validate.js';
import {
  Permission,
  createPayrollSchema,
  updatePayrollSchema,
} from '@hrx/shared';

const router = Router();

router.use(authenticate);

// Metrics (HR / Admin)
router.get(
  '/metrics',
  authorize(Permission.PAYROLL_READ_ALL),
  handleGetPayrollMetrics
);

// List payroll records (Scoping inside service blocks Manager, allows Employee self, HR/Admin all)
router.get(
  '/',
  authorize(Permission.PAYROLL_READ_SELF),
  handleListPayrolls
);

// Get single payslip by ID
router.get(
  '/:id',
  validateObjectId('id'),
  authorize(Permission.PAYROLL_READ_SELF),
  handleGetPayroll
);

// Create payroll record (HR / Admin)
router.post(
  '/',
  authorize(Permission.PAYROLL_MANAGE),
  validateBody(createPayrollSchema),
  handleCreatePayroll
);

// Update payroll record (HR / Admin)
router.patch(
  '/:id',
  validateObjectId('id'),
  authorize(Permission.PAYROLL_MANAGE),
  validateBody(updatePayrollSchema),
  handleUpdatePayroll
);

export const payrollRoutes = router;
