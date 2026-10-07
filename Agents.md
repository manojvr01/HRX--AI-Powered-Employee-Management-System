1.1 Role and operating mode
You are a senior full-stack engineer building HRX, a role-based HR management web app, for a solo developer's portfolio. It should feel realistic but stay understandable and maintainable.
• Work in the given workspace. Audit existing files first. Never overwrite working user code unnecessarily.
• Work in small verifiable increments. After each slice run lint, typecheck, tests, and (for UI) a browser check. Fix failures before moving on.
• Use the terminal for install, test and build. Use the browser to verify UI flows.
• No microservices, Kubernetes, Redis, or queues.
• When something is ambiguous, choose the simplest production-sensible option and log it as one line in docs/decisions.md (decision, reason).
• Ask the user only if blocked by missing credentials, an irreversible product decision, or an external account action.
• Before installing or using these, check current official docs for versions, setup and API shape: Node, Express 5, Mongoose, Vite, Tailwind, shadcn/ui, Socket.IO, Cloudinary SDK, @google/genai. Do not rely on memory for APIs or model names.
• Never claim something works unless you ran it. docs/project-status.md must state what was actually verified and what was not.
1.2 Product
HRX centralizes employee records, attendance, leave, payroll records (demo-grade), documents, performance reviews, notifications, analytics, reports, and bounded AI assistance. Roles: ADMIN, HR, MANAGER, EMPLOYEE.
1.3 Locked stack (do not change without a strong reason)
• Frontend: React, TypeScript, Vite, React Router, Tailwind CSS, shadcn/ui, Lucide, TanStack Query, React Hook Form, Zod, Recharts.
• Backend: Node.js 24 LTS, TypeScript, Express 5, Mongoose, Zod, JWT, bcrypt/bcryptjs, Helmet, CORS, express-rate-limit, pino, Socket.IO.
• Data and services: MongoDB Atlas, Cloudinary (private/authenticated assets), Google Gemini via the official GenAI JS SDK behind an aiService provider interface.
• Testing and tooling: Vitest, React Testing Library, Supertest, mongodb-memory-server (integration tests), Playwright, ESLint, Prettier, npm workspaces, GitHub Actions.
• Deploy: Vercel (web), Render (API), Atlas, Cloudinary, Gemini.
• No Redux (TanStack Query plus local state/context). No Docker requirement for local dev.
1.4 Repository structure
/
├── apps/web/   (src/{app,components,features/*,hooks,lib,layouts,pages,routes,services,types})
├── apps/api/   (src/{config,middleware,models,modules/*,sockets,services,utils,app.ts,server.ts})
├── packages/shared/  (src/{schemas,constants,types,permissions})
├── docs/
├── .github/workflows/
├── .env.example
└── package.json, README.md, LICENSE, AGENTS.md
Feature/module folders: auth, users, employees, departments, attendance, leave, payroll, documents, performance, notifications, reports, audit, ai, dashboard.
packages/shared is built with tsc to dist and consumed by both apps as the workspace dependency @hrx/shared (dev runs tsc -w). Do not use ad-hoc path aliases into its source.
Business logic lives in services, not controllers. No giant files.
1.5 Roles and permissions (resolved)
All four roles are fully enforced. MANAGER is scoped to direct reports (employees whose managerId is the manager's employee record).
• One permission map in packages/shared (role to permission list).
• One authorize(permission) middleware.
• One scoping helper per resource that returns a Mongo filter for the caller. Never hand-write ownership checks inside controllers.
• Frontend route guards read the same map. They are UX only; the backend is authoritative.
Resource
ADMIN
HR
MANAGER
EMPLOYEE
Users and roles
Full
Create/deactivate non-admin users
None
None
Employees
Full
Full CRUD (cannot modify ADMIN accounts)
Read direct reports
Read own, edit limited own fields
Departments
Manage
Manage
Read
Read
Attendance
All
All
Read team
Own check-in/out and history
Leave
All, approve
All, approve
Approve/reject direct reports
Own apply/cancel/history
Payroll
All
All
None
Own read
Documents
All
All
Own only
Own, limited upload categories
Performance
All
All
Create/view direct reports' reviews
Own finalized reviews
Reports
All
All
Team attendance, leave, performance
None
Audit logs, settings
Full
None
None
None
Policies
Manage
Manage
Read
Read
AI assistant
Yes
Yes
Yes
Yes (answers limited to caller's permissions)
1.6 Data model
Models: User, Employee, Department, Attendance, LeaveType, LeaveRequest, LeaveBalance, Payroll, Document, PerformanceReview, Notification, AuditLog, RefreshSession, AiConversation, AiMessage, Policy, Announcement, Holiday, OrgSettings.
• ObjectId references, timestamps on important entities, soft-delete/deactivate for HR records.
• Never store secrets or plaintext passwords.
• Unique indexes: users.email, employees.employeeCode, employees.email, attendance(employeeId, workDate), payroll(employeeId, year, month), leaveBalances(employeeId, leaveTypeId, year).
• Query indexes: employees.departmentId, employees.status, employees.managerId, leaveRequests(employeeId, startDate), leaveRequests.status, notifications(userId, isRead, createdAt), auditLogs(userId, createdAt).
• Concurrency: unique indexes enforce one attendance record per day and one payroll record per month. Leave balance deduction on approval uses an atomic conditional update (balance must be sufficient) and a transaction where available. Re-check overlap at approval time, not just at submission.
1.7 Time and calendar rules
• Store UTC timestamps. OrgSettings.timezone defaults to Asia/Kolkata.
• Each attendance record also stores workDate as the org-local calendar date (YYYY-MM-DD).
• Duration, lateness and working days are computed server-side only. Never trust browser time.
• OrgSettings holds late threshold, work week and standard hours. Holiday holds holidays.
• Leave day counts exclude weekends and holidays. Check-in on a holiday or approved leave day is allowed but flagged.
• Cannot check out before check-in. Duplicate check-in is rejected.
1.8 Auth and session (resolved)
• Access token: short-lived JWT (15 min), held in memory on the client.
• Refresh token: opaque random value, stored hashed in RefreshSession, sent as an HttpOnly Secure cookie. Rotate on every refresh. Detect reuse: a reused token revokes that whole session family. Revoke on logout, deactivation and password change.
• Cross-domain cookies: the frontend is on Vercel and the API on Render, so a naive cookie becomes third-party and breaks in Safari/Chrome. Resolve it with vercel.json rewrites that proxy /api/* to the Render API, so the browser sees one origin and the cookie is first-party. In production VITE_API_BASE_URL=/api/v1. Document the fallbacks: a custom domain with subdomains, or SameSite=None; Secure with a clear limitation note.
• Socket.IO connects directly to Render (VITE_SOCKET_URL) and authenticates with the access token in the handshake auth field (no cookie needed). Reconnect with a fresh token after refresh.
• CSRF: refresh and logout require a custom header plus a strict CORS allowlist.
• Login is rate-limited with progressive lockout per account and IP.
• No public registration. ADMIN/HR create users with a temporary password and mustChangePassword.
1.9 Security rules
• Zod-validate every body, query and path param. Reject unexpected keys (no mass assignment). Reject $-prefixed or dotted keys in query input. Validate every ObjectId.
• Never trust client-supplied employeeId, userId or document id. Always apply the scoping helper.
• Helmet, CORS allowlist, rate limits (stricter on auth and AI), request size limits, safe error messages with no stack traces in production, request ids in logs, no passwords or tokens in logs.
• Audit-log sensitive actions: login, role changes, payroll changes, document upload/download/delete, leave decisions, report exports.
• Files: extension and MIME allowlist plus magic-byte check, size limits, sanitized names, no executable or script types, private/authenticated Cloudinary assets with short-lived signed URLs. Check Cloudinary account delivery restrictions for PDFs before relying on them.
• Seed script must refuse to run when NODE_ENV=production. Seed passwords are dev-only and documented.
• No secrets in source. .env is gitignored. .env.example lists every variable.
1.10 API conventions
• Prefix /api/v1. Envelope: { success, data, message } and { success: false, error: { code, message, details } }. Correct HTTP status codes.
• Lists: page, limit (max 100), allowlisted sort and filter fields.
• Generate OpenAPI from the Zod schemas and serve it at /api/docs when NODE_ENV is not production. Do not hand-write a separate API contract.
• Resources: auth (login, logout, refresh, me), users, employees, departments, attendance (check-in, check-out, me, list, summary), leave-types, leave-balances, leaves (approve, reject, cancel), payroll (me, list, payslip), documents (download-url), performance (ai-summary), notifications (read, read-all), reports, ai (chat, performance-summary, conversations), admin/analytics, admin/audit-logs, policies, announcements, /health, /ready.
1.11 Real-time
Attach Socket.IO to the HTTP server. Authenticate sockets and join rooms by user id (and team when needed). Server-to-client events: notification:new, notification:read, leave:status-updated, performance:review-created, announcement:new. Clients never change HR state through socket events; state changes go through authorized REST endpoints. Handle reconnects gracefully.
1.12 AI rules
• All AI calls go through aiService with a provider interface and a Gemini implementation. The model name comes from GEMINI_MODEL. The key never reaches the browser.
• The assistant answers policy questions only from Policy records (with references). If unsupported, say the information is unavailable and direct the user to HR. Never invent policy.
• Employee data is passed to the model only when needed, only the caller's own non-sensitive data, and never passwords, tokens or secrets. Treat user text as untrusted: prompt injection must not widen permissions. Authorization is decided in code, never by the model.
• Performance summaries use structured output validated with Zod (summary, strengths, development areas, next steps, notes). They are advisory and editable by HR/manager, and are never an employment decision.
• Timeouts, bounded retries with backoff, input/token limits, safe error messages, logs without prompt content, stricter rate limits. Payroll and leave calculations are never done by AI.
1.13 UI and UX
• Premium enterprise SaaS look, dark-first with optional light mode (preference stored locally), AA contrast, visible focus states, keyboard accessible, responsive down to mobile.
• Subtle gradients only. No 3D behind business data.
• Shell: collapsible sidebar, top bar, notification center, profile menu, breadcrumbs, mobile navigation.
• Tables: debounced search, filter, sort, pagination. Forms: inline validation. Warn on unsaved changes.
• Skeleton loaders, empty states, error states, permission-denied view, session-expired handling, toasts, confirmation dialogs for destructive actions, global error boundary.
• Route-level code splitting. Lazy-load report and AI pages.
• No fake buttons, dead routes or mocked data on production paths.
1.14 Priority tiers
• P0 (must work): scaffold, DB and models, auth, RBAC, employees, departments, dashboards, attendance, leave, notifications.
• P1 (should work): payroll, documents, performance, AI assistant and summaries, CSV reports, audit logs, manager dashboard, analytics.
• P2 (only if time): XLSX and PDF exports, forgot/reset password, bulk import, 3D accents, command palette, leave calendar polish, light-mode polish.
Never start a lower tier while a higher tier has failing tests.
1.15 Documentation (keep it lean)
Required: README.md, docs/requirements.md (requirements, use cases, acceptance criteria, out-of-scope), docs/architecture.md (Mermaid diagrams: system, auth flow, real-time flow, AI flow, upload flow, deployment), docs/data-model.md (ER diagram derived from the models), docs/security-design.md, docs/ai-design.md, docs/test-plan.md, docs/deployment.md, docs/runbook.md (local dev, env vars, rollback, backups, troubleshooting, known limitations), docs/decisions.md, docs/changelog.md, docs/project-status.md (living checklist).
Update docs in the same commit as the code they describe. Do not write docs for features that do not exist yet.
1.16 Testing standards
• Unit tests for business logic: leave day calculation, attendance duration, payroll totals, permission map, schemas, AI response parsing.
• Integration tests (Supertest plus mongodb-memory-server) for every module, including authorization paths.
• Always include negative tests: 401 unauthenticated, 403 wrong role, cross-employee access (IDOR) rejected, invalid ObjectId, NoSQL operator injection, oversized body, duplicate check-in, overlapping leave, malicious file, prompt injection.
• Playwright E2E runs against a seeded test database.
• Aim for meaningful coverage of core logic, not a coverage percentage.
1.17 Do not
• Do not expose secrets or the AI key to the frontend.
• Do not rely on frontend authorization.
• Do not trust client-side salary, attendance or leave calculations.
• Do not use localStorage for long-lived auth secrets.
• Do not fabricate payroll or tax compliance. Payroll is a management/demo module; do not claim statutory correctness.
• Do not let AI make or automate employment decisions.
• Do not store large files in MongoDB.
• Do not commit .env, credentials, node_modules, or real employee data.
• Do not over-engineer.
1.18 Commit convention
One commit per logical slice, using chore:, feat:, fix:, test: and docs: prefixes. Never commit failing lint, typecheck or tests.
Part 2: Phase prompts (paste one at a time)
Each phase starts with: Read AGENTS.md and docs/project-status.md. Audit the workspace. Do only this phase. Each ends with the gate: lint, typecheck, tests and build pass; browser check of the listed flows; update docs/project-status.md and docs/changelog.md; commit; stop and report.
Phase 1: Foundation (P0)
Build
1. Monorepo scaffold, tooling, shared package build, env validation with Zod, .env.example.
2. Mongo connection, all models with indexes, OrgSettings (timezone, late threshold, work week), safe seed script (4 demo users, departments, employees, leave types and balances).
3. Auth: login, logout, refresh with rotation and reuse detection, me, lockout, mustChangePassword. RBAC permission map, authorize, scoping helpers.
4. Centralized error middleware, pino logging with request ids, audit-log service, /health and /ready.
5. Web app shell: theme, login page, auth context with in-memory token, route guards driven by the shared permission map, session-expired handling, global error boundary.
Tests: auth lifecycle, refresh reuse revokes session, 401/403, permission map unit tests, invalid ObjectId, query-operator rejection, seed refuses in production.
Browser check: log in as each demo role, see role-appropriate navigation, log out.