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
import { Permission } from '../constants/permissions.js';

// API Envelope types
export interface ApiResponse<T = unknown> {
  success: true;
  data: T;
  message?: string;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  };
}

export interface ApiErrorDetail {
  field?: string;
  message: string;
  code?: string;
}

export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: ApiErrorDetail[];
  };
}

// User & Auth
export interface IUser {
  _id: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  employeeId?: string;
  mustChangePassword?: boolean;
  failedLoginAttempts: number;
  lockoutUntil?: string | null;
  lastLoginAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface IEmployee {
  _id: string;
  userId?: string;
  employeeCode: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  departmentId?: string;
  position: string;
  managerId?: string;
  joiningDate: string;
  status: EmployeeStatus;
  avatarUrl?: string;
  emergencyContact?: {
    name: string;
    relationship: string;
    phone: string;
  };
  salary?: {
    basic: number;
    hra: number;
    allowances: number;
    deductions: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface IDepartment {
  _id: string;
  name: string;
  code: string;
  description?: string;
  headId?: string;
  isActive: boolean;
  employeeCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface IAttendance {
  _id: string;
  employeeId: string;
  date: string; // YYYY-MM-DD
  checkInTime: string;
  checkOutTime?: string | null;
  durationMinutes?: number;
  status: AttendanceStatus;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ILeaveType {
  _id: string;
  name: string;
  code: string;
  daysAllowedPerYear: number;
  isPaid: boolean;
  requiresApproval: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ILeaveRequest {
  _id: string;
  employeeId: string;
  leaveTypeId: string;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  daysCount: number;
  reason: string;
  status: LeaveRequestStatus;
  approverId?: string;
  rejectionReason?: string;
  appliedAt: string;
  actionedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ILeaveBalance {
  _id: string;
  employeeId: string;
  leaveTypeId: string;
  year: number;
  allocatedDays: number;
  usedDays: number;
  pendingDays: number;
  remainingDays: number;
  createdAt: string;
  updatedAt: string;
}

export interface IPayroll {
  _id: string;
  employeeId: string;
  month: number; // 1-12
  year: number;
  basicSalary: number;
  hra: number;
  allowances: number;
  deductions: number;
  grossSalary: number;
  netSalary: number;
  status: PayrollStatus;
  paidAt?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface IDocument {
  _id: string;
  employeeId: string;
  title: string;
  category: DocumentCategory;
  fileUrl: string;
  filePublicId?: string;
  mimeType: string;
  fileSize: number;
  uploaderId: string;
  isConfidential: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface IPerformanceReview {
  _id: string;
  employeeId: string;
  reviewerId: string;
  reviewPeriod: string; // e.g. "Q1 2026"
  ratings: {
    category: string;
    score: number; // 1-5
    comments?: string;
  }[];
  overallRating: number;
  strengths?: string;
  areasForImprovement?: string;
  goals?: string;
  aiSummary?: string;
  status: PerformanceReviewStatus;
  createdAt: string;
  updatedAt: string;
}

export interface INotification {
  _id: string;
  userId: string;
  title: string;
  message: string;
  type: 'INFO' | 'SUCCESS' | 'WARNING' | 'ALERT';
  isRead: boolean;
  link?: string;
  createdAt: string;
}

export interface IAuditLog {
  _id: string;
  userId?: string;
  action: string;
  entity: string;
  entityId?: string;
  details?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
}

export interface IOrgSettings {
  _id?: string;
  companyName: string;
  timezone: string;
  lateThresholdMinutes: number;
  workWeekDays: number[]; // 0=Sun, 1=Mon, ..., 6=Sat
  workDayStartHour: number; // e.g. 9
  workDayEndHour: number; // e.g. 18
  currency: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface IRefreshSession {
  _id: string;
  userId: string;
  tokenHash: string;
  family: string;
  isRevoked: boolean;
  expiresAt: string;
  userAgent?: string;
  ipAddress?: string;
  createdAt: string;
}

// Auth DTOs
export interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  mustChangePassword: boolean;
  permissions: Permission[];
  employee?: {
    id: string;
    employeeCode: string;
    firstName: string;
    lastName: string;
    position: string;
    departmentId?: string;
    avatarUrl?: string;
  } | null;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken?: string;
  expiresIn: number; // seconds
}

export interface LoginResponseData {
  user: AuthUser;
  tokens: AuthTokens;
}
