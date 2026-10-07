# MASTER BUILD PROMPT FOR ANTIGRAVITY
## HRX - AI-Powered Employee Management & HR Platform

You are acting as a senior staff full-stack engineer, solution architect, security engineer, QA engineer, DevOps engineer, UI/UX engineer, and technical writer. Build a production-quality, deployable, portfolio-grade HR management SaaS-style web application named **HRX**.

This is not a toy CRUD application. Build it as a realistic enterprise-inspired system while keeping the architecture understandable, maintainable, and suitable for a solo developer/student portfolio.

IMPORTANT OPERATING MODE
- Work from the repository/workspace you are given.
- If the repository is empty, scaffold the project from scratch.
- Before making major changes, create and maintain implementation artifacts under `/docs`.
- Use Antigravity planning/artifact/browser capabilities where available.
- Use the terminal to install dependencies, run tests, lint, type-check, build, and perform smoke tests.
- Use the browser to verify the UI and important end-to-end workflows.
- Prefer small, verifiable increments over one giant untested implementation.
- Do not stop at "code generated." The final state must be runnable, tested, documented, and deployable.
- Do not replace working project files unnecessarily.
- Do not introduce unnecessary microservices, Kubernetes, Redis, queues, or complex infrastructure for the MVP.
- If a technical ambiguity occurs, choose the simplest production-sensible option consistent with the architecture below and document the decision.
- Only ask the user a question when you are genuinely blocked by missing credentials, an irreversible product decision, or an external account action that cannot be inferred. Otherwise proceed with sensible defaults.

============================================================
1. PRODUCT VISION
============================================================

Product name:
HRX - AI-Powered Employee Management & HR Platform

One-line description:
A modern role-based HRMS platform that centralizes employee management, attendance, leave, payroll records, documents, performance reviews, notifications, analytics, reporting, and AI-assisted HR workflows.

Primary problem:
Small and medium organizations often manage employee data, attendance, leave, documents, payroll records, and performance information in disconnected spreadsheets, files, email, and manual workflows. HRX centralizes these operations in one secure system with role-based access, real-time notifications, analytics, and AI assistance.

Primary users:
1. ADMIN - platform/company administrator
2. HR - HR operations user
3. MANAGER - team/performance reviewer; optional but recommended for realistic workflows
4. EMPLOYEE - individual employee

If a four-role implementation would create unnecessary complexity, MANAGER permissions may be mapped to HR for MVP. Do not remove the underlying permission model.

============================================================
2. SDLC REQUIREMENT
============================================================

Follow a formal Software Development Life Cycle.

PHASE A - REQUIREMENTS ANALYSIS
Create:
- docs/requirements.md
- docs/use-cases.md
- docs/acceptance-criteria.md
- docs/assumptions.md

Capture:
- functional requirements
- non-functional requirements
- user roles
- business rules
- constraints
- risks
- out-of-scope items
- acceptance criteria

PHASE B - SYSTEM DESIGN
Create:
- docs/architecture.md
- docs/database-schema.md
- docs/api-contract.md
- docs/security-design.md
- docs/ai-design.md
- docs/ui-ux-design.md

Include:
- high-level architecture diagram in Mermaid
- module architecture
- request/response flow
- authentication flow
- authorization flow
- real-time event flow
- AI flow
- file upload flow
- deployment architecture

PHASE C - IMPLEMENTATION
Implement in vertical slices:
1. repository/scaffolding
2. database connection and models
3. authentication
4. roles and permissions
5. employee management
6. dashboard
7. attendance
8. leave management
9. real-time notifications
10. payroll
11. documents
12. performance
13. AI assistant
14. AI performance summaries
15. analytics
16. reports
17. audit logs
18. security hardening
19. deployment configuration

Each slice must:
- compile
- type-check
- pass relevant tests
- be integrated with the existing UI
- update documentation
- not leave fake buttons or dead routes

PHASE D - TESTING
Create:
- docs/test-plan.md
- docs/test-cases.md
- docs/e2e-flows.md

Run:
- unit tests
- API integration tests
- authorization tests
- frontend component tests
- end-to-end smoke tests
- production build
- lint
- type-check

PHASE E - DEPLOYMENT
Create:
- docs/deployment.md
- .env.example files
- deployment configuration
- health endpoint
- production build scripts
- optional GitHub Actions CI

