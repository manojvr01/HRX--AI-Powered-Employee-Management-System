import { z } from 'zod';
import {
  UserRole,
  UserStatus,
  EmployeeStatus,
  AttendanceStatus,
  LeaveRequestStatus,
  PayrollStatus,
  PerformanceReviewStatus,
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

// Payroll Schemas
export const createPayrollSchema = z.object({
  employeeId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid employee ID'),
  month: z.number().int().min(1).max(12),
  year: z.number().int().min(2000).max(2100),
  basicSalary: z.number().nonnegative(),
  hra: z.number().nonnegative().default(0),
  allowances: z.number().nonnegative().default(0),
  deductions: z.number().nonnegative().default(0),
  status: z.nativeEnum(PayrollStatus).default(PayrollStatus.DRAFT),
  notes: z.string().max(500).optional(),
});

export const updatePayrollSchema = z.object({
  basicSalary: z.number().nonnegative().optional(),
  hra: z.number().nonnegative().optional(),
  allowances: z.number().nonnegative().optional(),
  deductions: z.number().nonnegative().optional(),
  status: z.nativeEnum(PayrollStatus).optional(),
  notes: z.string().max(500).optional(),
});

// Document Metadata Schema
export const createDocumentMetadataSchema = z.object({
  employeeId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid employee ID'),
  title: z.string().min(2).max(100),
  category: z.nativeEnum(DocumentCategory),
  isConfidential: z.boolean().default(false),
});

// Phase 5: Performance Review Schemas
export const createPerformanceReviewSchema = z.object({
  employeeId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid employee ID'),
  reviewPeriod: z.string().min(2).max(50), // e.g. "Q1 2026" or "Annual 2026"
  ratings: z.array(
    z.object({
      category: z.string().min(1).max(100),
      score: z.number().min(1).max(5),
      comments: z.string().max(500).optional(),
    })
  ).min(1, 'At least one rating category is required'),
  overallRating: z.number().min(1).max(5),
  strengths: z.string().max(2000).optional(),
  areasForImprovement: z.string().max(2000).optional(),
  goals: z.string().max(2000).optional(),
  aiSummary: z.string().max(3000).optional(),
  status: z.nativeEnum(PerformanceReviewStatus).default(PerformanceReviewStatus.DRAFT),
});

export const updatePerformanceReviewSchema = z.object({
  reviewPeriod: z.string().min(2).max(50).optional(),
  ratings: z.array(
    z.object({
      category: z.string().min(1).max(100),
      score: z.number().min(1).max(5),
      comments: z.string().max(500).optional(),
    })
  ).optional(),
  overallRating: z.number().min(1).max(5).optional(),
  strengths: z.string().max(2000).optional(),
  areasForImprovement: z.string().max(2000).optional(),
  goals: z.string().max(2000).optional(),
  aiSummary: z.string().max(3000).optional(),
  status: z.nativeEnum(PerformanceReviewStatus).optional(),
});

export const aiSummarizeReviewSchema = z.object({
  employeeName: z.string().min(1),
  position: z.string().min(1),
  reviewPeriod: z.string().min(1),
  overallRating: z.number().min(1).max(5),
  strengths: z.string().optional(),
  areasForImprovement: z.string().optional(),
  goals: z.string().optional(),
  ratings: z.array(
    z.object({
      category: z.string(),
      score: z.number(),
    })
  ).optional(),
});

// Phase 5: Policy & AI Assistant Schemas
export const createPolicySchema = z.object({
  title: z.string().min(3).max(150),
  category: z.string().min(2).max(50),
  content: z.string().min(10).max(10000),
  version: z.string().default('1.0'),
  isActive: z.boolean().default(true),
});

export const askAiAssistantSchema = z.object({
  question: z.string().min(2).max(1000),
  history: z.array(
    z.object({
      role: z.enum(['user', 'assistant']),
      content: z.string(),
    })
  ).max(20).optional().default([]),
});

// Phase 6: Announcements & Reports Schemas
export const createAnnouncementSchema = z.object({
  title: z.string().min(2).max(150),
  content: z.string().min(5).max(3000),
  priority: z.enum(['LOW', 'NORMAL', 'HIGH']).default('NORMAL'),
  targetRole: z.enum(['ALL', 'ADMIN', 'HR', 'MANAGER', 'EMPLOYEE']).default('ALL'),
});

export const exportReportSchema = z.object({
  type: z.enum(['employees', 'attendance', 'payroll', 'leaves']),
  format: z.enum(['csv', 'json']).default('csv'),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  departmentId: z.string().regex(/^[0-9a-fA-F]{24}$/).optional(),
});
