import { UserRole } from './roles.js';

export const Permission = {
  // Users
  USERS_READ: 'users:read',
  USERS_MANAGE: 'users:manage',

  // Employees
  EMPLOYEES_READ_SELF: 'employees:read_self',
  EMPLOYEES_READ: 'employees:read',
  EMPLOYEES_CREATE: 'employees:create',
  EMPLOYEES_EDIT: 'employees:edit',
  EMPLOYEES_DELETE: 'employees:delete',

  // Departments
  DEPARTMENTS_READ: 'departments:read',
  DEPARTMENTS_MANAGE: 'departments:manage',

  // Attendance
  ATTENDANCE_CHECKIN: 'attendance:checkin',
  ATTENDANCE_READ_SELF: 'attendance:read_self',
  ATTENDANCE_READ_TEAM: 'attendance:read_team',
  ATTENDANCE_READ_ALL: 'attendance:read_all',
  ATTENDANCE_MANAGE: 'attendance:manage',

  // Leave
  LEAVE_APPLY: 'leave:apply',
  LEAVE_READ_SELF: 'leave:read_self',
  LEAVE_READ_TEAM: 'leave:read_team',
  LEAVE_READ_ALL: 'leave:read_all',
  LEAVE_APPROVE: 'leave:approve',
  LEAVE_MANAGE_TYPES: 'leave:manage_types',

  // Payroll
  PAYROLL_READ_SELF: 'payroll:read_self',
  PAYROLL_READ_ALL: 'payroll:read_all',
  PAYROLL_MANAGE: 'payroll:manage',

  // Documents
  DOCUMENTS_READ_SELF: 'documents:read_self',
  DOCUMENTS_READ_ALL: 'documents:read_all',
  DOCUMENTS_MANAGE: 'documents:manage',

  // Performance
  PERFORMANCE_READ_SELF: 'performance:read_self',
  PERFORMANCE_READ_TEAM: 'performance:read_team',
  PERFORMANCE_READ_ALL: 'performance:read_all',
  PERFORMANCE_MANAGE: 'performance:manage',

  // Reports
  REPORTS_READ: 'reports:read',

  // Audit Logs
  AUDIT_READ: 'audit:read',

  // Organization Settings
  SETTINGS_READ: 'settings:read',
  SETTINGS_MANAGE: 'settings:manage',

  // AI Assistant
  AI_USE: 'ai:use',
} as const;

export type Permission = (typeof Permission)[keyof typeof Permission];

export const ALL_PERMISSIONS: Permission[] = Object.values(Permission);

export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  [UserRole.ADMIN]: [...ALL_PERMISSIONS],

  [UserRole.HR]: [
    Permission.USERS_READ,
    Permission.EMPLOYEES_READ_SELF,
    Permission.EMPLOYEES_READ,
    Permission.EMPLOYEES_CREATE,
    Permission.EMPLOYEES_EDIT,
    Permission.EMPLOYEES_DELETE,
    Permission.DEPARTMENTS_READ,
    Permission.DEPARTMENTS_MANAGE,
    Permission.ATTENDANCE_CHECKIN,
    Permission.ATTENDANCE_READ_SELF,
    Permission.ATTENDANCE_READ_ALL,
    Permission.ATTENDANCE_MANAGE,
    Permission.LEAVE_APPLY,
    Permission.LEAVE_READ_SELF,
    Permission.LEAVE_READ_ALL,
    Permission.LEAVE_APPROVE,
    Permission.LEAVE_MANAGE_TYPES,
    Permission.PAYROLL_READ_SELF,
    Permission.PAYROLL_READ_ALL,
    Permission.PAYROLL_MANAGE,
    Permission.DOCUMENTS_READ_SELF,
    Permission.DOCUMENTS_READ_ALL,
    Permission.DOCUMENTS_MANAGE,
    Permission.PERFORMANCE_READ_SELF,
    Permission.PERFORMANCE_READ_ALL,
    Permission.PERFORMANCE_MANAGE,
    Permission.REPORTS_READ,
    Permission.SETTINGS_READ,
    Permission.AI_USE,
  ],

  [UserRole.MANAGER]: [
    Permission.EMPLOYEES_READ_SELF,
    Permission.EMPLOYEES_READ,
    Permission.DEPARTMENTS_READ,
    Permission.ATTENDANCE_CHECKIN,
    Permission.ATTENDANCE_READ_SELF,
    Permission.ATTENDANCE_READ_TEAM,
    Permission.LEAVE_APPLY,
    Permission.LEAVE_READ_SELF,
    Permission.LEAVE_READ_TEAM,
    Permission.LEAVE_APPROVE,
    Permission.PAYROLL_READ_SELF,
    Permission.DOCUMENTS_READ_SELF,
    Permission.PERFORMANCE_READ_SELF,
    Permission.PERFORMANCE_READ_TEAM,
    Permission.PERFORMANCE_MANAGE,
    Permission.REPORTS_READ,
    Permission.AI_USE,
  ],

  [UserRole.EMPLOYEE]: [
    Permission.EMPLOYEES_READ_SELF,
    Permission.ATTENDANCE_CHECKIN,
    Permission.ATTENDANCE_READ_SELF,
    Permission.LEAVE_APPLY,
    Permission.LEAVE_READ_SELF,
    Permission.PAYROLL_READ_SELF,
    Permission.DOCUMENTS_READ_SELF,
    Permission.PERFORMANCE_READ_SELF,
    Permission.REPORTS_READ,
    Permission.AI_USE,
  ],
};

export function hasPermission(role: UserRole, permission: Permission): boolean {
  const permissions = ROLE_PERMISSIONS[role];
  if (!permissions) return false;
  return permissions.includes(permission);
}

export function hasAnyPermission(role: UserRole, required: Permission[]): boolean {
  return required.some((perm) => hasPermission(role, perm));
}

export function hasAllPermissions(role: UserRole, required: Permission[]): boolean {
  return required.every((perm) => hasPermission(role, perm));
}