Deploy target:
- frontend: Vercel
- backend: Render Web Service
- database: MongoDB Atlas
- file/media/document storage: Cloudinary
- AI: Google Gemini API through a provider abstraction
- source control: GitHub

PHASE F - OPERATIONS / MAINTENANCE
Create:
- docs/runbook.md
- docs/troubleshooting.md
- docs/changelog.md
- docs/project-status.md

Document:
- local development
- environment variables
- deployment
- rollback strategy
- database backup guidance
- logging
- known limitations
- future roadmap

============================================================
3. DECISIONS ALREADY MADE - DO NOT CHANGE WITHOUT A STRONG REASON
============================================================

Frontend:
- React
- TypeScript
- Vite
- React Router
- Tailwind CSS
- shadcn/ui
- Lucide icons
- TanStack Query
- React Hook Form
- Zod
- Recharts or equivalent chart library

Backend:
- Node.js 24 LTS
- TypeScript
- Express 5
- Mongoose
- Zod
- JWT
- bcrypt or bcryptjs
- Helmet
- CORS
- express-rate-limit
- pino or another structured logger
- Socket.IO

Database:
- MongoDB Atlas

File storage:
- Cloudinary
- Use private/authenticated assets and signed access for sensitive documents where supported.
- Never store large uploaded files directly inside MongoDB documents.

AI:
- Google Gemini API using the official Google GenAI JavaScript SDK.
- Put all AI access behind `aiService` / provider abstraction so another provider can be substituted later.
- Never expose the AI API key to React/browser code.
- Use structured output with Zod/JSON schema where deterministic JSON is needed.

Testing:
- Vitest
- React Testing Library
- Supertest
- Playwright for end-to-end/browser tests

Tooling:
- ESLint
- Prettier
- npm workspaces unless there is a strong reason to use another package manager
- Git/GitHub
- GitHub Actions for CI where practical

Deployment:
- Vercel for React frontend
- Render for Node/Express backend
- MongoDB Atlas for production database
- Cloudinary for files
- Gemini API for AI

Architecture:
- modular monorepo
- REST API
- real-time Socket.IO
- no microservices in MVP
- no Redux unless truly needed; prefer TanStack Query + local state/context
- no Redis in MVP
- no Kubernetes
- no Docker dependency for local development unless it materially improves reproducibility

============================================================
4. REPOSITORY STRUCTURE
============================================================

Use a clean monorepo:

/
├── apps/
│   ├── web/
│   └── api/
├── packages/
│   └── shared/
├── docs/
├── .github/
│   └── workflows/
├── .env.example
├── package.json
├── README.md
├── .gitignore
└── LICENSE

Frontend:
apps/web/
├── src/
│   ├── app/
│   ├── assets/
│   ├── components/
│   ├── features/
│   │   ├── auth/
│   │   ├── dashboard/
│   │   ├── employees/
│   │   ├── attendance/
│   │   ├── leave/
│   │   ├── payroll/
│   │   ├── documents/
│   │   ├── performance/
│   │   ├── notifications/
│   │   ├── reports/
│   │   └── ai/
│   ├── hooks/
│   ├── lib/
│   ├── layouts/
│   ├── pages/
│   ├── routes/
│   ├── services/
│   ├── stores/
│   ├── types/
│   └── main.tsx
├── public/
├── tests/
├── index.html
├── package.json
└── vite.config.ts

Backend:
apps/api/
├── src/
│   ├── config/
│   ├── middleware/
│   ├── models/
│   ├── modules/
│   │   ├── auth/
│   │   ├── users/
│   │   ├── employees/
│   │   ├── departments/
│   │   ├── attendance/
│   │   ├── leave/
│   │   ├── payroll/
│   │   ├── documents/
│   │   ├── performance/
│   │   ├── notifications/
│   │   ├── reports/
│   │   ├── audit/
│   │   └── ai/
│   ├── sockets/
│   ├── services/
│   ├── utils/
│   ├── app.ts
│   └── server.ts
├── tests/
├── package.json
└── tsconfig.json

Shared:
packages/shared/
├── src/
│   ├── schemas/
│   ├── constants/
│   ├── types/
│   └── index.ts
└── package.json

============================================================
5. UI / UX REQUIREMENTS
============================================================

