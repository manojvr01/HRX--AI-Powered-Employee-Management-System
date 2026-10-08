import { Request, Response, NextFunction } from 'express';
import {
  applyLeave,
  approveLeave,
  rejectLeave,
  cancelLeave,
  listLeaveRequests,
  getLeaveBalances,
} from './leaveService.js';
import { LeaveType } from '../../models/LeaveType.js';
import { UnauthorizedError } from '../../utils/errors.js';

export async function handleApplyLeave(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) throw new UnauthorizedError();
    const data = await applyLeave(req.user, req.body, req);
    res.status(201).json({
      success: true,
      message: 'Leave application submitted successfully',
      data,
    });
  } catch (err) {
    next(err);
  }
}

export async function handleApproveLeave(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) throw new UnauthorizedError();
    const data = await approveLeave(req.params.id as string, req.user, req);
    res.status(200).json({
      success: true,
      message: 'Leave request approved successfully',
      data,
    });
  } catch (err) {
    next(err);
  }
}

export async function handleRejectLeave(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) throw new UnauthorizedError();
    const data = await rejectLeave(
      req.params.id as string,
      req.user,
      req.body?.rejectionReason,
      req
    );
    res.status(200).json({
      success: true,
      message: 'Leave request rejected',
      data,
    });
  } catch (err) {
    next(err);
  }
}

export async function handleCancelLeave(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) throw new UnauthorizedError();
    const data = await cancelLeave(req.params.id as string, req.user, req);
    res.status(200).json({
      success: true,
      message: 'Leave request cancelled',
      data,
    });
  } catch (err) {
    next(err);
  }
}

export async function handleListLeaves(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) throw new UnauthorizedError();
    const result = await listLeaveRequests(req.user, req.query);
    res.status(200).json({
      success: true,
      data: result.data,
      meta: result.meta,
    });
  } catch (err) {
    next(err);
  }
}

export async function handleGetBalances(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) throw new UnauthorizedError();
    const targetEmployeeId = req.query.employeeId as string | undefined;
    const data = await getLeaveBalances(req.user, targetEmployeeId);
    res.status(200).json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function handleListLeaveTypes(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const data = await LeaveType.find({ isActive: true }).sort({ name: 1 }).lean();
    res.status(200).json({ success: true, data });
  } catch (err) {
    next(err);
  }
}
