import { LeaveRequest, ILeaveRequestDocument } from '../../models/LeaveRequest.js';
import { LeaveType, ILeaveTypeDocument } from '../../models/LeaveType.js';
import { LeaveBalance, ILeaveBalanceDocument } from '../../models/LeaveBalance.js';
import { Employee } from '../../models/Employee.js';
import { OrgSettings } from '../../models/OrgSettings.js';
import { Holiday } from '../../models/Holiday.js';
import { User } from '../../models/User.js';
import {
  NotFoundError,
  ConflictError,
  ValidationError,
  ForbiddenError,
} from '../../utils/errors.js';
import { AuthenticatedUser } from '../../middleware/auth.js';
import { LeaveRequestStatus, UserRole } from '@hrx/shared';
import { canAccessEmployee } from '../../middleware/scoping.js';
import { createAndSendNotification } from '../../services/notificationService.js';
import { logAudit } from '../../services/auditService.js';
import mongoose from 'mongoose';
import { Request } from 'express';

/**
 * Calculates working days between two YYYY-MM-DD dates,
 * excluding weekends based on OrgSettings.workWeekDays and official holidays.
 */
export async function calculateWorkingDays(
  startDateStr: string,
  endDateStr: string
): Promise<number> {
  const start = new Date(startDateStr);
  const end = new Date(endDateStr);

  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    throw new ValidationError('Invalid date format. Expected YYYY-MM-DD');
  }

  if (start > end) {
    throw new ValidationError('Start date cannot be after end date');
  }

  const settings = await OrgSettings.findOne().lean();
  const workWeekDays = settings?.workWeekDays || [1, 2, 3, 4, 5];

  // Fetch holidays within the range
  const holidays = await Holiday.find({
    date: { $gte: startDateStr, $lte: endDateStr },
  }).lean();
  const holidayDateSet = new Set(holidays.map((h) => h.date));

  let workingDays = 0;
  const current = new Date(start);

  while (current <= end) {
    const dayOfWeek = current.getUTCDay();
    const dateStr = current.toISOString().split('T')[0];

    // Check weekend and holiday
    if (workWeekDays.includes(dayOfWeek) && !holidayDateSet.has(dateStr)) {
      workingDays += 1;
    }

    current.setUTCDate(current.getUTCDate() + 1);
  }

  return workingDays;
}

export async function applyLeave(
  user: AuthenticatedUser,
  data: {
    leaveTypeId: string;
    startDate: string;
    endDate: string;
    reason: string;
  },
  req?: Request
): Promise<ILeaveRequestDocument> {
  if (!user.employeeId) {
    throw new ValidationError('User must be linked to an employee record to apply for leave');
  }

  const employeeId = new mongoose.Types.ObjectId(user.employeeId);
  const leaveTypeId = new mongoose.Types.ObjectId(data.leaveTypeId);

  const leaveType = await LeaveType.findById(leaveTypeId);
  if (!leaveType || !leaveType.isActive) {
    throw new NotFoundError('Leave type not found or inactive');
  }

  // 1. Calculate working days
  const workingDays = await calculateWorkingDays(data.startDate, data.endDate);
  if (workingDays <= 0) {
    throw new ValidationError(
      'Selected date range contains 0 working days (weekends or public holidays only)'
    );
  }

  // 2. Overlap check with existing PENDING or APPROVED requests
  const existingOverlap = await LeaveRequest.findOne({
    employeeId,
    status: { $in: [LeaveRequestStatus.PENDING, LeaveRequestStatus.APPROVED] },
    startDate: { $lte: data.endDate },
    endDate: { $gte: data.startDate },
  });

  if (existingOverlap) {
    throw new ConflictError(
      `You already have an active leave request (${existingOverlap.status}) overlapping with this period`
    );
  }

  // 3. Balance verification
  const year = parseInt(data.startDate.split('-')[0], 10);
  let balance = await LeaveBalance.findOne({ employeeId, leaveTypeId, year });

  if (!balance) {
    // Auto-initialize balance if not created yet
    balance = await LeaveBalance.create({
      employeeId,
      leaveTypeId,
      year,
      allocatedDays: leaveType.daysAllowedPerYear,
      usedDays: 0,
      pendingDays: 0,
      remainingDays: leaveType.daysAllowedPerYear,
    });
  }

  if (balance.remainingDays < workingDays) {
    throw new ValidationError(
      `Insufficient leave balance. You have ${balance.remainingDays} days remaining, but requested ${workingDays} days`
    );
  }

  // Atomically hold pending days
  balance.pendingDays += workingDays;
  balance.remainingDays -= workingDays;
  await balance.save();

  // Create request
  const leaveRequest = await LeaveRequest.create({
    employeeId,
    leaveTypeId,
    startDate: data.startDate,
    endDate: data.endDate,
    daysCount: workingDays,
    reason: data.reason,
    status: LeaveRequestStatus.PENDING,
    appliedAt: new Date(),
  });

  await logAudit({
    userId: user.id,
    action: 'LEAVE_APPLIED',
    entity: 'LeaveRequest',
    entityId: leaveRequest._id.toString(),
    details: { daysCount: workingDays, startDate: data.startDate, endDate: data.endDate },
    req,
  });

  return leaveRequest;
}