Design language:
- premium enterprise SaaS
- dark-first, high-contrast, modern
- subtle gradients
- restrained glass effects
- clean typography
- professional data visualization
- not gaming-style
- use 3D only as subtle decorative accents in hero/login/dashboard areas, never behind important business data
- responsive for desktop/tablet/mobile
- accessible keyboard navigation
- visible focus states
- meaningful empty/loading/error states
- skeleton loaders instead of blank screens
- toast notifications for actions
- confirmation dialogs for destructive actions

Core shell:
- collapsible left sidebar
- top bar
- company/product logo area
- notification center
- profile menu
- breadcrumb/page title
- command/search experience where useful
- responsive mobile navigation

Theme:
- dark default
- optional light mode
- store theme preference locally
- maintain AA-level contrast for important text and controls

UX principles:
- minimize clicks for common HR workflows
- tables should support search/filter/sort/pagination
- forms should show validation close to fields
- never lose unsaved input silently
- optimistic UI only when rollback behavior is safe
- destructive actions require confirmation
- role-based navigation must match backend authorization
- never rely on frontend hiding alone for security

============================================================
6. CORE FUNCTIONAL MODULES
============================================================

6.1 AUTHENTICATION
Implement:
- registration only for admin-created employees OR controlled admin/HR user creation
- login
- logout
- refresh session
- current-user endpoint
- optional forgot/reset password architecture
- account activation/deactivation
- password hashing
- role assignment

Preferred token architecture:
- short-lived JWT access token
- refresh token in HttpOnly secure cookie
- do not store long-lived JWTs in localStorage
- keep access token in memory where practical
- implement refresh flow
- invalidate refresh sessions on logout/revocation

6.2 AUTHORIZATION / RBAC
Roles:
- ADMIN
- HR
- MANAGER
- EMPLOYEE

Permission examples:
ADMIN:
- full platform configuration
- users
- employees
- departments
- audit logs
- reports
- payroll
- all HR functions

HR:
- employee CRUD except protected admin actions
- attendance
- leave approval
- documents
- payroll records
- performance workflows
- reports
- notifications

MANAGER:
- own team
- attendance visibility for team
- leave review for team if configured
- performance reviews
- team analytics

EMPLOYEE:
- own profile
- own attendance
- own leave
- own payroll/payslips
- own documents
- own performance
- notifications
- AI assistant

Backend authorization is mandatory.

6.3 EMPLOYEE MANAGEMENT
Implement:
- employee creation
- employee profile
- employee code generation
- contact information
- department
- position
- manager
- joining date
- employment status
- emergency contact
- profile picture
- search
- filtering
- sorting
- pagination
- view/edit/delete/deactivate
- bulk import architecture (optional phase)
- employee detail tabs

6.4 DEPARTMENTS
Implement:
- create department
- edit
- deactivate
- department head
- employee count
- department analytics

6.5 ATTENDANCE
MVP:
- check-in
- check-out
- attendance history
- daily status
- working hours
- monthly summary
- admin/HR view
- employee own view

Business rules:
- one attendance record per employee per workday
- cannot check out before check in
- prevent duplicate check-in
- calculate working duration server-side
- handle timezone consistently
- store timestamps in UTC; display in configured organization timezone
- configurable late threshold
- future extension for QR/location/biometric attendance

6.6 LEAVE
Implement:
- leave types
- employee leave balance
- apply leave
- date validation
- overlapping leave prevention
- pending/approved/rejected/cancelled states
- HR/manager approval
- leave balance deduction only after approval
- leave history
- notifications
- calendar view

6.7 PAYROLL
This is a management/demo payroll module unless full statutory payroll rules are explicitly implemented.

Implement:
- salary structure
- basic salary
- HRA
- allowances
- deductions
- gross salary
- net salary
- payroll month/year
- salary history
- payslip generation
- access control
- payroll dashboard

Do not hardcode Indian tax/PF/ESI rules as "complete" unless verified and explicitly implemented.

6.8 DOCUMENTS
Implement:
- categories
- upload
- list
- preview where safe
- download
- delete
- document metadata
- uploader
- timestamps
- access control
- private/signed URLs

Security:
- file type whitelist
- max file size
- MIME validation
- filename sanitization
- never trust client-provided MIME type alone
- prevent unauthorized document access
- avoid exposing Cloudinary secret/config to frontend

