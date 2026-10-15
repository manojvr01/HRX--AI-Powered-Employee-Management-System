import { Request, Response, NextFunction } from 'express';
import { Employee } from '../../models/Employee.js';
import { Department } from '../../models/Department.js';
import { LeaveBalance } from '../../models/LeaveBalance.js';
import { LeaveRequest } from '../../models/LeaveRequest.js';
import { UserRole, EmployeeStatus, LeaveRequestStatus } from '@hrx/shared';
import { UnauthorizedError } from '../../utils/errors.js';
import mongoose from 'mongoose';

export async function getDashboardMetrics(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const user = req.user;
    if (!user) throw new UnauthorizedError();

    const currentYear = new Date().getFullYear();

    // 1. ADMIN & HR Metrics
    if (user.role === UserRole.ADMIN || user.role === UserRole.HR) {
      const [totalEmployees, activeEmployees, totalDepartments, pendingLeaves, recentEmployees, deptDistribution] =
        await Promise.all([
          Employee.countDocuments({ status: { $ne: EmployeeStatus.TERMINATED } }),
          Employee.countDocuments({ status: EmployeeStatus.ACTIVE }),
          Department.countDocuments({ isActive: true }),
          LeaveRequest.countDocuments({ status: LeaveRequestStatus.PENDING }),
          Employee.find({ status: { $ne: EmployeeStatus.TERMINATED } })
            .populate('departmentId', 'name code')
            .sort({ createdAt: -1 })
            .limit(5)
            .lean(),
          Employee.aggregate([
            { $match: { status: { $ne: EmployeeStatus.TERMINATED } } },
            {
              $group: {
                _id: '$departmentId',
                count: { $sum: 1 },
              },
            },
            {
              $lookup: {
                from: 'departments',
                localField: '_id',
                foreignField: '_id',
                as: 'dept',
              },
            },
            { $unwind: { path: '$dept', preserveNullAndEmptyArrays: true } },
            {
              $project: {
                departmentName: { $ifNull: ['$dept.name', 'Unassigned'] },
                count: 1,
              },
            },
          ]),
        ]);

      res.status(200).json({
        success: true,
        data: {
          role: user.role,
          metrics: {
            totalEmployees,
            activeEmployees,
            totalDepartments,
            pendingLeaves,
            recentEmployees,
            departmentDistribution: deptDistribution.map((d) => ({
              name: d.departmentName,
              count: d.count,
            })),
          },
        },
      });
      return;
    }

    // 2. MANAGER Metrics
    if (user.role === UserRole.MANAGER) {
      const managerEmpId = user.employeeId
        ? new mongoose.Types.ObjectId(user.employeeId)
        : null;

      const directReports = managerEmpId
        ? await Employee.find({
            managerId: managerEmpId,
            status: { $ne: EmployeeStatus.TERMINATED },
          })
            .populate('departmentId', 'name code')
            .lean()
        : [];

      const managerProfile = managerEmpId
        ? await Employee.findById(managerEmpId).populate('departmentId', 'name code').lean()
        : null;

      const pendingLeaves = directReports.length > 0
        ? await LeaveRequest.countDocuments({
            employeeId: { $in: directReports.map((d) => d._id) },
            status: LeaveRequestStatus.PENDING,
          })
        : 0;

      res.status(200).json({
        success: true,
        data: {
          role: user.role,
          metrics: {
            teamSize: directReports.length,
            department: (managerProfile?.departmentId as any)?.name || 'General',
            pendingLeaves,
            directReports,
            profile: managerProfile,
          },
        },
      });
      return;
    }

    // 3. EMPLOYEE Metrics
    const empId = user.employeeId
      ? new mongoose.Types.ObjectId(user.employeeId)
      : null;

    const [profile, balances] = await Promise.all([
      empId
        ? Employee.findById(empId)
            .populate('departmentId', 'name code')
            .populate('managerId', 'firstName lastName email')
            .lean()
        : null,
      empId
        ? LeaveBalance.find({ employeeId: empId, year: currentYear })
            .populate('leaveTypeId', 'name code isPaid')
            .lean()
        : [],
    ]);

    res.status(200).json({
      success: true,
      data: {
        role: user.role,
        metrics: {
          profile,
          leaveBalances: balances.map((b: any) => ({
            name: b.leaveTypeId?.name || 'Leave',
            allocated: b.allocatedDays,
            used: b.usedDays,
            remaining: b.remainingDays,
          })),
        },
      },
    });
  } catch (err) {
    next(err);
  }
}
