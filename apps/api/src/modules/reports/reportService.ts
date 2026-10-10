import mongoose from 'mongoose';
import { Employee } from '../../models/Employee.js';
import { Attendance } from '../../models/Attendance.js';
import { LeaveRequest } from '../../models/LeaveRequest.js';
import { Payroll } from '../../models/Payroll.js';
import { UserRole } from '@hrx/shared';
import { AuthenticatedUser } from '../../middleware/auth.js';
import { logAudit } from '../../services/auditService.js';
import { ValidationError } from '../../utils/errors.js';
import { Request } from 'express';

function escapeCsvField(val: unknown): string {
  if (val === null || val === undefined) return '';
  const str = String(val);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export class ReportService {
  async exportReport(
    params: {
      type: 'employees' | 'attendance' | 'payroll' | 'leaves';
      startDate?: string;
      endDate?: string;
      departmentId?: string;
    },
    currentUser: AuthenticatedUser,
    req?: Request
  ): Promise<{ filename: string; csvContent: string; mimeType: string }> {
    let allowedEmployeeFilter: Record<string, unknown> = {};
    if (currentUser.role === UserRole.EMPLOYEE && currentUser.employeeId) {
      allowedEmployeeFilter = { _id: new mongoose.Types.ObjectId(currentUser.employeeId) };
    } else if (currentUser.role === UserRole.MANAGER && currentUser.employeeId) {
      const reports = await Employee.find({ managerId: currentUser.employeeId }).select('_id');
      const ids = [...reports.map((r: { _id: mongoose.Types.ObjectId }) => r._id), new mongoose.Types.ObjectId(currentUser.employeeId)];
      allowedEmployeeFilter = { _id: { $in: ids } };
    }

    if (params.departmentId && currentUser.role !== UserRole.EMPLOYEE) {
      allowedEmployeeFilter.departmentId = new mongoose.Types.ObjectId(params.departmentId);
    }

    const employees = await Employee.find(allowedEmployeeFilter);
    const empIds = employees.map((e) => e._id);
    const empMap = new Map(employees.map((e) => [e._id.toString(), e]));

    let headers: string[] = [];
    const rows: string[][] = [];
    const dateStamp = new Date().toISOString().split('T')[0];
    const filename = `hrx-${params.type}-report-${dateStamp}.csv`;

    switch (params.type) {
      case 'employees': {
        headers = ['Employee Code', 'First Name', 'Last Name', 'Email', 'Position', 'Status', 'Joining Date'];
        employees.forEach((emp) => {
          rows.push([
            emp.employeeCode,
            emp.firstName,
            emp.lastName,
            emp.email,
            emp.position,
            emp.status,
            emp.joiningDate ? new Date(emp.joiningDate).toISOString().split('T')[0] : '',
          ]);
        });
        break;
      }

      case 'attendance': {
        headers = ['Employee Code', 'Employee Name', 'Date', 'Check In', 'Check Out', 'Duration (Minutes)', 'Status'];
        const attFilter: Record<string, unknown> = { employeeId: { $in: empIds } };
        if (params.startDate && params.endDate) {
          attFilter.date = { $gte: params.startDate, $lte: params.endDate };
        }
        const records = await Attendance.find(attFilter).sort({ date: -1 });
        records.forEach((rec) => {
          const emp = empMap.get(rec.employeeId.toString());
          rows.push([
            emp?.employeeCode || '',
            emp ? `${emp.firstName} ${emp.lastName}` : '',
            rec.date,
            rec.checkInTime ? new Date(rec.checkInTime).toLocaleTimeString() : '',
            rec.checkOutTime ? new Date(rec.checkOutTime).toLocaleTimeString() : '',
            rec.durationMinutes !== undefined ? String(rec.durationMinutes) : '',
            rec.status,
          ]);
        });
        break;
      }

      case 'payroll': {
        headers = ['Employee Code', 'Employee Name', 'Month', 'Year', 'Basic', 'HRA', 'Allowances', 'Deductions', 'Gross', 'Net', 'Status'];
        const records = await Payroll.find({ employeeId: { $in: empIds } }).sort({ year: -1, month: -1 });
        records.forEach((rec) => {
          const emp = empMap.get(rec.employeeId.toString());
          rows.push([
            emp?.employeeCode || '',
            emp ? `${emp.firstName} ${emp.lastName}` : '',
            String(rec.month),
            String(rec.year),
            String(rec.basicSalary),
            String(rec.hra),
            String(rec.allowances),
            String(rec.deductions),
            String(rec.grossSalary),
            String(rec.netSalary),
            rec.status,
          ]);
        });
        break;
      }

      case 'leaves': {
        headers = ['Employee Code', 'Employee Name', 'Start Date', 'End Date', 'Days Count', 'Status', 'Reason'];
        const records = await LeaveRequest.find({ employeeId: { $in: empIds } }).sort({ appliedAt: -1 });
        records.forEach((rec) => {
          const emp = empMap.get(rec.employeeId.toString());
          rows.push([
            emp?.employeeCode || '',
            emp ? `${emp.firstName} ${emp.lastName}` : '',
            rec.startDate,
            rec.endDate,
            String(rec.daysCount),
            rec.status,
            rec.reason || '',
          ]);
        });
        break;
      }

      default:
        throw new ValidationError('Invalid report type specified');
    }

    const csvContent = [
      headers.map(escapeCsvField).join(','),
      ...rows.map((row) => row.map(escapeCsvField).join(',')),
    ].join('\r\n');

    await logAudit({
      userId: currentUser.id,
      action: 'REPORT_EXPORTED',
      entity: 'Report',
      details: {
        type: params.type,
        rowCount: rows.length,
        filter: params,
      },
      req,
    });

    return {
      filename,
      csvContent,
      mimeType: 'text/csv',
    };
  }
}

export const reportService = new ReportService();