6.9 PERFORMANCE MANAGEMENT
Implement:
- review cycles
- reviewer
- rating categories
- comments
- goals
- strengths
- improvement areas
- overall rating
- review history
- employee view
- manager/HR view
- AI summary generation

6.10 NOTIFICATIONS
Implement:
- notification persistence
- unread count
- mark read
- mark all read
- in-app toast
- real-time socket notification
- notification center
- event-driven notification service

Events:
- leave submitted
- leave approved
- leave rejected
- document uploaded
- performance review created
- salary/payslip available
- admin announcement

6.11 REPORTS
Generate:
- employee report
- attendance report
- leave report
- payroll report
- performance report

Export:
- CSV
- XLSX
- PDF

Respect role permissions in every report.

6.12 ANALYTICS
Admin/HR dashboards:
- total employees
- active/inactive employees
- department distribution
- attendance rate
- leave trends
- payroll summary
- performance distribution
- recent activity

Employee dashboard:
- attendance
- leave balance
- salary/payslip
- upcoming leave
- recent notifications
- performance summary

Manager dashboard:
- team size
- team attendance
- pending team leave
- performance distribution
- upcoming reviews

============================================================
7. AI REQUIREMENTS
============================================================

AI must be useful, bounded, auditable, and optional.

7.1 AI HR ASSISTANT
Use Gemini API behind the backend.

Capabilities:
- answer HR policy questions
- explain leave rules from approved company policy content
- explain general platform workflows
- answer questions about the employee's own non-sensitive app data only when explicitly authorized and needed
- provide concise links/references to policy documents where possible

Important:
- do not invent company policy
- if the answer is not supported by company policy/context, say that the information is unavailable and direct the user to HR
- do not expose another employee's confidential information
- do not let prompt injection override role permissions
- do not use AI as the source of truth for authorization or payroll calculations

7.2 AI PERFORMANCE SUMMARY
Input:
- structured performance review data
- manager comments
- rating categories
- attendance/trend data only when policy permits

Output:
- summary
- strengths
- development areas
- suggested next steps
- confidence/notes if applicable

Use structured JSON output validated with Zod.

AI output must be advisory and reviewable by HR/manager.

7.3 AI SERVICE
Create:
- provider interface
- Gemini provider
- prompt templates
- schema validators
- timeout handling
- retries with bounded backoff
- safe error messages
- token/input limits
- logging without sensitive prompt leakage

Do not send passwords, access tokens, secrets, or unnecessary private employee data to the model.

============================================================
8. DATABASE DESIGN
============================================================

Create Mongoose models for at minimum:

User
Employee
Department
Attendance
LeaveType
LeaveRequest
LeaveBalance
Payroll
Document
PerformanceReview
Notification
AuditLog
AiConversation
AiMessage
RefreshSession

Preferred relationships:
- User -> Employee
- Employee -> Department
- Employee -> Manager/User
- Attendance -> Employee
- LeaveRequest -> Employee
- LeaveRequest -> Approver
- Payroll -> Employee
- Document -> Employee
- PerformanceReview -> Employee + Reviewer
- Notification -> User
- AuditLog -> User
- AiConversation -> User
- AiMessage -> AiConversation
- RefreshSession -> User

Data modeling rules:
- use ObjectId references where appropriate
- use indexes for high-use filters/searches
- unique indexes for employeeCode and user email where appropriate
- compound indexes for attendance and leave queries
- timestamps on important entities
- soft-delete/deactivate where appropriate instead of hard delete for HR records
- avoid over-normalization
- never store secrets in documents
- never store plaintext passwords

Recommended indexes:
- users.email
- employees.employeeCode
- employees.email
- employees.departmentId
- employees.status
- attendance.employeeId + date
- leaveRequests.employeeId + startDate
- leaveRequests.status
- payroll.employeeId + year + month
- notifications.userId + isRead + createdAt
- auditLogs.userId + createdAt

============================================================
9. API DESIGN
============================================================

Base prefix:
`/api/v1`

Authentication:
POST /auth/login
POST /auth/logout
POST /auth/refresh
GET  /auth/me
POST /auth/forgot-password
POST /auth/reset-password

Users:
GET /users
GET /users/:id
POST /users
PATCH /users/:id
PATCH /users/:id/status

