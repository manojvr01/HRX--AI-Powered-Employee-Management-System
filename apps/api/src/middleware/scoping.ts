import { AuthenticatedUser } from './auth.js';
import { UserRole } from '@hrx/shared';
import { Employee } from '../models/Employee.js';
import mongoose from 'mongoose';

/**
 * Verifies if the authenticated user has rights to view or act upon a specific employee record.
 */
export async function canAccessEmployee(
  user: AuthenticatedUser,
  targetEmployeeId: string
): Promise<boolean> {
  // ADMIN and HR have organization-wide access
  if (user.role === UserRole.ADMIN || user.role === UserRole.HR) {
    return true;
  }

  // EMPLOYEE can only access their own record
  if (user.role === UserRole.EMPLOYEE) {
    return user.employeeId === targetEmployeeId;
  }

  // MANAGER can access own record or direct reports
  if (user.role === UserRole.MANAGER) {
    if (user.employeeId === targetEmployeeId) {
      return true;
    }
    if (!user.employeeId) {
      return false;
    }
    const report = await Employee.findOne({
      _id: targetEmployeeId,
      managerId: new mongoose.Types.ObjectId(user.employeeId),
    });
    return !!report;
  }

  return false;
}

/**
 * Returns a Mongoose filter object to constrain employee lists based on user role.
 */
export async function getEmployeeScopeFilter(
  user: AuthenticatedUser
): Promise<Record<string, unknown>> {
  if (user.role === UserRole.ADMIN || user.role === UserRole.HR) {
    return {};
  }

  if (user.role === UserRole.EMPLOYEE) {
    return { _id: user.employeeId };
  }

  if (user.role === UserRole.MANAGER) {
    if (!user.employeeId) return { _id: null };
    const myReports = await Employee.find({
      managerId: new mongoose.Types.ObjectId(user.employeeId),
    }).select('_id');
    const ids = myReports.map((r) => r._id);
    ids.push(new mongoose.Types.ObjectId(user.employeeId));
    return { _id: { $in: ids } };
  }

  return { _id: null };
}
