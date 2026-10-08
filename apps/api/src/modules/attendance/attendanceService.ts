import { Attendance, IAttendanceDocument } from '../../models/Attendance.js';
import { OrgSettings } from '../../models/OrgSettings.js';
import { Employee } from '../../models/Employee.js';
import {
  NotFoundError,
  ConflictError,
  ValidationError,
  ForbiddenError,
} from '../../utils/errors.js';
import {
  getTodayDateString,
  getHourAndMinuteInTimezone,
  calculateDurationMinutes,
} from '../../utils/timezone.js';
import { AuthenticatedUser } from '../../middleware/auth.js';
import { AttendanceStatus, UserRole } from '@hrx/shared';
import { canAccessEmployee } from '../../middleware/scoping.js';
import { logAudit } from '../../services/auditService.js';
import mongoose from 'mongoose';
import { Request } from 'express';

export async function checkIn(
  user: AuthenticatedUser,
  notes?: string,
  req?: Request
): Promise<IAttendanceDocument> {
  if (!user.employeeId) {
    throw new ValidationError('User has no associated employee profile to record attendance');
  }

  const employeeObjectId = new mongoose.Types.ObjectId(user.employeeId);
  const settings = await OrgSettings.findOne().lean();
  const timezone = settings?.timezone || 'Asia/Kolkata';
  const startHour = settings?.workDayStartHour ?? 9;
  const lateThresholdMin = settings?.lateThresholdMinutes ?? 15;

  const todayDateStr = getTodayDateString(timezone);

  // Check if attendance already recorded today
  const existing = await Attendance.findOne({
    employeeId: employeeObjectId,
    date: todayDateStr,
  });

  if (existing) {
    throw new ConflictError(`Attendance already recorded for today (${todayDateStr})`);
  }

  const now = new Date();
  const { hour, minute } = getHourAndMinuteInTimezone(now, timezone);

  // Determine late status
  const checkInMinutes = hour * 60 + minute;
  const thresholdMinutes = startHour * 60 + lateThresholdMin;
  const isLate = checkInMinutes > thresholdMinutes;

  const attendance = await Attendance.create({
    employeeId: employeeObjectId,
    date: todayDateStr,
    checkInTime: now,
    status: isLate ? AttendanceStatus.LATE : AttendanceStatus.PRESENT,
    notes,
    durationMinutes: 0,
  });

  await logAudit({
    userId: user.id,
    action: 'ATTENDANCE_CHECKIN',
    entity: 'Attendance',
    entityId: attendance._id.toString(),
    details: { date: todayDateStr, status: attendance.status },
    req,
  });

  return attendance;
}

export async function checkOut(
  user: AuthenticatedUser,
  notes?: string,
  req?: Request
): Promise<IAttendanceDocument> {
  if (!user.employeeId) {
    throw new ValidationError('User has no associated employee profile');
  }

  const employeeObjectId = new mongoose.Types.ObjectId(user.employeeId);
  const settings = await OrgSettings.findOne().lean();
  const timezone = settings?.timezone || 'Asia/Kolkata';
  const todayDateStr = getTodayDateString(timezone);

  const attendance = await Attendance.findOne({
    employeeId: employeeObjectId,
    date: todayDateStr,
  });

  if (!attendance) {
    throw new NotFoundError(
      `No active check-in found for today (${todayDateStr}). You must check in before checking out.`
    );
  }

  if (attendance.checkOutTime) {
    throw new ConflictError('You have already checked out for today');
  }

  const now = new Date();
  if (now.getTime() < attendance.checkInTime.getTime()) {
    throw new ValidationError('Check-out time cannot be earlier than check-in time');
  }

  const durationMinutes = calculateDurationMinutes(attendance.checkInTime, now);

  attendance.checkOutTime = now;
  attendance.durationMinutes = durationMinutes;
  if (notes) attendance.notes = attendance.notes ? `${attendance.notes} | ${notes}` : notes;

  // If worked less than 4 hours, mark as HALF_DAY unless already marked LATE
  if (durationMinutes < 240 && attendance.status === AttendanceStatus.PRESENT) {
    attendance.status = AttendanceStatus.HALF_DAY;
  }

  await attendance.save();

  await logAudit({
    userId: user.id,
    action: 'ATTENDANCE_CHECKOUT',
    entity: 'Attendance',
    entityId: attendance._id.toString(),
    details: { date: todayDateStr, durationMinutes },
    req,
  });

  return attendance;
}

