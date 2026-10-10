import { Request, Response, NextFunction } from 'express';
import {
  createPayrollRecord,
  updatePayrollRecord,
  getPayrollRecord,
  listPayrollRecords,
  getPayrollMetrics,
} from './payrollService.js';
import { UnauthorizedError } from '../../utils/errors.js';

export async function handleCreatePayroll(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) throw new UnauthorizedError();
    const data = await createPayrollRecord(req.user, req.body, req);
    res.status(201).json({
      success: true,
      message: 'Payroll record created successfully',
      data,
    });
  } catch (err) {
    next(err);
  }
}

export async function handleUpdatePayroll(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) throw new UnauthorizedError();
    const data = await updatePayrollRecord(req.user, req.params.id as string, req.body, req);
    res.status(200).json({
      success: true,
      message: 'Payroll record updated successfully',
      data,
    });
  } catch (err) {
    next(err);
  }
}

export async function handleGetPayroll(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) throw new UnauthorizedError();
    const data = await getPayrollRecord(req.user, req.params.id as string);
    res.status(200).json({
      success: true,
      data,
    });
  } catch (err) {
    next(err);
  }
}

export async function handleListPayrolls(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) throw new UnauthorizedError();
    const result = await listPayrollRecords(req.user, req.query);
    res.status(200).json({
      success: true,
      data: result.data,
      meta: result.meta,
    });
  } catch (err) {
    next(err);
  }
}

export async function handleGetPayrollMetrics(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) throw new UnauthorizedError();
    const data = await getPayrollMetrics(req.user);
    res.status(200).json({
      success: true,
      data,
    });
  } catch (err) {
    next(err);
  }
}
