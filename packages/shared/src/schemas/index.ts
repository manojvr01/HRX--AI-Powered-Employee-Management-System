import { z } from 'zod';
import {
  UserRole,
  UserStatus,
  EmployeeStatus,
  AttendanceStatus,
  LeaveRequestStatus,
  DocumentCategory,
} from '../constants/roles.js';

// Auth Schemas
export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email({ message: 'Valid email address is required' }),
  password: z
    .string()
    .min(6, { message: 'Password must be at least 6 characters long' }),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z
      .string()
      .min(8, 'New password must be at least 8 characters')
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        'Password must contain at least one uppercase letter, one lowercase letter, and one number'
      ),
    confirmPassword: z.string().min(1, 'Password confirmation is required'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;

export const refreshTokenSchema = z.object({
  refreshToken: z.string().optional(),
});

// Organization Settings Schema
export const updateOrgSettingsSchema = z.object({
  companyName: z.string().min(2).max(100).optional(),
  timezone: z.string().min(2).optional(),
  lateThresholdMinutes: z.number().int().min(0).max(180).optional(),
  workWeekDays: z.array(z.number().int().min(0).max(6)).min(1).optional(),
  workDayStartHour: z.number().int().min(0).max(23).optional(),
  workDayEndHour: z.number().int().min(0).max(23).optional(),
  currency: z.string().length(3).optional(),
});

export type UpdateOrgSettingsInput = z.infer<typeof updateOrgSettingsSchema>;

// Department Schemas
export const createDepartmentSchema = z.object({
  name: z.string().trim().min(2, 'Department name must be at least 2 characters'),
  code: z.string().trim().min(2).max(10).toUpperCase(),
  description: z.string().trim().optional(),
  headId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid head employee ID').optional(),
});

export const updateDepartmentSchema = createDepartmentSchema.partial();

// Employee Schemas
export const createEmployeeSchema = z.object({
  firstName: z.string().trim().min(2, 'First name is required'),
  lastName: z.string().trim().min(2, 'Last name is required'),
  email: z.string().trim().toLowerCase().email('Valid email is required'),
  phone: z.string().trim().optional(),
  departmentId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid department ID').optional(),
  position: z.string().trim().min(2, 'Position is required'),
  managerId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid manager ID').optional(),
  joiningDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date format must be YYYY-MM-DD').optional(),
  status: z.nativeEnum(EmployeeStatus).default(EmployeeStatus.ACTIVE),
  avatarUrl: z.string().url().optional(),
  salary: z
    .object({
      basic: z.number().nonnegative(),
      hra: z.number().nonnegative().default(0),
      allowances: z.number().nonnegative().default(0),
      deductions: z.number().nonnegative().default(0),
    })
    .optional(),
});

export const updateEmployeeSchema = createEmployeeSchema.partial();

// Attendance Schemas
export const checkInSchema = z.object({
  notes: z.string().max(250).optional(),
});

export const checkOutSchema = z.object({
  notes: z.string().max(250).optional(),
});

// Leave Schemas
export const applyLeaveSchema = z.object({
  leaveTypeId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid leave type ID'),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Start date must be YYYY-MM-DD'),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'End date must be YYYY-MM-DD'),
  reason: z.string().min(5, 'Reason must be at least 5 characters').max(500),
});

export const reviewLeaveSchema = z.object({
  status: z.enum([LeaveRequestStatus.APPROVED, LeaveRequestStatus.REJECTED]),
  rejectionReason: z.string().max(500).optional(),
});

// Pagination & Query Filter Schemas
export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  search: z.string().trim().optional(),
  sortBy: z.string().trim().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export type PaginationQuery = z.infer<typeof paginationQuerySchema>;
