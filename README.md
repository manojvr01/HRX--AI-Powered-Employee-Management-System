# HRX - Enterprise-Grade AI-Powered Employee Management & HR Platform

HRX is a role-based HRMS platform designed to centralize employee management, departments, attendance, leave, payroll records, performance reviews, notifications, and AI-assisted HR workflows.

---

## 🛠️ Tech Stack

- **Monorepo**: npm workspaces (`packages/*`, `apps/*`)
- **Shared Package**: TypeScript, Zod schemas, RBAC permission map, bundled with `tsup`
- **Backend API**: Node.js, Express, TypeScript, Mongoose (MongoDB), Pino structured logging, Helmet, CORS, Cookie-parser, Bcryptjs, JWT
- **Frontend Web**: React 18, Vite, TypeScript, Tailwind CSS, Lucide icons, React Router
- **Testing**: Vitest, Supertest

---

## 🚀 Getting Started

### 1. Prerequisites
- Node.js >= 20.x
- MongoDB running locally on port 27017 or a MongoDB Atlas URI

### 2. Install Dependencies
```bash
npm install
```

### 3. Build Shared Package
```bash
npm run build:shared
```

### 4. Seed Database
The seed script populates demo organizations, departments, users, and leave balances:
```bash
npm run seed
```

### 5. Start Development Servers
In separate terminals or concurrent scripts:
```bash
# Start backend API (http://localhost:5000)
npm run dev:api

# Start web frontend (http://localhost:5173)
npm run dev:web
```

---

## 🧪 Testing

Run the automated integration and unit test suite (25/25 tests):
```bash
npm test
```

### Test Coverage Highlights
- Full authentication lifecycle (`login`, `me`, `refresh`, `logout`)
- Refresh token rotation & token reuse detection family revocation
- 5-attempt account lockout protection
- RBAC permission map & role boundaries
- Scoping tests: Managers see only direct reports; Employees cannot access others
- HR cannot modify or deactivate ADMIN accounts
- NoSQL injection query operator blocker (`$gt`, etc.)
- Strict ObjectId validation
- Safe seed script refusal in `NODE_ENV === 'production'`
- Allowlist enforcement for table sorting & pagination

---

## 👥 Demo Accounts (Development Only)

Default password for all accounts: **`Password123!`**

| Role | Email | Name | Default Access |
| :--- | :--- | :--- | :--- |
| **ADMIN** | `admin@hrx.local` | Alex Vance | Full system configuration & management |
| **HR** | `hr@hrx.local` | Elena Rostova | Employee & Department CRUD, Leaves, Payroll |
| **MANAGER** | `manager@hrx.local` | Marcus Sterling | Scoped Team Directory & Direct Reports |
| **EMPLOYEE** | `employee@hrx.local` | Sarah Connor | Self-service portal & Leave balances |
