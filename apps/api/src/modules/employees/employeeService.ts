import { Employee, IEmployeeDocument } from '../../models/Employee.js';
import { User } from '../../models/User.js';
import { Department } from '../../models/Department.js';
import {
  NotFoundError,
  ConflictError,
  ForbiddenError,
  ValidationError,
} from '../../utils/errors.js';
import { logAudit } from '../../services/auditService.js';
import { canAccessEmployee, getEmployeeScopeFilter } from '../../middleware/scoping.js';
import { AuthenticatedUser } from '../../middleware/auth.js';
import { UserRole, EmployeeStatus, UserStatus } from '@hrx/shared';
import { Request } from 'express';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';

// Allowed fields for sorting to prevent query injection / unexpected behavior
const ALLOWED_SORT_FIELDS = [
  'createdAt',
  'firstName',
  'lastName',
  'employeeCode',
  'position',
  'joiningDate',
  'status',
];

// Generate next sequential employee code
export async function generateNextEmployeeCode(): Promise<string> {
  const latest = await Employee.findOne({ employeeCode: /^EMP-\d+$/ })
    .sort({ employeeCode: -1 })
    .lean();

  if (!latest) {
    return 'EMP-001';
  }

  const match = latest.employeeCode.match(/EMP-(\d+)/);
  if (!match) return 'EMP-001';

  const nextNum = parseInt(match[1], 10) + 1;
  return `EMP-${String(nextNum).padStart(3, '0')}`;
}

export async function listEmployees(
  user: AuthenticatedUser,
  query: {
    page?: number;
    limit?: number;
    search?: string;
    departmentId?: string;
    status?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }
) {
  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(query.limit) || 10));
  const skip = (page - 1) * limit;

  // Validate sort field against allowlist
  const sortBy = query.sortBy || 'createdAt';
  if (!ALLOWED_SORT_FIELDS.includes(sortBy)) {
    throw new ValidationError(`Invalid sort field '${sortBy}'. Allowed fields: [${ALLOWED_SORT_FIELDS.join(', ')}]`);
  }
  const sortDirection = query.sortOrder === 'asc' ? 1 : -1;

  // 1. Scoping filter based on user role
  const scopeFilter = await getEmployeeScopeFilter(user);

  // 2. Query filters
  const filter: Record<string, any> = { ...scopeFilter };

  if (query.departmentId) {
    filter.departmentId = new mongoose.Types.ObjectId(query.departmentId);
  }

  if (query.status) {
    filter.status = query.status;
  }

  if (query.search) {
    const s = query.search.trim();
    filter.$or = [
      { firstName: { $regex: s, $options: 'i' } },
      { lastName: { $regex: s, $options: 'i' } },
      { email: { $regex: s, $options: 'i' } },
      { employeeCode: { $regex: s, $options: 'i' } },
      { position: { $regex: s, $options: 'i' } },
    ];
  }

  const [employees, total] = await Promise.all([
    Employee.find(filter)
      .populate('departmentId', 'name code')
      .populate('managerId', 'firstName lastName email employeeCode')
      .sort({ [sortBy]: sortDirection })
      .skip(skip)
      .limit(limit)
      .lean(),
    Employee.countDocuments(filter),
  ]);

  return {
    data: employees,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function getEmployeeById(
  id: string,
  user: AuthenticatedUser
): Promise<any> {
  const hasAccess = await canAccessEmployee(user, id);
  if (!hasAccess) {
    throw new ForbiddenError('You do not have permission to view this employee profile');
  }

  const employee = await Employee.findById(id)
    .populate('departmentId', 'name code')
    .populate('managerId', 'firstName lastName email employeeCode')
    .populate('userId', 'email role status lastLoginAt')
    .lean();

  if (!employee) {
    throw new NotFoundError('Employee not found');
  }

  return employee;
}

export async function createEmployee(
  data: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    departmentId?: string;
    position: string;
    managerId?: string;
    joiningDate?: string;
    status?: EmployeeStatus;
    avatarUrl?: string;
    salary?: { basic: number; hra: number; allowances: number; deductions: number };
    createLoginAccount?: boolean;
    role?: UserRole;
  },
  actingUser: AuthenticatedUser,
  req?: Request
): Promise<IEmployeeDocument> {
  const email = data.email.toLowerCase().trim();

  // Check unique email in Employee collection
  const existingEmp = await Employee.findOne({ email });
  if (existingEmp) {
    throw new ConflictError('An employee with this email already exists');
  }

  // Check unique email in User collection
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new ConflictError('A user account with this email already exists');
  }

  // Validate department if supplied
  if (data.departmentId) {
    const dept = await Department.findById(data.departmentId);
    if (!dept) throw new NotFoundError('Specified department does not exist');
  }

  // Generate employeeCode
  const employeeCode = await generateNextEmployeeCode();

  const employee = await Employee.create({
    employeeCode,
    firstName: data.firstName.trim(),
    lastName: data.lastName.trim(),
    email,
    phone: data.phone?.trim(),
    departmentId: data.departmentId ? new mongoose.Types.ObjectId(data.departmentId) : undefined,
    position: data.position.trim(),
    managerId: data.managerId ? new mongoose.Types.ObjectId(data.managerId) : undefined,
    joiningDate: data.joiningDate || new Date().toISOString().split('T')[0],
    status: data.status || EmployeeStatus.ACTIVE,
    avatarUrl: data.avatarUrl,
    salary: data.salary || { basic: 0, hra: 0, allowances: 0, deductions: 0 },
  });

  // Automatically create user login account if requested or default for new staff
  if (data.createLoginAccount !== false) {
    const defaultPassword = 'Password123!';
    const passwordHash = await bcrypt.hash(defaultPassword, 10);
    const assignedRole = data.role || UserRole.EMPLOYEE;

    const newUser = await User.create({
      email,
      passwordHash,
      role: assignedRole,
      status: UserStatus.ACTIVE,
      employeeId: employee._id,
      mustChangePassword: true,
    });

    employee.userId = newUser._id;
    await employee.save();
  }

  await logAudit({
    userId: actingUser.id,
    action: 'EMPLOYEE_CREATED',
    entity: 'Employee',
    entityId: employee._id.toString(),
    details: { employeeCode, email, position: employee.position },
    req,
  });

  return employee;
}