Employees:
GET /employees
POST /employees
GET /employees/:id
PATCH /employees/:id
DELETE /employees/:id
GET /employees/:id/summary

Departments:
GET /departments
POST /departments
PATCH /departments/:id
DELETE /departments/:id

Attendance:
POST /attendance/check-in
POST /attendance/check-out
GET /attendance/me
GET /attendance
GET /attendance/summary

Leave:
GET /leave-types
POST /leave-types
GET /leave-balances/me
GET /leave-balances/:employeeId
POST /leaves
GET /leaves
GET /leaves/:id
PATCH /leaves/:id/approve
PATCH /leaves/:id/reject
PATCH /leaves/:id/cancel

Payroll:
GET /payroll/me
GET /payroll
POST /payroll
PATCH /payroll/:id
GET /payroll/:id/payslip

Documents:
POST /documents
GET /documents
GET /documents/:id
DELETE /documents/:id
GET /documents/:id/download-url

Performance:
GET /performance
POST /performance
GET /performance/:id
PATCH /performance/:id
POST /performance/:id/ai-summary

Notifications:
GET /notifications
PATCH /notifications/:id/read
PATCH /notifications/read-all

Reports:
GET /reports/employees
GET /reports/attendance
GET /reports/leaves
GET /reports/payroll
GET /reports/performance

AI:
POST /ai/chat
POST /ai/performance-summary
GET /ai/conversations
GET /ai/conversations/:id

Admin:
GET /admin/analytics
GET /admin/audit-logs

Health:
GET /health
GET /ready

Rules:
- all protected endpoints require auth
- sensitive endpoints require role/permission
- validate every body/query/path param with Zod
- return consistent API response format
- never leak stack traces in production
- use proper HTTP status codes
- support pagination for list endpoints
- support filtering/sorting only through allowlisted fields

Suggested response envelope:
{
  "success": true,
  "data": {},
  "message": "..."
}

Error envelope:
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Human-readable message",
    "details": []
  }
}

============================================================
10. SECURITY DESIGN
============================================================

Mandatory:
- bcrypt password hashing
- JWT access tokens
- refresh token rotation/revocation
- HttpOnly secure refresh cookie
- no secrets in source code
- `.env` files ignored
- Zod validation
- Helmet
- CORS allowlist
- rate limiting
- request size limits
- secure HTTP headers
- safe error handling
- authorization middleware
- audit logging
- sensitive endpoint logging
- file validation
- signed/private document access

Threats to defend:
- broken access control / IDOR
- credential stuffing
- brute force
- XSS
- CSRF in refresh/session endpoints where relevant
- malicious file upload
- prompt injection
- data leakage through AI
- insecure direct object references
- excessive API querying
- mass assignment
- prototype pollution from untrusted input
- NoSQL injection through unvalidated query operators
- exposed API keys

Important:
- Never trust user-provided `employeeId`, `userId`, or document id without permission checks.
- Never allow employees to access another employee's payroll/document/performance data.
- Backend is authoritative for authorization.
- Frontend route guards are UX only.

============================================================
11. ATTENDANCE / TIME RULES
============================================================

Use UTC for database timestamps.
Use an organization timezone configuration for display/calculation.
Do not use browser-local time as the source of truth.

MVP rules:
- one active attendance record per employee per workday
- check-in creates a record
- check-out updates the record
- calculate duration on backend
- invalid time transitions are rejected
- leave/holiday/workday interactions must be documented
- avoid false precision in attendance metrics

============================================================
12. REAL-TIME / SOCKET.IO
============================================================

Use a real HTTP server and attach Socket.IO to it.

Authentication:
- authenticate socket connections
- associate socket with user id and roles
- use rooms by user id and, when needed, department/team

Events:
server -> client:
notification:new
notification:read
leave:status-updated
performance:review-created
announcement:new

client -> server only where needed:
notification:mark-read
presence:update
chat:send

Do not allow arbitrary client-side event emission to change HR state without REST/API authorization.

Implement reconnect behavior and graceful connection handling.

============================================================
13. FILE / DOCUMENT HANDLING
============================================================

Use Cloudinary or equivalent external object/file storage.

