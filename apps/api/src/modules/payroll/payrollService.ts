import mongoose from 'mongoose';
import { Request } from 'express';
import { Payroll, IPayrollDocument } from '../../models/Payroll.js';
import { Employee } from '../../models/Employee.js';
import { User } from '../../models/User.js';
import { AuthenticatedUser } from '../../middleware/auth.js';
import {
  UserRole,
  PayrollStatus,
} from '@hrx/shared';
import {
  ForbiddenError,
  NotFoundError,
  ConflictError,
  ValidationError,
} from '../../utils/errors.js';
import { logAudit } from '../../services/auditService.js';
import { createAndSendNotification } from '../../services/notificationService.js';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

/**
 * Server-side computation of salary totals. Client calculations are never trusted.
 */
export function computeSalaryTotals(
  basicSalary: number,
  hra: number = 0,
  allowances: number = 0,
  deductions: number = 0
): { grossSalary: number; netSalary: number } {
  const grossSalary = Math.round((basicSalary + hra + allowances) * 100) / 100;
  const netSalary = Math.max(0, Math.round((grossSalary - deductions) * 100) / 100);
  return { grossSalary, netSalary };
}

export async function createPayrollRecord(
  creator: AuthenticatedUser,
  data: {
    employeeId: string;
    month: number;
    year: number;
    basicSalary: number;
    hra?: number;
    allowances?: number;
    deductions?: number;
    status?: PayrollStatus;
    notes?: string;
  },
  req?: Request
): Promise<IPayrollDocument> {
  const employee = await Employee.findById(data.employeeId);
  if (!employee) {
    throw new NotFoundError('Employee not found');
  }

  // Check duplicate month/year for this employee
  const existing = await Payroll.findOne({
    employeeId: new mongoose.Types.ObjectId(data.employeeId),
    year: data.year,
    month: data.month,
  });

  if (existing) {
    throw new ConflictError(
      `Payroll record already exists for ${employee.firstName} ${employee.lastName} for ${MONTH_NAMES[data.month - 1]} ${data.year}`
    );
  }

  const { grossSalary, netSalary } = computeSalaryTotals(
    data.basicSalary,
    data.hra,
    data.allowances,
    data.deductions
  );

  const status = data.status || PayrollStatus.DRAFT;
  const paidAt = status === PayrollStatus.PAID ? new Date() : undefined;

  const payroll = await Payroll.create({
    employeeId: new mongoose.Types.ObjectId(data.employeeId),
    month: data.month,
    year: data.year,
    basicSalary: data.basicSalary,
    hra: data.hra || 0,
    allowances: data.allowances || 0,
    deductions: data.deductions || 0,
    grossSalary,
    netSalary,
    status,
    paidAt,
    notes: data.notes,
  });

  // Audit log
  await logAudit({
    userId: creator.id,
    action: 'PAYROLL_CREATED',
    entity: 'Payroll',
    entityId: payroll._id.toString(),
    details: {
      employeeId: data.employeeId,
      month: data.month,
      year: data.year,
      grossSalary,
      netSalary,
      status,
    },
    req,
  });

  // If created as PROCESSED or PAID, send notification to employee
  if (status === PayrollStatus.PROCESSED || status === PayrollStatus.PAID) {
    await sendPayslipNotification(employee._id.toString(), data.month, data.year);
  }

  return payroll;
}

export async function updatePayrollRecord(
  updater: AuthenticatedUser,
  id: string,
  data: {
    basicSalary?: number;
    hra?: number;
    allowances?: number;
    deductions?: number;
    status?: PayrollStatus;
    notes?: string;
  },
  req?: Request
): Promise<IPayrollDocument> {
  const payroll = await Payroll.findById(id);
  if (!payroll) throw new NotFoundError('Payroll record not found');

  const prevStatus = payroll.status;

  if (data.basicSalary !== undefined) payroll.basicSalary = data.basicSalary;
  if (data.hra !== undefined) payroll.hra = data.hra;
  if (data.allowances !== undefined) payroll.allowances = data.allowances;
  if (data.deductions !== undefined) payroll.deductions = data.deductions;
  if (data.notes !== undefined) payroll.notes = data.notes;

  // Recompute gross and net
  const { grossSalary, netSalary } = computeSalaryTotals(
    payroll.basicSalary,
    payroll.hra,
    payroll.allowances,
    payroll.deductions
  );
  payroll.grossSalary = grossSalary;
  payroll.netSalary = netSalary;

  if (data.status) {
    payroll.status = data.status;
    if (data.status === PayrollStatus.PAID && !payroll.paidAt) {
      payroll.paidAt = new Date();
    }
  }

  await payroll.save();

  await logAudit({
    userId: updater.id,
    action: 'PAYROLL_UPDATED',
    entity: 'Payroll',
    entityId: payroll._id.toString(),
    details: { grossSalary, netSalary, status: payroll.status },
    req,
  });

  // If transitioned from DRAFT to PROCESSED/PAID, notify employee
  if (
    prevStatus === PayrollStatus.DRAFT &&
    (payroll.status === PayrollStatus.PROCESSED || payroll.status === PayrollStatus.PAID)
  ) {
    await sendPayslipNotification(payroll.employeeId.toString(), payroll.month, payroll.year);
  }

  return payroll;
}

