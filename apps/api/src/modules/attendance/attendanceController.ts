import { Request, Response, NextFunction } from 'express';
import {
  checkIn,
  checkOut,
  getAttendanceHistory,
  getMonthlySummary,
} from './attendanceService.js';
import { UnauthorizedError } from '../../utils/errors.js';

export async function handleCheckIn(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) throw new UnauthorizedError();
    const data = await checkIn(req.user, req.body?.notes, req);
    res.status(201).json({
      success: true,
      message: 'Check-in recorded successfully',
      data,
    });
  } catch (err) {
    next(err);
  }
}

export async function handleCheckOut(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) throw new UnauthorizedError();
    const data = await checkOut(req.user, req.body?.notes, req);
    res.status(200).json({
      success: true,
      message: 'Check-out recorded successfully',
      data,
    });
  } catch (err) {
    next(err);
  }
}

export async function handleGetHistory(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) throw new UnauthorizedError();
    const result = await getAttendanceHistory(req.user, req.query);
    res.status(200).json({
      success: true,
      data: result.data,
      meta: result.meta,
    });
  } catch (err) {
    next(err);
  }
}

export async function handleGetSummary(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) throw new UnauthorizedError();
    const month = parseInt(req.query.month as string, 10) || new Date().getMonth() + 1;
    const year = parseInt(req.query.year as string, 10) || new Date().getFullYear();
    const targetEmployeeId = req.query.employeeId as string | undefined;

    const data = await getMonthlySummary(req.user, month, year, targetEmployeeId);
    res.status(200).json({ success: true, data });
  } catch (err) {
    next(err);
  }
}