Flow:
React selects file
-> validate file size/type client-side
-> backend validates again
-> upload securely
-> save metadata + asset id/url
-> issue signed/private access
-> audit upload/download/delete

Allowed categories:
- profile_image
- identity
- offer_letter
- payslip
- resume
- certificate
- performance_attachment
- other_hr_document

Set reasonable max file sizes.
Reject executable/script formats.
Sanitize names.
Do not trust extensions alone.

============================================================
14. REPORTING
============================================================

Provide:
- date range filters
- employee/department filters
- export buttons
- loading/progress state
- server-side report generation
- consistent column names

CSV:
- simple, universal fallback

XLSX:
- formatted sheets
- title row
- filters where practical
- date/currency formatting

PDF:
- company/product header
- report title
- date range
- generated timestamp
- tabular data
- footer/page numbers

============================================================
15. ERROR HANDLING / OBSERVABILITY
============================================================

Implement:
- centralized error middleware
- typed application errors
- request id/correlation id where practical
- structured logs
- log levels
- do not log passwords/tokens
- production-safe error messages
- `/health`
- `/ready`

Frontend:
- global error boundary
- API error normalization
- retry only idempotent/read requests
- offline/network error UI
- empty states
- permission denied UI
- session-expired handling

============================================================
16. TESTING STRATEGY
============================================================

Unit:
- leave calculations
- payroll calculations
- attendance duration
- permission checks
- validation schemas
- AI response parsing

Integration:
- auth login/refresh/logout
- employee CRUD with role restrictions
- leave lifecycle
- attendance lifecycle
- payroll access control
- document access control
- notification persistence

E2E:
1. Admin login
2. Create department
3. Create employee
4. Employee login
5. Employee check-in
6. Employee applies leave
7. HR login
8. HR approves leave
9. Employee receives real-time notification
10. HR creates performance review
11. AI generates summary
12. Employee views review
13. Export report
14. Logout

Negative/security tests:
- employee cannot access admin endpoint
- employee cannot access another employee's payroll
- unauthenticated request returns 401
- invalid token is rejected
- invalid role returns 403
- duplicate attendance check-in rejected
- overlapping leave rejected
- malicious file blocked
- invalid ObjectId handled safely
- oversized request rejected
- AI prompt injection test does not bypass authorization

Coverage target:
- meaningful coverage on core business logic
- do not chase a meaningless 100% line coverage number
- all critical authorization paths must be tested

============================================================
17. SEED DATA
============================================================

Create a safe development seed script.

Demo roles:
admin@hrx.local
hr@hrx.local
manager@hrx.local
employee@hrx.local

Use obvious development-only passwords documented in `.env.example` or seed docs, and force password change on first login if the implementation supports it.

Create:
- 4 roles/users
- 5-10 departments/employees
- sample attendance
- sample leave balances
- sample leave requests
- sample payroll records
- sample documents with placeholder assets if actual uploads are unavailable
- sample performance reviews
- notifications

Never seed production secrets.

============================================================
18. FRONTEND ROUTING
============================================================

Public:
/
/login

Protected:
 /dashboard
 /employees
 /employees/:id
 /attendance
 /leave
 /payroll
 /documents
 /performance
 /notifications
 /reports
 /ai-assistant
 /settings

Admin:
 /admin/users
 /admin/departments
 /admin/audit-logs
 /admin/system

Manager:
 /team
 /team/performance

Use route-level authorization based on permissions.

Do not duplicate authorization logic manually in every page; centralize it.

============================================================
19. PERFORMANCE REQUIREMENTS
============================================================

Frontend:
- code splitting for major routes
- lazy load heavy report/AI pages
- memoize only where useful
- avoid unnecessary global state
- paginate large tables
- debounce search
- use TanStack Query caching
- use optimized images

Backend:
- pagination
- allowlisted query filters
- indexes
- avoid N+1 queries where possible
- lean Mongoose queries when appropriate
- projection of fields where possible
- bounded payload sizes

AI:
- do not send huge documents unnecessarily
- truncate/summarize context before model call
- enforce token/input limits
- use structured output where useful
- keep AI endpoints rate-limited

============================================================
20. DEPLOYMENT ARCHITECTURE
============================================================

Development:
- local React app
- local Express API
- MongoDB Atlas development database or local MongoDB

