import { describe, it, expect } from 'vitest';
import {
  UserRole,
  Permission,
  ROLE_PERMISSIONS,
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
} from '@hrx/shared';

describe('RBAC Permission Map Unit Tests', () => {
  it('ADMIN should possess all defined system permissions', () => {
    const adminPermissions = ROLE_PERMISSIONS[UserRole.ADMIN];
    expect(adminPermissions).toBeDefined();
    expect(hasPermission(UserRole.ADMIN, Permission.SETTINGS_MANAGE)).toBe(true);
    expect(hasPermission(UserRole.ADMIN, Permission.EMPLOYEES_DELETE)).toBe(true);
    expect(hasPermission(UserRole.ADMIN, Permission.AUDIT_READ)).toBe(true);
  });

  it('HR should have employee management and approval permissions but not system settings manage', () => {
    expect(hasPermission(UserRole.HR, Permission.EMPLOYEES_CREATE)).toBe(true);
    expect(hasPermission(UserRole.HR, Permission.LEAVE_APPROVE)).toBe(true);
    expect(hasPermission(UserRole.HR, Permission.PAYROLL_MANAGE)).toBe(true);
    expect(hasPermission(UserRole.HR, Permission.SETTINGS_MANAGE)).toBe(false);
  });

  it('MANAGER should only have team-level permissions', () => {
    expect(hasPermission(UserRole.MANAGER, Permission.ATTENDANCE_READ_TEAM)).toBe(true);
    expect(hasPermission(UserRole.MANAGER, Permission.LEAVE_APPROVE)).toBe(true);
    expect(hasPermission(UserRole.MANAGER, Permission.EMPLOYEES_CREATE)).toBe(false);
    expect(hasPermission(UserRole.MANAGER, Permission.PAYROLL_MANAGE)).toBe(false);
    expect(hasPermission(UserRole.MANAGER, Permission.SETTINGS_MANAGE)).toBe(false);
  });

  it('EMPLOYEE should only have self-service permissions', () => {
    expect(hasPermission(UserRole.EMPLOYEE, Permission.EMPLOYEES_READ_SELF)).toBe(true);
    expect(hasPermission(UserRole.EMPLOYEE, Permission.ATTENDANCE_READ_SELF)).toBe(true);
    expect(hasPermission(UserRole.EMPLOYEE, Permission.LEAVE_APPLY)).toBe(true);
    expect(hasPermission(UserRole.EMPLOYEE, Permission.EMPLOYEES_CREATE)).toBe(false);
    expect(hasPermission(UserRole.EMPLOYEE, Permission.LEAVE_APPROVE)).toBe(false);
    expect(hasPermission(UserRole.EMPLOYEE, Permission.PAYROLL_MANAGE)).toBe(false);
  });

  it('hasAnyPermission and hasAllPermissions should accurately evaluate arrays', () => {
    expect(
      hasAnyPermission(UserRole.EMPLOYEE, [
        Permission.EMPLOYEES_CREATE,
        Permission.ATTENDANCE_READ_SELF,
      ])
    ).toBe(true);

    expect(
      hasAllPermissions(UserRole.EMPLOYEE, [
        Permission.EMPLOYEES_CREATE,
        Permission.ATTENDANCE_READ_SELF,
      ])
    ).toBe(false);
  });
});