export async function updateEmployee(
  id: string,
  updates: Record<string, any>,
  actingUser: AuthenticatedUser,
  req?: Request
): Promise<IEmployeeDocument> {
  const employee = await Employee.findById(id);
  if (!employee) throw new NotFoundError('Employee not found');

  // Check if target employee belongs to an ADMIN user
  const targetUser = employee.userId
    ? await User.findById(employee.userId)
    : await User.findOne({ employeeId: employee._id });

  if (targetUser?.role === UserRole.ADMIN && actingUser.role === UserRole.HR) {
    throw new ForbiddenError('HR personnel are not permitted to modify an ADMIN account');
  }

  // SELF-SERVICE EDIT RULE:
  // If user is regular employee, only allow self-service contact fields!
  if (actingUser.role === UserRole.EMPLOYEE) {
    if (actingUser.employeeId !== id) {
      throw new ForbiddenError('You can only update your own employee profile');
    }

    const ALLOWED_SELF_FIELDS = ['phone', 'emergencyContact', 'avatarUrl'];
    const attemptedKeys = Object.keys(updates);
    const hasForbiddenField = attemptedKeys.some((k) => !ALLOWED_SELF_FIELDS.includes(k));

    if (hasForbiddenField) {
      throw new ForbiddenError(
        `Employees can only update: [${ALLOWED_SELF_FIELDS.join(', ')}]. Contact HR for organizational changes.`
      );
    }
  }

  // If email is changing, verify uniqueness
  if (updates.email && updates.email.toLowerCase().trim() !== employee.email) {
    const newEmail = updates.email.toLowerCase().trim();
    const existing = await Employee.findOne({ _id: { $ne: employee._id }, email: newEmail });
    if (existing) throw new ConflictError('Email already in use by another employee');
    employee.email = newEmail;
    if (employee.userId) {
      await User.findByIdAndUpdate(employee.userId, { email: newEmail });
    }
  }

  if (updates.firstName) employee.firstName = updates.firstName.trim();
  if (updates.lastName) employee.lastName = updates.lastName.trim();
  if (updates.phone !== undefined) employee.phone = updates.phone;
  if (updates.avatarUrl !== undefined) employee.avatarUrl = updates.avatarUrl;
  if (updates.emergencyContact) employee.emergencyContact = updates.emergencyContact;

  // Management-only fields
  if (actingUser.role === UserRole.ADMIN || actingUser.role === UserRole.HR) {
    if (updates.departmentId !== undefined) {
      employee.departmentId = updates.departmentId
        ? new mongoose.Types.ObjectId(updates.departmentId)
        : undefined;
    }
    if (updates.position) employee.position = updates.position.trim();
    if (updates.managerId !== undefined) {
      employee.managerId = updates.managerId
        ? new mongoose.Types.ObjectId(updates.managerId)
        : undefined;
    }
    if (updates.joiningDate) employee.joiningDate = updates.joiningDate;
    if (updates.status) employee.status = updates.status;
    if (updates.salary) employee.salary = updates.salary;
  }

  await employee.save();

  await logAudit({
    userId: actingUser.id,
    action: 'EMPLOYEE_UPDATED',
    entity: 'Employee',
    entityId: employee._id.toString(),
    details: updates,
    req,
  });

  return employee;
}

export async function deleteOrDeactivateEmployee(
  id: string,
  actingUser: AuthenticatedUser,
  req?: Request
): Promise<void> {
  const employee = await Employee.findById(id);
  if (!employee) throw new NotFoundError('Employee not found');

  const targetUser = employee.userId
    ? await User.findById(employee.userId)
    : await User.findOne({ employeeId: employee._id });

  if (targetUser?.role === UserRole.ADMIN && actingUser.role === UserRole.HR) {
    throw new ForbiddenError('HR personnel cannot deactivate an ADMIN account');
  }

  if (targetUser) {
    // Deactivate user account
    targetUser.status = UserStatus.INACTIVE;
    await targetUser.save();
  }

  // Soft deactivate employee
  employee.status = EmployeeStatus.TERMINATED;
  await employee.save();

  await logAudit({
    userId: actingUser.id,
    action: 'EMPLOYEE_DEACTIVATED',
    entity: 'Employee',
    entityId: employee._id.toString(),
    details: { employeeCode: employee.employeeCode, email: employee.email },
    req,
  });
}
