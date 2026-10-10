import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../src/app.js';
import { connectDatabase, disconnectDatabase } from '../src/config/database.js';
import { runSeed } from '../src/scripts/seed.js';
import { computeSalaryTotals } from '../src/modules/payroll/payrollService.js';
import { Payroll } from '../src/models/Payroll.js';
import { DocumentModel } from '../src/models/Document.js';
import { Notification } from '../src/models/Notification.js';
import { Employee } from '../src/models/Employee.js';
import { User } from '../src/models/User.js';
import mongoose from 'mongoose';

describe('Phase 4: Payroll & Documents Integration Tests', () => {
  let adminToken: string;
  let hrToken: string;
  let managerToken: string;
  let employeeToken: string;
  let employeeEmpId: string;
  let employeeUserId: string;
  let managerEmpId: string;
  let managerUserId: string;
  let otherEmpId: string;

  beforeAll(async () => {
    await connectDatabase();
    await runSeed(true);

    // Login Admin
    const adminRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'admin@hrx.local', password: 'Password123!' });
    adminToken = adminRes.body.data.tokens.accessToken;

    // Login HR
    const hrRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'hr@hrx.local', password: 'Password123!' });
    hrToken = hrRes.body.data.tokens.accessToken;

    // Login Manager
    const managerRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'manager@hrx.local', password: 'Password123!' });
    managerToken = managerRes.body.data.tokens.accessToken;
    managerEmpId = managerRes.body.data.user.employee.id;
    managerUserId = managerRes.body.data.user.id;

    // Login Employee (Sarah Jenkins)
    const empRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'employee@hrx.local', password: 'Password123!' });
    employeeToken = empRes.body.data.tokens.accessToken;
    employeeEmpId = empRes.body.data.user.employee.id;
    employeeUserId = empRes.body.data.user.id;

    // Fetch another employee (e.g. David Chen or create one)
    const other = await Employee.findOne({ email: 'david.chen@hrx.local' });
    if (other) {
      otherEmpId = other._id.toString();
    } else {
      const created = await Employee.create({
        employeeCode: 'EMP-998',
        firstName: 'Test',
        lastName: 'Peer',
        email: 'test.peer@hrx.local',
        position: 'Staff Engineer',
        status: 'ACTIVE',
      });
      otherEmpId = created._id.toString();
    }
  });

  afterAll(async () => {
    await disconnectDatabase();
  });

  describe('Payroll Logic, Totals & Scoping', () => {
    it('Computes gross and net salary totals correctly server-side', () => {
      const { grossSalary, netSalary } = computeSalaryTotals(50000, 20000, 10000, 5000);
      expect(grossSalary).toBe(80000);
      expect(netSalary).toBe(75000);

      // Ensures net salary cannot be negative
      const overDeduction = computeSalaryTotals(10000, 0, 0, 15000);
      expect(overDeduction.grossSalary).toBe(10000);
      expect(overDeduction.netSalary).toBe(0);
    });

    it('HR creates a payroll record with server-side totals and dispatches notification on PROCESSED', async () => {
      // Clear previous test payroll records for Sarah for month 10 / 2026
      await Payroll.deleteMany({
        employeeId: new mongoose.Types.ObjectId(employeeEmpId),
        month: 10,
        year: 2026,
      });

      const res = await request(app)
        .post('/api/v1/payroll')
        .set('Authorization', `Bearer ${hrToken}`)
        .send({
          employeeId: employeeEmpId,
          month: 10,
          year: 2026,
          basicSalary: 60000,
          hra: 24000,
          allowances: 10000,
          deductions: 8000,
          status: 'PROCESSED',
          notes: 'October 2026 regular cycle',
        });

      expect(res.status).toBe(201);
      expect(res.body.data.grossSalary).toBe(94000);
      expect(res.body.data.netSalary).toBe(86000);
      expect(res.body.data.status).toBe('PROCESSED');

      // Verify notification sent to Sarah
      const notif = await Notification.findOne({
        userId: new mongoose.Types.ObjectId(employeeUserId),
        title: 'Payslip Available',
      }).sort({ createdAt: -1 });

      expect(notif).toBeDefined();
      expect(notif?.message).toContain('October 2026');
    });

    it('Rejects duplicate payroll record for the same employee and month (409 Conflict)', async () => {
      const res = await request(app)
        .post('/api/v1/payroll')
        .set('Authorization', `Bearer ${hrToken}`)
        .send({
          employeeId: employeeEmpId,
          month: 10,
          year: 2026,
          basicSalary: 60000,
          hra: 24000,
          allowances: 10000,
          deductions: 8000,
        });

      expect(res.status).toBe(409);
      expect(res.body.error.message).toContain('already exists');
    });

    it('Manager has NO payroll access (Forbidden 403)', async () => {
      // Manager attempting to list payroll
      const listRes = await request(app)
        .get('/api/v1/payroll')
        .set('Authorization', `Bearer ${managerToken}`);

      expect(listRes.status).toBe(403);
      expect(listRes.body.error.message).toContain('Managers do not have access');

      // Manager attempting to access payroll metrics
      const metricsRes = await request(app)
        .get('/api/v1/payroll/metrics')
        .set('Authorization', `Bearer ${managerToken}`);

      expect(metricsRes.status).toBe(403);
    });

    it('Employee cannot view another employee payslip (IDOR Protection 403 Forbidden)', async () => {
      // Create a payroll record for other employee
      await Payroll.deleteMany({
        employeeId: new mongoose.Types.ObjectId(otherEmpId),
        month: 10,
        year: 2026,
      });

      const otherPayroll = await Payroll.create({
        employeeId: new mongoose.Types.ObjectId(otherEmpId),
        month: 10,
        year: 2026,
        basicSalary: 80000,
        hra: 32000,
        allowances: 15000,
        deductions: 10000,
        grossSalary: 127000,
        netSalary: 117000,
        status: 'PROCESSED',
      });

      // Sarah attempts to fetch other employee's payslip -> 403 Forbidden
      const res = await request(app)
        .get(`/api/v1/payroll/${otherPayroll._id}`)
        .set('Authorization', `Bearer ${employeeToken}`);

      expect(res.status).toBe(403);
      expect(res.body.error.message).toContain('own payslip');
    });

    it('Employee can read their own payslip record', async () => {
      const sarahPayroll = await Payroll.findOne({
        employeeId: new mongoose.Types.ObjectId(employeeEmpId),
        month: 10,
        year: 2026,
      });

      expect(sarahPayroll).toBeDefined();

      const res = await request(app)
        .get(`/api/v1/payroll/${sarahPayroll?._id}`)
        .set('Authorization', `Bearer ${employeeToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.netSalary).toBe(86000);
    });
  });

  describe('Document Security, Validation & IDOR Protection', () => {
    it('Blocks malicious file disguised with wrong magic bytes (400 Bad Request)', async () => {
      // A shell/text script falsely labeled as a PDF
      const fakePdfBuffer = Buffer.from('#!/bin/bash\necho "malicious script"\n');

      const res = await request(app)
        .post('/api/v1/documents/upload')
        .set('Authorization', `Bearer ${employeeToken}`)
        .field('employeeId', employeeEmpId)
        .field('title', 'Disguised Malicious File')
        .field('category', 'certificate')
        .attach('file', fakePdfBuffer, {
          filename: 'malicious.pdf',
          contentType: 'application/pdf',
        });

      expect(res.status).toBe(400);
      expect(res.body.error.message).toContain('Invalid file content');
    });

    it('Rejects oversized files exceeding 5MB (400 Bad Request)', async () => {
      // Create a 6MB dummy buffer starting with valid PDF magic bytes
      const bigBuffer = Buffer.alloc(6 * 1024 * 1024);
      bigBuffer[0] = 0x25; // %
      bigBuffer[1] = 0x50; // P
      bigBuffer[2] = 0x44; // D
      bigBuffer[3] = 0x46; // F

      const res = await request(app)
        .post('/api/v1/documents/upload')
        .set('Authorization', `Bearer ${employeeToken}`)
        .field('employeeId', employeeEmpId)
        .field('title', 'Oversized PDF')
        .field('category', 'resume')
        .attach('file', bigBuffer, {
          filename: 'oversized.pdf',
          contentType: 'application/pdf',
        });

      expect(res.status).toBe(400);
      expect(res.body.error.message).toContain('exceeds maximum allowed size of 5 MB');
    });

    it('Uploads a genuine PDF document with sanitized filename and metadata in MongoDB', async () => {
      // Minimal valid PDF byte sequence: %PDF-1.4 ... %%EOF
      const validPdfBuffer = Buffer.from(
        '%PDF-1.4\n1 0 obj\n<<>>\nendobj\ntrailer\n<<>>\n%%EOF'
      );

      const res = await request(app)
        .post('/api/v1/documents/upload')
        .set('Authorization', `Bearer ${employeeToken}`)
        .field('employeeId', employeeEmpId)
        .field('title', 'Annual Certification')
        .field('category', 'certificate')
        .attach('file', validPdfBuffer, {
          filename: 'Annual Certification 2026.pdf',
          contentType: 'application/pdf',
        });

      expect(res.status).toBe(201);
      expect(res.body.data.title).toBe('Annual Certification');
      expect(res.body.data.category).toBe('certificate');
      expect(res.body.data.mimeType).toBe('application/pdf');

      // Verify persisted in MongoDB
      const doc = await DocumentModel.findById(res.body.data._id);
      expect(doc).toBeDefined();
      expect(doc?.filePublicId).toBeDefined();
    });

    it('Generates a signed short-lived download URL and enforces authorization (IDOR protection)', async () => {
      // 1. Upload a document for otherEmpId by HR
      const validPngBuffer = Buffer.from([
        0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d,
        0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
      ]);

      const hrUploadRes = await request(app)
        .post('/api/v1/documents/upload')
        .set('Authorization', `Bearer ${hrToken}`)
        .field('employeeId', otherEmpId)
        .field('title', 'Confidential ID Proof')
        .field('category', 'identity')
        .field('isConfidential', 'true')
        .attach('file', validPngBuffer, {
          filename: 'id_proof.png',
          contentType: 'image/png',
        });

      expect(hrUploadRes.status).toBe(201);
      const otherDocId = hrUploadRes.body.data._id;

      // 2. Sarah (employee) attempts to generate download URL for other employee's document -> 403 Forbidden
      const idorRes = await request(app)
        .get(`/api/v1/documents/${otherDocId}/download-url`)
        .set('Authorization', `Bearer ${employeeToken}`);

      expect(idorRes.status).toBe(403);
      expect(idorRes.body.error.message).toContain('assigned to your profile');

      // 3. HR generates valid download URL
      const hrDownloadUrlRes = await request(app)
        .get(`/api/v1/documents/${otherDocId}/download-url`)
        .set('Authorization', `Bearer ${hrToken}`);

      expect(hrDownloadUrlRes.status).toBe(200);
      expect(hrDownloadUrlRes.body.data.downloadUrl).toContain('/api/v1/documents/download/');

      // 4. Download file using the signed token
      const downloadPath = hrDownloadUrlRes.body.data.downloadUrl;
      const downloadRes = await request(app).get(downloadPath);

      expect(downloadRes.status).toBe(200);
      expect(downloadRes.header['content-type']).toBe('image/png');

      // 5. Tampered or expired token is rejected with 401 Unauthorized
      const tamperedRes = await request(app).get(
        '/api/v1/documents/download/tampered-or-expired-token'
      );
      expect(tamperedRes.status).toBe(401);
    });
  });
});