Production:
Browser
  -> Vercel frontend
  -> Render API
  -> MongoDB Atlas
  -> Cloudinary
  -> Gemini API

Frontend environment variables:
VITE_API_BASE_URL
VITE_SOCKET_URL
VITE_APP_NAME

Backend environment variables:
NODE_ENV
PORT
MONGODB_URI
JWT_ACCESS_SECRET
JWT_REFRESH_SECRET
JWT_ACCESS_EXPIRES_IN
JWT_REFRESH_EXPIRES_IN
CLIENT_URL
CORS_ORIGINS
GEMINI_API_KEY
GEMINI_MODEL
CLOUDINARY_CLOUD_NAME
CLOUDINARY_API_KEY
CLOUDINARY_API_SECRET
CLOUDINARY_FOLDER
COOKIE_DOMAIN if needed
LOG_LEVEL

Do not hardcode these values.

Render:
- build command appropriate to workspace
- start command for compiled API
- configure environment variables
- health check `/health`
- use public secure WebSocket endpoint for Socket.IO
- production `NODE_ENV=production`

Vercel:
- build React app
- configure SPA deep-link rewrite
- set `VITE_API_BASE_URL`
- set `VITE_SOCKET_URL`
- preview deployments for branches/pull requests

MongoDB Atlas:
- create dedicated application database user
- restrict network access appropriately
- use TLS connection string
- enable backups appropriate to tier
- never use a broad/unrestricted production credential if avoidable

Cloudinary:
- configure secure delivery
- private/authenticated assets for sensitive documents
- keep API secret server-side

CI:
- install
- lint
- typecheck
- test
- build
- optionally run API integration tests against a test database

============================================================
21. LOCAL DEVELOPMENT COMMANDS
============================================================

Root commands should be simple:

npm install
npm run dev
npm run build
npm run lint
npm run typecheck
npm test
npm run test:e2e

Where necessary provide workspace commands:
npm run dev -w apps/web
npm run dev -w apps/api

Document exact commands after implementation.

============================================================
22. README REQUIREMENTS
============================================================

README must contain:
- project overview
- problem statement
- features
- architecture
- tech stack
- folder structure
- screenshots section placeholder
- local setup
- environment variables
- seed data
- test instructions
- deployment
- API overview
- security notes
- AI notes
- future enhancements
- portfolio/resume description

============================================================
23. DOCUMENTATION ARTIFACTS
============================================================

At minimum create:
docs/README.md
docs/requirements.md
docs/use-cases.md
docs/architecture.md
docs/database-schema.md
docs/api-contract.md
docs/security-design.md
docs/ai-design.md
docs/ui-ux-design.md
docs/test-plan.md
docs/test-cases.md
docs/e2e-flows.md
docs/deployment.md
docs/runbook.md
docs/troubleshooting.md
docs/project-status.md
docs/changelog.md

Every major module should have:
- purpose
- data
- API endpoints
- permissions
- edge cases
- tests

============================================================
24. GIT / VERSION CONTROL
============================================================

Create clean commits by logical phase.

Suggested commit sequence:
chore: initialize monorepo
feat: add backend foundation
feat: add authentication and RBAC
feat: add employee management
feat: add attendance
feat: add leave management
feat: add realtime notifications
feat: add payroll
feat: add documents
feat: add performance management
feat: add AI assistant
feat: add analytics and reports
test: expand integration and e2e coverage
chore: production deployment configuration
docs: finalize project documentation

Never commit:
.env
credentials
private certificates
node_modules
build artifacts that do not belong in source
real employee data

============================================================
25. ACCEPTANCE CRITERIA
============================================================

The project is complete only when:

A. Architecture
- monorepo is organized
- TypeScript compiles
- modules are clearly separated
- shared validation/types work

B. Authentication
- login works
- logout works
- refresh works
- protected routes work
- unauthorized access is rejected

C. RBAC
- all four roles are enforced on backend
- employee data access is scoped correctly
- frontend navigation reflects permissions

D. HR features
- employee CRUD works
- attendance works
- leave lifecycle works
- payroll records work
- documents work
- performance reviews work

E. Real-time
- notifications persist
- notifications appear live
- reconnection is handled

F. AI
- AI assistant works through backend
- AI performance summary works
- structured output is validated
- no API key is exposed
- AI cannot bypass authorization

