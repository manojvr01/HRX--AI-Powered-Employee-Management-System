export const UserRole = {
  ADMIN: 'ADMIN',
  HR: 'HR',
  MANAGER: 'MANAGER',
  EMPLOYEE: 'EMPLOYEE',
} as const;

export type UserRole = (typeof UserRole)[keyof typeof UserRole];

export const ALL_ROLES: UserRole[] = [
  UserRole.ADMIN,
  UserRole.HR,
  UserRole.MANAGER,
  UserRole.EMPLOYEE,
];

export const UserStatus = {
  ACTIVE: 'ACTIVE',
  INACTIVE: 'INACTIVE',
  SUSPENDED: 'SUSPENDED',
} as const;

export type UserStatus = (typeof UserStatus)[keyof typeof UserStatus];

export const EmployeeStatus = {
  ACTIVE: 'ACTIVE',
  PROBATION: 'PROBATION',
  NOTICE: 'NOTICE',
  TERMINATED: 'TERMINATED',
} as const;

export type EmployeeStatus = (typeof EmployeeStatus)[keyof typeof EmployeeStatus];

export const AttendanceStatus = {
  PRESENT: 'PRESENT',
  LATE: 'LATE',
  HALF_DAY: 'HALF_DAY',
  ABSENT: 'ABSENT',
} as const;

export type AttendanceStatus = (typeof AttendanceStatus)[keyof typeof AttendanceStatus];

export const LeaveRequestStatus = {
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
  CANCELLED: 'CANCELLED',
} as const;

export type LeaveRequestStatus = (typeof LeaveRequestStatus)[keyof typeof LeaveRequestStatus];

export const PayrollStatus = {
  DRAFT: 'DRAFT',
  PROCESSED: 'PROCESSED',
  PAID: 'PAID',
} as const;

export type PayrollStatus = (typeof PayrollStatus)[keyof typeof PayrollStatus];

export const PerformanceReviewStatus = {
  DRAFT: 'DRAFT',
  SUBMITTED: 'SUBMITTED',
  FINALIZED: 'FINALIZED',
} as const;

export type PerformanceReviewStatus =
  (typeof PerformanceReviewStatus)[keyof typeof PerformanceReviewStatus];

export const DocumentCategory = {
  PROFILE_IMAGE: 'profile_image',
  IDENTITY: 'identity',
  OFFER_LETTER: 'offer_letter',
  PAYSLIP: 'payslip',
  RESUME: 'resume',
  CERTIFICATE: 'certificate',
  PERFORMANCE_ATTACHMENT: 'performance_attachment',
  OTHER_HR_DOCUMENT: 'other_hr_document',
} as const;

export type DocumentCategory = (typeof DocumentCategory)[keyof typeof DocumentCategory];