export async function approveLeave(
  requestId: string,
  approver: AuthenticatedUser,
  req?: Request
): Promise<ILeaveRequestDocument> {
  const leaveRequest = await LeaveRequest.findById(requestId);
  if (!leaveRequest) throw new NotFoundError('Leave request not found');

  if (leaveRequest.status !== LeaveRequestStatus.PENDING) {
    throw new ValidationError(`Cannot approve leave request in '${leaveRequest.status}' status`);
  }

  const employee = await Employee.findById(leaveRequest.employeeId);
  if (!employee) throw new NotFoundError('Associated employee not found');

  // AUTHORIZATION SCOPING:
  // Managers can ONLY approve leave requests for their direct reports!
  if (approver.role === UserRole.MANAGER) {
    if (!employee.managerId || employee.managerId.toString() !== approver.employeeId) {
      throw new ForbiddenError('Managers can only approve leave requests for their direct reports');
    }
  }

  const year = parseInt(leaveRequest.startDate.split('-')[0], 10);
  const balance = await LeaveBalance.findOne({
    employeeId: leaveRequest.employeeId,
    leaveTypeId: leaveRequest.leaveTypeId,
    year,
  });

  if (!balance) throw new NotFoundError('Leave balance record not found');

  // ATOMIC BALANCE DEDUCTION:
  // Balance is permanently deducted on approval
  balance.usedDays += leaveRequest.daysCount;
  balance.pendingDays = Math.max(0, balance.pendingDays - leaveRequest.daysCount);
  await balance.save();

  leaveRequest.status = LeaveRequestStatus.APPROVED;
  leaveRequest.approverId = new mongoose.Types.ObjectId(approver.id);
  leaveRequest.actionedAt = new Date();
  await leaveRequest.save();

  // Send real-time notification to the employee
  const employeeUser = await User.findOne({ employeeId: employee._id });
  if (employeeUser) {
    await createAndSendNotification({
      userId: employeeUser._id,
      title: 'Leave Request Approved',
      message: `Your leave request from ${leaveRequest.startDate} to ${leaveRequest.endDate} (${leaveRequest.daysCount} days) has been approved.`,
      type: 'SUCCESS',
      link: '/leave',
    });
  }

  await logAudit({
    userId: approver.id,
    action: 'LEAVE_APPROVED',
    entity: 'LeaveRequest',
    entityId: leaveRequest._id.toString(),
    details: { employeeId: employee._id.toString(), daysCount: leaveRequest.daysCount },
    req,
  });

  return leaveRequest;
}

export async function rejectLeave(
  requestId: string,
  approver: AuthenticatedUser,
  rejectionReason?: string,
  req?: Request
): Promise<ILeaveRequestDocument> {
  const leaveRequest = await LeaveRequest.findById(requestId);
  if (!leaveRequest) throw new NotFoundError('Leave request not found');

  if (leaveRequest.status !== LeaveRequestStatus.PENDING) {
    throw new ValidationError(`Cannot reject leave request in '${leaveRequest.status}' status`);
  }

  const employee = await Employee.findById(leaveRequest.employeeId);
  if (!employee) throw new NotFoundError('Employee not found');

  if (approver.role === UserRole.MANAGER) {
    if (!employee.managerId || employee.managerId.toString() !== approver.employeeId) {
      throw new ForbiddenError('Managers can only reject leave requests for their direct reports');
    }
  }

  // Refund pending balance back to remaining days
  const year = parseInt(leaveRequest.startDate.split('-')[0], 10);
  const balance = await LeaveBalance.findOne({
    employeeId: leaveRequest.employeeId,
    leaveTypeId: leaveRequest.leaveTypeId,
    year,
  });

  if (balance) {
    balance.pendingDays = Math.max(0, balance.pendingDays - leaveRequest.daysCount);
    balance.remainingDays += leaveRequest.daysCount;
    await balance.save();
  }

  leaveRequest.status = LeaveRequestStatus.REJECTED;
  leaveRequest.approverId = new mongoose.Types.ObjectId(approver.id);
  leaveRequest.rejectionReason = rejectionReason;
  leaveRequest.actionedAt = new Date();
  await leaveRequest.save();

  // Send notification to employee
  const employeeUser = await User.findOne({ employeeId: employee._id });
  if (employeeUser) {
    await createAndSendNotification({
      userId: employeeUser._id,
      title: 'Leave Request Rejected',
      message: `Your leave request for ${leaveRequest.startDate} was rejected.${rejectionReason ? ` Reason: ${rejectionReason}` : ''}`,
      type: 'ALERT',
      link: '/leave',
    });
  }

  await logAudit({
    userId: approver.id,
    action: 'LEAVE_REJECTED',
    entity: 'LeaveRequest',
    entityId: leaveRequest._id.toString(),
    details: { rejectionReason },
    req,
  });

  return leaveRequest;
}