export async function getPayrollRecord(
  user: AuthenticatedUser,
  id: string
): Promise<IPayrollDocument> {
  // MANAGER has NO payroll access
  if (user.role === UserRole.MANAGER) {
    throw new ForbiddenError('Managers do not have access to payroll records');
  }

  const payroll = await Payroll.findById(id)
    .populate('employeeId', 'firstName lastName employeeCode email departmentId position joiningDate')
    .lean();

  if (!payroll) throw new NotFoundError('Payroll record not found');

  // EMPLOYEE can only view their own payslip
  if (user.role === UserRole.EMPLOYEE) {
    const empRaw = payroll.employeeId as any;
    const empId = empRaw?._id ? empRaw._id.toString() : String(empRaw);

    if (empId !== user.employeeId) {
      throw new ForbiddenError('You can only access your own payslip records');
    }
  }

  return payroll as unknown as IPayrollDocument;
}

export async function listPayrollRecords(
  user: AuthenticatedUser,
  query: {
    employeeId?: string;
    month?: number;
    year?: number;
    status?: PayrollStatus;
    page?: number;
    limit?: number;
  }
) {
  // MANAGER has NO payroll access
  if (user.role === UserRole.MANAGER) {
    throw new ForbiddenError('Managers do not have access to payroll records');
  }

  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(query.limit) || 20));
  const skip = (page - 1) * limit;

  const filter: Record<string, any> = {};

  if (user.role === UserRole.EMPLOYEE) {
    if (!user.employeeId) return { data: [], meta: { page: 1, limit, total: 0, totalPages: 0 } };
    filter.employeeId = new mongoose.Types.ObjectId(user.employeeId);
    // Employee only sees finalized/processed/paid payslips, not internal drafts
    filter.status = { $in: [PayrollStatus.PROCESSED, PayrollStatus.PAID] };
  } else {
    // HR and Admin can filter by specific employee
    if (query.employeeId) {
      filter.employeeId = new mongoose.Types.ObjectId(query.employeeId);
    }
    if (query.status) {
      filter.status = query.status;
    }
  }

  if (query.month) filter.month = Number(query.month);
  if (query.year) filter.year = Number(query.year);

  const [records, total] = await Promise.all([
    Payroll.find(filter)
      .populate('employeeId', 'firstName lastName employeeCode email departmentId position')
      .sort({ year: -1, month: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Payroll.countDocuments(filter),
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

export async function getPayrollMetrics(user: AuthenticatedUser) {
  if (user.role !== UserRole.ADMIN && user.role !== UserRole.HR) {
    throw new ForbiddenError('Only HR and Administrators can access payroll dashboard metrics');
  }

  const currentYear = new Date().getFullYear();

  const [allRecords, currentYearRecords] = await Promise.all([
    Payroll.find().lean(),
    Payroll.find({ year: currentYear }).populate('employeeId', 'departmentId').lean(),
  ]);

  const totalSpend = allRecords
    .filter((r) => r.status === PayrollStatus.PAID)
    .reduce((sum, r) => sum + r.netSalary, 0);

  const totalGross = allRecords.reduce((sum, r) => sum + r.grossSalary, 0);
  const draftCount = allRecords.filter((r) => r.status === PayrollStatus.DRAFT).length;
  const processedCount = allRecords.filter((r) => r.status === PayrollStatus.PROCESSED).length;
  const paidCount = allRecords.filter((r) => r.status === PayrollStatus.PAID).length;

  return {
    totalSpend: Math.round(totalSpend * 100) / 100,
    totalGross: Math.round(totalGross * 100) / 100,
    draftCount,
    processedCount,
    paidCount,
    totalRecords: allRecords.length,
    currentYear,
  };
}

async function sendPayslipNotification(employeeId: string, month: number, year: number) {
  const user = await User.findOne({ employeeId: new mongoose.Types.ObjectId(employeeId) });
  if (user) {
    const monthName = MONTH_NAMES[month - 1] || `Month ${month}`;
    await createAndSendNotification({
      userId: user._id,
      title: 'Payslip Available',
      message: `Your payslip for ${monthName} ${year} is ready to view.`,
      type: 'INFO',
      link: '/payroll',
    });
  }
}
