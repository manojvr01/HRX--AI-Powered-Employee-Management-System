import mongoose from 'mongoose';
import { Employee } from '../../models/Employee.js';
import { Attendance } from '../../models/Attendance.js';
import { LeaveRequest } from '../../models/LeaveRequest.js';
import { Payroll } from '../../models/Payroll.js';
import { PerformanceReview } from '../../models/PerformanceReview.js';
import { UserRole } from '@hrx/shared';
import { AuthenticatedUser } from '../../middleware/auth.js';

export class AnalyticsService {
  async getOverviewMetrics(currentUser: AuthenticatedUser): Promise<Record<string, unknown>> {
    // Determine employee scope filter
    let employeeScopeFilter: Record<string, unknown> = {};
    if (currentUser.role === UserRole.EMPLOYEE && currentUser.employeeId) {
      employeeScopeFilter = { _id: new mongoose.Types.ObjectId(currentUser.employeeId) };
    } else if (currentUser.role === UserRole.MANAGER && currentUser.employeeId) {
      const directReports = await Employee.find({ managerId: currentUser.employeeId }).select('_id');
      const ids = [...directReports.map((d: { _id: mongoose.Types.ObjectId }) => d._id), new mongoose.Types.ObjectId(currentUser.employeeId)];
      employeeScopeFilter = { _id: { $in: ids } };
    }

    // 1. Headcount & Department Distribution
    const employees = await Employee.find(employeeScopeFilter).populate('departmentId', 'name code');
    const totalEmployees = employees.length;

    const deptCounts: Record<string, number> = {};
    employees.forEach((emp) => {
      const deptName = (emp.departmentId as unknown as { name?: string })?.name || 'Unassigned';
      deptCounts[deptName] = (deptCounts[deptName] || 0) + 1;
    });

    const departmentDistribution = Object.entries(deptCounts).map(([department, count]) => ({
      department,
      count,
    }));

    // 2. Attendance rate (Last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().split('T')[0];

    const scopedEmpIds = employees.map((e) => e._id);
    const attendanceRecords = await Attendance.find({
      employeeId: { $in: scopedEmpIds },
      date: { $gte: thirtyDaysAgoStr },
    });

    const presentCount = attendanceRecords.filter((a) => a.status === 'PRESENT' || a.status === 'LATE').length;
    const totalExpected = Math.max(1, scopedEmpIds.length * 22);
    const attendanceRate = Math.min(100, Math.round((presentCount / totalExpected) * 100));

    // 3. Leave trends
    const leaveRequests = await LeaveRequest.find({
      employeeId: { $in: scopedEmpIds },
    });

    const leaveStatusCounts = {
      APPROVED: leaveRequests.filter((l) => l.status === 'APPROVED').length,
      PENDING: leaveRequests.filter((l) => l.status === 'PENDING').length,
      REJECTED: leaveRequests.filter((l) => l.status === 'REJECTED').length,
    };

    // 4. Payroll summary
    const payrollRecords = await Payroll.find({
      employeeId: { $in: scopedEmpIds },
    });

    const totalGross = payrollRecords.reduce((acc, p) => acc + (p.grossSalary || 0), 0);
    const totalNet = payrollRecords.reduce((acc, p) => acc + (p.netSalary || 0), 0);
    const totalDeductions = payrollRecords.reduce((acc, p) => acc + (p.deductions || 0), 0);

    // 5. Performance Rating Distribution
    const performanceReviews = await PerformanceReview.find({
      employeeId: { $in: scopedEmpIds },
      ...(currentUser.role === UserRole.EMPLOYEE ? { status: 'FINALIZED' } : {}),
    });

    const ratingDistribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    performanceReviews.forEach((rev) => {
      const rounded = Math.min(5, Math.max(1, Math.round(rev.overallRating || 3)));
      ratingDistribution[rounded] = (ratingDistribution[rounded] || 0) + 1;
    });

    return {
      headcount: {
        total: totalEmployees,
        active: employees.filter((e) => e.status === 'ACTIVE').length,
      },
      departmentDistribution,
      attendance: {
        ratePercentage: attendanceRate,
        recordsInLast30Days: attendanceRecords.length,
      },
      leaves: leaveStatusCounts,
      payroll: {
        totalGross,
        totalNet,
        totalDeductions,
        processedCount: payrollRecords.length,
      },
      performance: {
        totalReviews: performanceReviews.length,
        ratingDistribution: Object.entries(ratingDistribution).map(([stars, count]) => ({
          stars: Number(stars),
          count,
        })),
      },
    };
  }
}

export const analyticsService = new AnalyticsService();