export async function cancelLeave(
  requestId: string,
  user: AuthenticatedUser,
  req?: Request
): Promise<ILeaveRequestDocument> {
  const leaveRequest = await LeaveRequest.findById(requestId);
  if (!leaveRequest) throw new NotFoundError('Leave request not found');

  if (leaveRequest.status !== LeaveRequestStatus.PENDING) {
    throw new ValidationError(`Cannot cancel leave request in '${leaveRequest.status}' status`);
  }

  if (user.role === UserRole.EMPLOYEE && leaveRequest.employeeId.toString() !== user.employeeId) {
    throw new ForbiddenError('You can only cancel your own leave requests');
  }

  const year = parseInt(leaveRequest.startDate.split('-')[0], 10);
  const balance = await LeaveBalance.findOne({
    employeeId: leaveRequest.employeeId,
    leaveTypeId: leaveRequest.leaveTypeId,
    year,
  });

  if (balance) {
    balance.pendingDays = Math.max(0, balance.pendingDays - leaveRequest.daysCount);
    balance.remainingDays += leaveRequest.daysCount;
    await balance.save();
  }

  leaveRequest.status = LeaveRequestStatus.CANCELLED;
  leaveRequest.actionedAt = new Date();
  await leaveRequest.save();

  await logAudit({
    userId: user.id,
    action: 'LEAVE_CANCELLED',
    entity: 'LeaveRequest',
    entityId: leaveRequest._id.toString(),
    req,
  });

  return leaveRequest;
}

export async function listLeaveRequests(
  user: AuthenticatedUser,
  query: {
    status?: string;
    employeeId?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
  }
) {
  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(query.limit) || 20));
  const skip = (page - 1) * limit;

  const filter: Record<string, any> = {};

  if (user.role === UserRole.EMPLOYEE) {
    if (!user.employeeId) return { data: [], meta: { page: 1, limit, total: 0, totalPages: 0 } };
    filter.employeeId = new mongoose.Types.ObjectId(user.employeeId);
  } else if (user.role === UserRole.MANAGER) {
    if (query.employeeId) {
      const allowed = await canAccessEmployee(user, query.employeeId);
      if (!allowed) throw new ForbiddenError('Cannot access leave requests outside your team');
      filter.employeeId = new mongoose.Types.ObjectId(query.employeeId);
    } else {
      const myReports = await Employee.find({
        managerId: new mongoose.Types.ObjectId(user.employeeId),
      }).select('_id');
      const ids = myReports.map((r) => r._id);
      if (user.employeeId) ids.push(new mongoose.Types.ObjectId(user.employeeId));
      filter.employeeId = { $in: ids };
    }
  } else {
    if (query.employeeId) filter.employeeId = new mongoose.Types.ObjectId(query.employeeId);
  }

  if (query.status) filter.status = query.status;
  if (query.startDate) filter.startDate = { $gte: query.startDate };
  if (query.endDate) filter.endDate = { $lte: query.endDate };

  const [requests, total] = await Promise.all([
    LeaveRequest.find(filter)
      .populate('employeeId', 'firstName lastName email employeeCode departmentId position')
      .populate('leaveTypeId', 'name code isPaid')
      .populate('approverId', 'email role')
      .sort({ appliedAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    LeaveRequest.countDocuments(filter),
  ]);

  return {
    data: requests,
    meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}

export async function getLeaveBalances(user: AuthenticatedUser, targetEmployeeId?: string) {
  let empId = user.employeeId;
  if (targetEmployeeId && targetEmployeeId !== user.employeeId) {
    const allowed = await canAccessEmployee(user, targetEmployeeId);
    if (!allowed) throw new ForbiddenError('Unauthorized to access this employee balance');
    empId = targetEmployeeId;
  }

  if (!empId) throw new NotFoundError('Employee profile not found');

  const currentYear = new Date().getFullYear();
  return LeaveBalance.find({
    employeeId: new mongoose.Types.ObjectId(empId),
    year: currentYear,
  })
    .populate('leaveTypeId', 'name code isPaid daysAllowedPerYear')
    .lean();
}