export async function getAttendanceHistory(
  user: AuthenticatedUser,
  query: {
    employeeId?: string;
    startDate?: string;
    endDate?: string;
    status?: string;
    page?: number;
    limit?: number;
  }
) {
  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(query.limit) || 20));
  const skip = (page - 1) * limit;

  const filter: Record<string, any> = {};

  // Access scoping
  if (user.role === UserRole.EMPLOYEE) {
    if (!user.employeeId) return { data: [], meta: { page: 1, limit, total: 0, totalPages: 0 } };
    filter.employeeId = new mongoose.Types.ObjectId(user.employeeId);
  } else if (user.role === UserRole.MANAGER) {
    if (query.employeeId) {
      const allowed = await canAccessEmployee(user, query.employeeId);
      if (!allowed) throw new ForbiddenError('Cannot access attendance of employee outside your team');
      filter.employeeId = new mongoose.Types.ObjectId(query.employeeId);
    } else {
      // Direct reports + self
      const myReports = await Employee.find({
        managerId: new mongoose.Types.ObjectId(user.employeeId),
      }).select('_id');
      const ids = myReports.map((r) => r._id);
      if (user.employeeId) ids.push(new mongoose.Types.ObjectId(user.employeeId));
      filter.employeeId = { $in: ids };
    }
  } else {
    // ADMIN and HR
    if (query.employeeId) {
      filter.employeeId = new mongoose.Types.ObjectId(query.employeeId);
    }
  }

  if (query.startDate && query.endDate) {
    filter.date = { $gte: query.startDate, $lte: query.endDate };
  } else if (query.startDate) {
    filter.date = { $gte: query.startDate };
  } else if (query.endDate) {
    filter.date = { $lte: query.endDate };
  }

  if (query.status) {
    filter.status = query.status;
  }

  const [records, total] = await Promise.all([
    Attendance.find(filter)
      .populate('employeeId', 'firstName lastName email employeeCode departmentId position')
      .sort({ date: -1, checkInTime: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Attendance.countDocuments(filter),
  ]);

  return {
    data: records,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function getMonthlySummary(
  user: AuthenticatedUser,
  month: number,
  year: number,
  targetEmployeeId?: string
) {
  let targetEmpId = user.employeeId;

  if (targetEmployeeId && targetEmployeeId !== user.employeeId) {
    const hasAccess = await canAccessEmployee(user, targetEmployeeId);
    if (!hasAccess) throw new ForbiddenError('Unauthorized to view this attendance summary');
    targetEmpId = targetEmployeeId;
  }

  if (!targetEmpId) throw new NotFoundError('Employee profile not found');

  const monthStr = String(month).padStart(2, '0');
  const datePrefix = `${year}-${monthStr}`;

  const records = await Attendance.find({
    employeeId: new mongoose.Types.ObjectId(targetEmpId),
    date: { $regex: new RegExp(`^${datePrefix}`) },
  }).lean();

  let daysPresent = 0;
  let daysLate = 0;
  let daysHalfDay = 0;
  let totalDurationMinutes = 0;

  records.forEach((r) => {
    if (r.status === AttendanceStatus.PRESENT) daysPresent += 1;
    if (r.status === AttendanceStatus.LATE) daysLate += 1;
    if (r.status === AttendanceStatus.HALF_DAY) daysHalfDay += 1;
    totalDurationMinutes += r.durationMinutes || 0;
  });

  return {
    year,
    month,
    daysPresent,
    daysLate,
    daysHalfDay,
    totalRecords: records.length,
    totalWorkingHours: Math.round((totalDurationMinutes / 60) * 10) / 10,
    records,
  };
}
