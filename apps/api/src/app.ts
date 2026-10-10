import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { env } from './config/env.js';
import { requestLogger } from './middleware/requestLogger.js';
import { preventQueryInjection } from './middleware/querySanitizer.js';
import { errorHandler } from './middleware/errorHandler.js';
import { authRoutes } from './modules/auth/authRoutes.js';
import { healthRoutes } from './modules/health/healthRoutes.js';
import { departmentRoutes } from './modules/departments/departmentRoutes.js';
import { employeeRoutes } from './modules/employees/employeeRoutes.js';
import { dashboardRoutes } from './modules/dashboard/dashboardRoutes.js';
import { attendanceRoutes } from './modules/attendance/attendanceRoutes.js';
import { leaveRoutes } from './modules/leave/leaveRoutes.js';
import { settingsRoutes } from './modules/settings/settingsRoutes.js';
import { notificationRoutes } from './modules/notifications/notificationRoutes.js';
import { payrollRoutes } from './modules/payroll/payrollRoutes.js';
import { documentRoutes } from './modules/documents/documentRoutes.js';
import { performanceRoutes } from './modules/performance/performanceRoutes.js';
import { policyRoutes } from './modules/policies/policyRoutes.js';
import { aiRoutes } from './modules/ai/aiRoutes.js';
import { analyticsRoutes } from './modules/analytics/analyticsRoutes.js';
import { reportRoutes } from './modules/reports/reportRoutes.js';
import { announcementRoutes } from './modules/announcements/announcementRoutes.js';
import { auditRoutes } from './modules/audit/auditRoutes.js';
import { NotFoundError } from './utils/errors.js';

export const app = express();

// Security headers
app.use(helmet());

// CORS configuration
app.use(
  cors({
    origin: env.CORS_ORIGINS.split(',').map((o) => o.trim()),
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-request-id'],
  })
);

// Parsers
app.use(express.json({ limit: '2mb' }));
app.use(cookieParser());

// Request logging & tracking
app.use(requestLogger);

// NoSQL query operator injection protection
app.use(preventQueryInjection);

// Root level health endpoints
app.use(healthRoutes);

// API v1 routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/health', healthRoutes);
app.use('/api/v1/departments', departmentRoutes);
app.use('/api/v1/employees', employeeRoutes);
app.use('/api/v1/dashboard', dashboardRoutes);
app.use('/api/v1/attendance', attendanceRoutes);
app.use('/api/v1/leaves', leaveRoutes);
app.use('/api/v1/leave', leaveRoutes);
app.use('/api/v1/settings', settingsRoutes);
app.use('/api/v1/notifications', notificationRoutes);
app.use('/api/v1/payroll', payrollRoutes);
app.use('/api/v1/documents', documentRoutes);
app.use('/api/v1/performance', performanceRoutes);
app.use('/api/v1/policies', policyRoutes);
app.use('/api/v1/ai', aiRoutes);
app.use('/api/v1/analytics', analyticsRoutes);
app.use('/api/v1/reports', reportRoutes);
app.use('/api/v1/announcements', announcementRoutes);
app.use('/api/v1/audit-logs', auditRoutes);

// 404 Catch-all handler
app.use((req, res, next) => {
  next(new NotFoundError(`Route ${req.method} ${req.originalUrl} not found`));
});

// Centralized error handler
app.use(errorHandler);
