import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../src/app.js';
import { connectDatabase, disconnectDatabase } from '../src/config/database.js';
import { runSeed } from '../src/scripts/seed.js';

describe('Employee, Department & Scoping Integration Tests', () => {
  let adminToken: string;
  let hrToken: string;
  let managerToken: string;
  let employeeToken: string;
  let adminEmpId: string;
  let managerEmpId: string;
  let employeeEmpId: string;

  beforeAll(async () => {
    await connectDatabase();
    await runSeed(true);

    // Login all 4 demo users to get tokens
    const adminRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'admin@hrx.local', password: 'Password123!' });
    adminToken = adminRes.body.data.tokens.accessToken;
    adminEmpId = adminRes.body.data.user.employee.id;

    const hrRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'hr@hrx.local', password: 'Password123!' });
    hrToken = hrRes.body.data.tokens.accessToken;

    const mgrRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'manager@hrx.local', password: 'Password123!' });
    managerToken = mgrRes.body.data.tokens.accessToken;
    managerEmpId = mgrRes.body.data.user.employee.id;

    const empRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'employee@hrx.local', password: 'Password123!' });
    employeeToken = empRes.body.data.tokens.accessToken;
    employeeEmpId = empRes.body.data.user.employee.id;
  });

  afterAll(async () => {
    await disconnectDatabase();
  });

  it('Admin can create a new department', async () => {
    const res = await request(app)
      .post('/api/v1/departments')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Quality Assurance',
        code: 'QA',
        description: 'Automated testing and QA auditing.',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.name).toBe('Quality Assurance');
    expect(res.body.data.code).toBe('QA');
  });

  it('Employee role CANNOT create a department (403 Forbidden)', async () => {
    const res = await request(app)
      .post('/api/v1/departments')
      .set('Authorization', `Bearer ${employeeToken}`)
      .send({
        name: 'Unauthorized Dept',
        code: 'UNAUTH',
      });

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });

  it('Admin and HR can create an employee with auto-generated employee code', async () => {
    const res = await request(app)
      .post('/api/v1/employees')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@hrx.local',
        position: 'QA Analyst',
        phone: '+1-555-0199',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.employeeCode).toMatch(/^EMP-\d{3}$/);
    expect(res.body.data.email).toBe('john.doe@hrx.local');
  });

  it('Rejects duplicate employee email with 409 Conflict', async () => {
    const res = await request(app)
      .post('/api/v1/employees')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        firstName: 'Duplicate',
        lastName: 'Person',
        email: 'john.doe@hrx.local',
        position: 'Software Developer',
      });

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
  });

  it('Manager scoping: Manager only sees self and direct reports in list', async () => {
    const res = await request(app)
      .get('/api/v1/employees')
      .set('Authorization', `Bearer ${managerToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    const ids = res.body.data.map((e: any) => e._id);
    // Sarah Connor reports to Marcus Sterling, so both should be present
    expect(ids).toContain(employeeEmpId);
    expect(ids).toContain(managerEmpId);
    // Alex Vance (Admin) is not a direct report, so should NOT be in manager's list!
    expect(ids).not.toContain(adminEmpId);
  });

  it('Employee cannot view another employee profile directly (403 Forbidden)', async () => {
    const res = await request(app)
      .get(`/api/v1/employees/${adminEmpId}`)
      .set('Authorization', `Bearer ${employeeToken}`);

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });

  it('Employee can view their own employee profile', async () => {
    const res = await request(app)
      .get(`/api/v1/employees/${employeeEmpId}`)
      .set('Authorization', `Bearer ${employeeToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data._id).toBe(employeeEmpId);
  });

  it('HR cannot modify an ADMIN employee account (403 Forbidden)', async () => {
    const res = await request(app)
      .patch(`/api/v1/employees/${adminEmpId}`)
      .set('Authorization', `Bearer ${hrToken}`)
      .send({ position: 'New CTO Title' });

    expect(res.status).toBe(403);
    expect(res.body.error.message).toContain('HR personnel are not permitted to modify an ADMIN account');
  });

  it('Employee self-service is restricted to allowed fields', async () => {
    // Attempting to change salary -> Forbidden
    const illegalRes = await request(app)
      .patch(`/api/v1/employees/${employeeEmpId}`)
      .set('Authorization', `Bearer ${employeeToken}`)
      .send({ salary: { basic: 50000 } });

    expect(illegalRes.status).toBe(403);

    // Updating allowed field (phone) -> Success
    const legalRes = await request(app)
      .patch(`/api/v1/employees/${employeeEmpId}`)
      .set('Authorization', `Bearer ${employeeToken}`)
      .send({ phone: '+1-555-9999' });

    expect(legalRes.status).toBe(200);
    expect(legalRes.body.data.phone).toBe('+1-555-9999');
  });

  it('Rejects sorting by unapproved field with 400 Bad Request', async () => {
    const res = await request(app)
      .get('/api/v1/employees')
      .query({ sortBy: 'unapprovedField' })
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(400);
    expect(res.body.error.message).toContain('Invalid sort field');
  });

  it('Returns role-aware dashboard metrics', async () => {
    const adminMetrics = await request(app)
      .get('/api/v1/dashboard/metrics')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(adminMetrics.status).toBe(200);
    expect(adminMetrics.body.data.metrics.totalEmployees).toBeGreaterThan(0);
    expect(adminMetrics.body.data.metrics.departmentDistribution).toBeDefined();

    const empMetrics = await request(app)
      .get('/api/v1/dashboard/metrics')
      .set('Authorization', `Bearer ${employeeToken}`);

    expect(empMetrics.status).toBe(200);
    expect(empMetrics.body.data.metrics.profile).toBeDefined();
    expect(empMetrics.body.data.metrics.leaveBalances).toBeDefined();
  });
});
