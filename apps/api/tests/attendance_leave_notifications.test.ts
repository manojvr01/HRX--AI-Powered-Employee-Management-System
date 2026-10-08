import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../src/app.js';
import { connectDatabase, disconnectDatabase } from '../src/config/database.js';
import { runSeed } from '../src/scripts/seed.js';
import { calculateWorkingDays } from '../src/modules/leave/leaveService.js';
import { calculateDurationMinutes } from '../src/utils/timezone.js';
import { Holiday } from '../src/models/Holiday.js';
import { Attendance } from '../src/models/Attendance.js';
import { LeaveType } from '../src/models/LeaveType.js';
import { LeaveRequest } from '../src/models/LeaveRequest.js';
import { LeaveBalance } from '../src/models/LeaveBalance.js';
import { Employee } from '../src/models/Employee.js';
import { User } from '../src/models/User.js';
import {
  createAndSendNotification,
  getUserNotifications,
  markNotificationAsRead,
} from '../src/services/notificationService.js';
import mongoose from 'mongoose';

describe('Phase 3: Attendance, Leave & Notification Tests', () => {
  let adminToken: string;
  let hrToken: string;
  let managerToken: string;
  let employeeToken: string;
  let employeeEmpId: string;
  let employeeUserId: string;
  let managerEmpId: string;
  let managerUserId: string;
  let annualLeaveTypeId: string;
  let sickLeaveTypeId: string;

  beforeAll(async () => {
    await connectDatabase();
    await runSeed(true);

    const adminRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'admin@hrx.local', password: 'Password123!' });
    adminToken = adminRes.body.data.tokens.accessToken;

    const hrRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'hr@hrx.local', password: 'Password123!' });
    hrToken = hrRes.body.data.tokens.accessToken;

    const mgrRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'manager@hrx.local', password: 'Password123!' });
    managerToken = mgrRes.body.data.tokens.accessToken;
    managerEmpId = mgrRes.body.data.user.employee.id;
    managerUserId = mgrRes.body.data.user.id;

    const empRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'employee@hrx.local', password: 'Password123!' });
    employeeToken = empRes.body.data.tokens.accessToken;
    employeeEmpId = empRes.body.data.user.employee.id;
    employeeUserId = empRes.body.data.user.id;

    const types = await LeaveType.find().lean();
    const annual = types.find((t) => t.code === 'ANNUAL');
    const sick = types.find((t) => t.code === 'SICK');
    annualLeaveTypeId = annual!._id.toString();
    sickLeaveTypeId = sick!._id.toString();
  });

  afterAll(async () => {
    await disconnectDatabase();
  });

  // 1. ATTENDANCE TESTS
  describe('Attendance Rules', () => {
    it('Checkout before check-in is rejected', async () => {
      // Clear attendance for today for employee first
      await Attendance.deleteMany({ employeeId: new mongoose.Types.ObjectId(employeeEmpId) });

      const res = await request(app)
        .post('/api/v1/attendance/check-out')
        .set('Authorization', `Bearer ${employeeToken}`);

      expect(res.status).toBe(404);
      expect(res.body.error.message).toContain('No active check-in found for today');
    });

    it('Enforces one attendance record per day and calculates duration on check-out', async () => {
      // 1. Initial check-in succeeds
      const checkInRes = await request(app)
        .post('/api/v1/attendance/check-in')
        .set('Authorization', `Bearer ${employeeToken}`)
        .send({ notes: 'Starting morning tasks' });

      expect(checkInRes.status).toBe(201);
      expect(checkInRes.body.success).toBe(true);
      expect(checkInRes.body.data.checkInTime).toBeDefined();

      // 2. Duplicate check-in on the same day is rejected
      const duplicateRes = await request(app)
        .post('/api/v1/attendance/check-in')
        .set('Authorization', `Bearer ${employeeToken}`)
        .send({ notes: 'Duplicate attempt' });

      expect(duplicateRes.status).toBe(409);
      expect(duplicateRes.body.error.message).toContain('already recorded for today');

      // 3. Check-out succeeds and records duration
      const checkOutRes = await request(app)
        .post('/api/v1/attendance/check-out')
        .set('Authorization', `Bearer ${employeeToken}`)
        .send({ notes: 'Completed shift' });

      expect(checkOutRes.status).toBe(200);
      expect(checkOutRes.body.data.checkOutTime).toBeDefined();
      expect(checkOutRes.body.data.durationMinutes).toBeGreaterThanOrEqual(0);

      // 4. Repeated check-out rejected
      const repeatCheckOut = await request(app)
        .post('/api/v1/attendance/check-out')
        .set('Authorization', `Bearer ${employeeToken}`);

      expect(repeatCheckOut.status).toBe(409);
    });

    it('Duration calculation across timezone boundary accurately computes minutes', () => {
      // Simulate UTC 23:30 to next day UTC 08:30 (9 hours = 540 minutes)
      const start = new Date('2026-05-01T23:30:00.000Z');
      const end = new Date('2026-05-02T08:30:00.000Z');

      const duration = calculateDurationMinutes(start, end);
      expect(duration).toBe(540);
    });
  });

  // 2. LEAVE WORKING-DAY & HOLIDAY CALCULATION
  describe('Leave Working-Day Calculation & Holiday Exclusion', () => {
    it('Excludes weekends and holidays when calculating working days', async () => {
      // Mon 2026-08-10 to Fri 2026-08-14 (5 weekdays)
      // Add a holiday on Wed 2026-08-12
      await Holiday.deleteMany({ date: '2026-08-12' });
      await Holiday.create({
        name: 'Midweek Festival',
        date: '2026-08-12',
        year: 2026,
      });

      const days = await calculateWorkingDays('2026-08-10', '2026-08-14');
      // 5 weekdays minus 1 holiday = 4 working days
      expect(days).toBe(4);

      // Span across weekend: Fri 2026-08-14 to Mon 2026-08-17
      // Fri (1), Sat (weekend 0), Sun (weekend 0), Mon (1) = 2 working days
      const weekendDays = await calculateWorkingDays('2026-08-14', '2026-08-17');
      expect(weekendDays).toBe(2);
    });
  });

  // 3. LEAVE APPROVAL, REJECTION & RACE OVERLAP
  describe('Leave Lifecycle, Overlap & Balance Verification', () => {
    it('Rejects leave request when balance is insufficient', async () => {
      // Sarah Connor has 12 days of Sick leave. Requesting 25 working days
      const res = await request(app)
        .post('/api/v1/leave')
        .set('Authorization', `Bearer ${employeeToken}`)
        .send({
          leaveTypeId: sickLeaveTypeId,
          startDate: '2026-11-02',
          endDate: '2026-12-10', // ~29 working days
          reason: 'Extended medical recovery',
        });

      expect(res.status).toBe(400);
      expect(res.body.error.message).toContain('Insufficient leave balance');
    });

    it('Applies for leave, deducts pending balance, and prevents overlapping requests', async () => {
      // Clear any leave requests for Sarah in September 2026
      await LeaveRequest.deleteMany({
        employeeId: new mongoose.Types.ObjectId(employeeEmpId),
      });

      // Sarah applies for 3 days: 2026-09-08 to 2026-09-10
      const applyRes = await request(app)
        .post('/api/v1/leave')
        .set('Authorization', `Bearer ${employeeToken}`)
        .send({
          leaveTypeId: annualLeaveTypeId,
          startDate: '2026-09-08',
          endDate: '2026-09-10',
          reason: 'Annual family vacation',
        });

      expect(applyRes.status).toBe(201);
      const leaveId = applyRes.body.data._id;
      expect(applyRes.body.data.daysCount).toBe(3);

      // Verify pending balance increased
      const bal = await LeaveBalance.findOne({
        employeeId: new mongoose.Types.ObjectId(employeeEmpId),
        leaveTypeId: new mongoose.Types.ObjectId(annualLeaveTypeId),
        year: 2026,
      });
      expect(bal?.pendingDays).toBe(3);

      // Overlapping request attempt (overlaps on 2026-09-09) -> Rejected
      const overlapRes = await request(app)
        .post('/api/v1/leave')
        .set('Authorization', `Bearer ${employeeToken}`)
        .send({
          leaveTypeId: annualLeaveTypeId,
          startDate: '2026-09-09',
          endDate: '2026-09-11',
          reason: 'Overlapping request',
        });

      expect(overlapRes.status).toBe(409);
      expect(overlapRes.body.error.message).toContain('overlapping');

      // Manager approving Sarah's leave (Marcus Sterling is Sarah's manager)
      const approveRes = await request(app)
        .patch(`/api/v1/leave/${leaveId}/approve`)
        .set('Authorization', `Bearer ${managerToken}`);

      expect(approveRes.status).toBe(200);
      expect(approveRes.body.data.status).toBe('APPROVED');

      // Verify balance: atomic deduction on approval
      const updatedBal = await LeaveBalance.findOne({
        employeeId: new mongoose.Types.ObjectId(employeeEmpId),
        leaveTypeId: new mongoose.Types.ObjectId(annualLeaveTypeId),
        year: 2026,
      });
      expect(updatedBal?.usedDays).toBe(3);
      expect(updatedBal?.pendingDays).toBe(0);
    });

    it('Manager cannot approve leave for non-reports (Forbidden 403)', async () => {
      // Create a dummy employee who does NOT report to Marcus
      const otherEmp = await Employee.create({
        employeeCode: 'EMP-999',
        firstName: 'External',
        lastName: 'Person',
        email: 'other.person@hrx.local',
        position: 'Finance Associate',
        status: 'ACTIVE',
      });

      const otherLeave = await LeaveRequest.create({
        employeeId: otherEmp._id,
        leaveTypeId: new mongoose.Types.ObjectId(annualLeaveTypeId),
        startDate: '2026-10-12',
        endDate: '2026-10-14',
        daysCount: 3,
        reason: 'Personal',
        status: 'PENDING',
      });

      // Manager Marcus attempts to approve this non-report's leave -> 403
      const res = await request(app)
        .patch(`/api/v1/leave/${otherLeave._id}/approve`)
        .set('Authorization', `Bearer ${managerToken}`);

      expect(res.status).toBe(403);
      expect(res.body.error.message).toContain('direct reports');
    });
  });

  // 4. NOTIFICATION PERSISTENCE & SCOPING
  describe('Notification Service', () => {
    it('Persists notification and delivers to the targeted user only', async () => {
      const notification = await createAndSendNotification({
        userId: employeeUserId,
        title: 'Policy Update',
        message: 'A new annual leave guideline is now active.',
        type: 'INFO',
      });

      expect(notification._id).toBeDefined();

      // Sarah Connor fetches notifications -> notification is present
      const empNotes = await getUserNotifications(employeeUserId);
      expect(empNotes.notifications.some((n) => n._id.toString() === notification._id.toString())).toBe(true);

      // Marcus Sterling fetches notifications -> Sarah's notification is NOT in his list
      const mgrNotes = await getUserNotifications(managerUserId);
      expect(mgrNotes.notifications.some((n) => n._id.toString() === notification._id.toString())).toBe(false);

      // Mark as read
      await markNotificationAsRead(notification._id.toString(), employeeUserId);
      const afterRead = await getUserNotifications(employeeUserId);
      const found = afterRead.notifications.find((n) => n._id.toString() === notification._id.toString());
      expect(found.isRead).toBe(true);
    });
  });
});
