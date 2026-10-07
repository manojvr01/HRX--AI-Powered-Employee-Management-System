import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import { env } from '../config/env.js';
import { connectDatabase, disconnectDatabase } from '../config/database.js';
import {
  User,
  Employee,
  Department,
  LeaveType,
  LeaveBalance,
  OrgSettings,
  RefreshSession,
} from '../models/index.js';
import { UserRole, UserStatus, EmployeeStatus } from '@hrx/shared';

export async function runSeed(isTest = false): Promise<void> {
  // CRITICAL SECURITY CHECK: Never seed in production!
  if (process.env.NODE_ENV === 'production') {
    throw new Error('FATAL: Seed execution refused in production environment!');
  }

  console.log('🌱 Starting HRX database seeding...');
  await connectDatabase();

  // Clear existing collections safely
  await Promise.all([
    User.deleteMany({}),
    Employee.deleteMany({}),
    Department.deleteMany({}),
    LeaveType.deleteMany({}),
    LeaveBalance.deleteMany({}),
    OrgSettings.deleteMany({}),
    RefreshSession.deleteMany({}),
  ]);

  // 1. Seed OrgSettings
  console.log('⚙️  Creating OrgSettings...');
  await OrgSettings.create({
    companyName: 'HRX Global Technologies',
    timezone: env.ORG_TIMEZONE || 'Asia/Kolkata',
    lateThresholdMinutes: env.ORG_LATE_THRESHOLD_MINUTES || 15,
    workWeekDays: [1, 2, 3, 4, 5], // Mon-Fri
    workDayStartHour: 9,
    workDayEndHour: 18,
    currency: 'USD',
  });

  // 2. Seed Departments
  console.log('🏢 Creating Departments...');
  const engineering = await Department.create({
    name: 'Engineering',
    code: 'ENG',
    description: 'Software development, cloud infrastructure, and platform security.',
    isActive: true,
  });

  const humanResources = await Department.create({
    name: 'Human Resources',
    code: 'HR',
    description: 'Talent acquisition, employee development, and company culture.',
    isActive: true,
  });

  const product = await Department.create({
    name: 'Product & Design',
    code: 'PRD',
    description: 'Product strategy, UX research, and product design.',
    isActive: true,
  });

  const sales = await Department.create({
    name: 'Sales & Growth',
    code: 'SLS',
    description: 'Business development, client partnerships, and revenue operations.',
    isActive: true,
  });

  // 3. Seed Leave Types
  console.log('🏖️  Creating Leave Types...');
  const annualLeave = await LeaveType.create({
    name: 'Annual Paid Leave',
    code: 'ANNUAL',
    daysAllowedPerYear: 20,
    isPaid: true,
    requiresApproval: true,
    isActive: true,
  });

  const sickLeave = await LeaveType.create({
    name: 'Sick Leave',
    code: 'SICK',
    daysAllowedPerYear: 12,
    isPaid: true,
    requiresApproval: true,
    isActive: true,
  });

  const casualLeave = await LeaveType.create({
    name: 'Casual Leave',
    code: 'CASUAL',
    daysAllowedPerYear: 10,
    isPaid: true,
    requiresApproval: true,
    isActive: true,
  });

  // 4. Hash standard demo password
  const defaultPassword = 'Password123!';
  const passwordHash = await bcrypt.hash(defaultPassword, 10);

  // 5. Create Demo Employees and Users
  console.log('👥 Creating Demo Users & Employee Profiles...');

  // Demo 1: Admin
  const adminEmp = await Employee.create({
    employeeCode: 'EMP-001',
    firstName: 'Alex',
    lastName: 'Vance',
    email: 'admin@hrx.local',
    phone: '+1-555-0101',
    departmentId: engineering._id,
    position: 'Chief Technology Officer',
    joiningDate: '2023-01-15',
    status: EmployeeStatus.ACTIVE,
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
    salary: { basic: 12000, hra: 3000, allowances: 2000, deductions: 1000 },
  });

  await User.create({
    email: 'admin@hrx.local',
    passwordHash,
    role: UserRole.ADMIN,
    status: UserStatus.ACTIVE,
    employeeId: adminEmp._id,
    mustChangePassword: false,
  });

  // Demo 2: HR
  const hrEmp = await Employee.create({
    employeeCode: 'EMP-002',
    firstName: 'Elena',
    lastName: 'Rostova',
    email: 'hr@hrx.local',
    phone: '+1-555-0102',
    departmentId: humanResources._id,
    position: 'Head of People Operations',
    joiningDate: '2023-03-01',
    status: EmployeeStatus.ACTIVE,
    avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150',
    salary: { basic: 9000, hra: 2200, allowances: 1500, deductions: 700 },
  });

  await User.create({
    email: 'hr@hrx.local',
    passwordHash,
    role: UserRole.HR,
    status: UserStatus.ACTIVE,
    employeeId: hrEmp._id,
    mustChangePassword: false,
  });

  // Demo 3: Manager
  const managerEmp = await Employee.create({
    employeeCode: 'EMP-003',
    firstName: 'Marcus',
    lastName: 'Sterling',
    email: 'manager@hrx.local',
    phone: '+1-555-0103',
    departmentId: engineering._id,
    position: 'Engineering Team Lead',
    joiningDate: '2023-06-10',
    status: EmployeeStatus.ACTIVE,
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
    salary: { basic: 8500, hra: 2000, allowances: 1400, deductions: 600 },
  });

  await User.create({
    email: 'manager@hrx.local',
    passwordHash,
    role: UserRole.MANAGER,
    status: UserStatus.ACTIVE,
    employeeId: managerEmp._id,
    mustChangePassword: false,
  });

  // Demo 4: Employee (reports to Marcus)
  const employeeEmp = await Employee.create({
    employeeCode: 'EMP-004',
    firstName: 'Sarah',
    lastName: 'Connor',
    email: 'employee@hrx.local',
    phone: '+1-555-0104',
    departmentId: engineering._id,
    position: 'Senior Full Stack Engineer',
    managerId: managerEmp._id,
    joiningDate: '2024-02-01',
    status: EmployeeStatus.ACTIVE,
    avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
    salary: { basic: 7000, hra: 1800, allowances: 1200, deductions: 500 },
  });

  await User.create({
    email: 'employee@hrx.local',
    passwordHash,
    role: UserRole.EMPLOYEE,
    status: UserStatus.ACTIVE,
    employeeId: employeeEmp._id,
    mustChangePassword: false,
  });

  // Update Department Heads
  engineering.headId = adminEmp._id;
  await engineering.save();
  humanResources.headId = hrEmp._id;
  await humanResources.save();

  // 6. Seed Leave Balances for all employees
  console.log('⚖️  Seeding Leave Balances for year 2026...');
  const currentYear = 2026;
  const employees = [adminEmp, hrEmp, managerEmp, employeeEmp];
  const leaveTypes = [annualLeave, sickLeave, casualLeave];

  for (const emp of employees) {
    for (const lt of leaveTypes) {
      await LeaveBalance.create({
        employeeId: emp._id,
        leaveTypeId: lt._id,
        year: currentYear,
        allocatedDays: lt.daysAllowedPerYear,
        usedDays: 0,
        pendingDays: 0,
        remainingDays: lt.daysAllowedPerYear,
      });
    }
  }

  console.log('✅ HRX Seed Completed Successfully!');
  console.log('========================================================');
  console.log('📋 Demo Accounts (Password: Password123!):');
  console.log('1. Admin:    admin@hrx.local    (ADMIN)');
  console.log('2. HR:       hr@hrx.local       (HR)');
  console.log('3. Manager:  manager@hrx.local  (MANAGER)');
  console.log('4. Employee: employee@hrx.local (EMPLOYEE)');
  console.log('========================================================');

  if (!isTest) {
    await disconnectDatabase();
  }
}

// Execute directly if run via CLI
if (process.argv[1]?.endsWith('seed.ts') || process.argv[1]?.endsWith('seed.js')) {
  runSeed()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('❌ Seeding failed:', err);
      process.exit(1);
    });
}