G. Reports
- CSV/XLSX/PDF work
- filters/permissions work

H. Quality
- lint passes
- typecheck passes
- tests pass
- production build passes
- no major console errors
- no obvious accessibility failures
- browser smoke test passes

I. Deployment
- frontend deploys
- backend deploys
- database connects
- file uploads work
- AI works with configured key
- Socket.IO works over secure connection
- environment variables documented
- health endpoint is available

J. Documentation
- README complete
- architecture documented
- setup documented
- deployment documented
- test plan documented
- known limitations documented

============================================================
26. IMPLEMENTATION STRATEGY FOR ANTIGRAVITY
============================================================

Do NOT attempt all files/features in one unverified action.

Use this exact execution sequence:

STEP 0 - AUDIT
- inspect workspace
- inspect existing files
- determine whether repo is empty or partially built
- do not overwrite valuable user work

STEP 1 - PLAN
Create implementation artifacts and architecture.
Show a concise plan artifact.

STEP 2 - SCAFFOLD
Create monorepo and toolchain.
Install dependencies.
Verify dev server for frontend and backend.

STEP 3 - DATABASE
Create MongoDB connection, models, indexes, seed script.
Verify with database health check.

STEP 4 - AUTH
Implement auth and RBAC.
Add tests before moving to HR modules.

STEP 5 - EMPLOYEES
Implement employee module vertically end-to-end.

STEP 6 - DASHBOARDS
Create role-aware dashboards.

STEP 7 - ATTENDANCE + LEAVE
Implement business rules and notifications.

STEP 8 - REAL-TIME
Add Socket.IO and verify browser notification flow.

STEP 9 - PAYROLL + DOCUMENTS
Implement access control and export/download behavior.

STEP 10 - PERFORMANCE
Implement reviews and AI summary endpoint.

STEP 11 - AI
Implement HR assistant and safety controls.

STEP 12 - REPORTS + ANALYTICS
Add charts and exports.

STEP 13 - HARDENING
Security headers, rate limits, validation, audit logs, safe errors.

STEP 14 - TESTING
Run unit + integration + e2e + build.
Fix all failures.

STEP 15 - DEPLOYMENT
Prepare Vercel + Render + Atlas + Cloudinary + Gemini configuration.

STEP 16 - FINAL VERIFICATION
Use browser-based smoke tests on production deployment if credentials/URLs are available.
Update docs/project-status.md.
Create final CHANGELOG entry.

============================================================
27. DEFINITION OF DONE
============================================================

Before declaring completion:
1. `npm install` works from a clean clone.
2. Local development works.
3. TypeScript has no errors.
4. Lint has no blocking errors.
5. Tests pass.
6. Production build passes.
7. Seed data works.
8. Main user journeys work in browser.
9. No critical authorization flaw remains.
10. No secret is committed.
11. Deployment configuration is present.
12. README and docs are accurate.
13. Known limitations are documented.
14. Final status artifact states exactly what is complete and what remains.

============================================================
28. WHAT NOT TO DO
============================================================

- Do not expose secrets in frontend code.
- Do not put business logic entirely in controllers.
- Do not use giant monolithic files.
- Do not rely on frontend authorization.
- Do not store passwords in plaintext.
- Do not trust client-side salary/attendance/leave calculations.
- Do not allow AI to make employment decisions automatically.
- Do not fabricate payroll/tax compliance.
- Do not use fake API responses in production paths.
- Do not leave broken placeholder buttons.
- Do not use localStorage for long-lived authentication secrets.
- Do not commit `.env`.
- Do not over-engineer with microservices.
- Do not use a database with unrestricted public access in production.
- Do not allow an employee to access another employee's sensitive data.

============================================================
29. FINAL OUTPUT FROM THE AGENT
============================================================

At the end, produce a final artifact called:
`docs/project-status.md`

It must contain:
- project summary
- implemented features
- tech stack
- architecture summary
- test results
- deployment status
- production URLs if available
- environment variables required
- known limitations
- future roadmap
- exact next steps for a human developer

Also provide:
- final folder tree
- setup commands
- deployment commands/steps
- test commands
- seeded demo credentials for DEVELOPMENT ONLY
- any manual account configuration still required

Remember: the goal is a real, polished, deployable HR management platform that demonstrates advanced full-stack engineering, not just a collection of screens.
