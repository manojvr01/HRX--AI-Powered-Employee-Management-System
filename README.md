# HRX - Enterprise-Grade AI-Powered Employee Management & HR Platform

HRX is a comprehensive, production-ready, role-based HRMS platform designed to centralize employee records, departments, attendance tracking, leave requests, payroll processing, performance reviews, company policies, real-time announcements, and AI-assisted HR workflows.

---

## 🛠️ Architecture & Tech Stack

- **Monorepo**: npm workspaces (`packages/*`, `apps/*`)
- **Shared Package (`packages/shared`)**: TypeScript types, Zod validation schemas, RBAC permission matrix, compiled with `tsup`.
- **Backend API (`apps/api`)**: Node.js, Express, TypeScript, Mongoose (MongoDB / Atlas), Socket.IO (real-time notifications & announcements), Pino logger, Helmet, CORS, Rate-Limiting, Multer (magic-byte validation), Cloudinary / local storage fallback, Google Gemini AI (`gemini-1.5-flash`) with resilient offline fallback.
- **Frontend Web (`apps/web`)**: React 18, Vite, TypeScript, Tailwind CSS, Lucide icons, React Router, Socket.IO client.
- **Testing**: Vitest, Supertest (59 passing integration & unit tests).
- **Deployment**: Render (API blueprint), Vercel (Web SPA rewrites), GitHub Actions CI.

---

## 🚀 Quick Start

### 1. Prerequisites
- Node.js >= 20.x
- MongoDB running locally on `mongodb://localhost:27017/hrx_dev` OR a MongoDB Atlas cluster URI.
- (Optional) `GEMINI_API_KEY` from Google AI Studio.

### 2. Installation
```bash
npm install
npm run build:shared
```

### 3. Environment Configuration
Copy `.env.example` to `.env` in root and configure your values:
```bash
cp .env.example .env
```

For MongoDB Atlas setup instructions, see [docs/mongodb-atlas-setup.md](docs/mongodb-atlas-setup.md).

### 4. Seed Database
Seeds demo organizations, departments, users, leave balances, HR policies, announcements, and performance reviews:
```bash
npm run seed
```

### 5. Start Development
```bash
# Start backend API (http://localhost:5000)
npm run dev:api

# Start frontend web app (http://localhost:5173)
npm run dev:web
```

---

## 🧪 Testing

Run the full automated test suite:
```bash
npm test -w apps/api
```
All **7 test suites** and **59 tests** pass:
- `tests/auth.test.ts` (Authentication, token rotation, account lockout)
- `tests/rbac.test.ts` (Role-based access control and boundary enforcement)
- `tests/security.test.ts` (NoSQL injection, rate limiting, security headers)
- `tests/employee_department.test.ts` (Employee & Department CRUD, manager scoping)
- `tests/attendance_leave_notifications.test.ts` (Attendance tracking, leave workflow, WebSockets)
- `tests/payroll_documents.test.ts` (Payroll computations, magic bytes file validation, signed download tokens)
- `tests/performance_ai_reports.test.ts` (Review lifecycles, Gemini AI summaries & policy assistant, prompt-injection defense, report scoping, announcements, audit logs)

---

## 📦 Production Deployment

For complete end-to-end deployment instructions on Render, Vercel, and MongoDB Atlas, consult:
- 📖 [docs/deployment.md](docs/deployment.md) - Full deployment topology, Render cold-start mitigation, and environment matrix.
- 📖 [docs/mongodb-atlas-setup.md](docs/mongodb-atlas-setup.md) - Manual step-by-step Atlas cluster connection guide.

---

## 👥 Demo Accounts (Development Only)

All demo accounts use password: **`Password123!`**

| Role | Email | Name | Default Access |
| :--- | :--- | :--- | :--- |
| **ADMIN** | `admin@hrx.local` | Alex Vance (CTO) | Full platform admin, audit logs, system config |
| **HR** | `hr@hrx.local` | Elena Rostova (Head of People Ops) | Employee CRUD, Leaves, Payroll, Policies, Announcements |
| **MANAGER** | `manager@hrx.local` | Marcus Sterling (Engineering Lead) | Direct reports, Team approvals, Reviews |
| **EMPLOYEE** | `employee@hrx.local` | Sarah Jenkins (Senior Engineer - EMP-004) | Self-service portal, Leaves, Payslips, AI Assistant |
