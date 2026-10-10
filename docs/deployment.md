# HRX Production Deployment Guide

This guide details how to deploy HRX to production with **Render** (Backend API & Socket.IO), **Vercel** (Frontend SPA), and **MongoDB Atlas** (Managed Database).

---

## 🏗️ Architecture & Topology

```
                  ┌──────────────────────┐
                  │    User Browser      │
                  └──────────┬───────────┘
                             │
            ┌────────────────┴────────────────┐
            │                                 │
     (Static Assets / SPA)             (API & WebSockets)
            ▼                                 ▼
┌──────────────────────┐           ┌──────────────────────┐
│     Vercel (Web)     │           │     Render (API)     │
│  React + Vite SPA    │──────────▶│  Node.js + Express   │
│  `apps/web`          │ (Rewrites)│  `apps/api`          │
└──────────────────────┘           └──────────┬───────────┘
                                              │
                       ┌──────────────────────┼──────────────────────┐
                       ▼                      ▼                      ▼
            ┌────────────────────┐ ┌────────────────────┐ ┌────────────────────┐
            │   MongoDB Atlas    │ │ Cloudinary Storage │ │ Google Gemini AI   │
            │   Database M0/M10  │ │  (Doc Attachments) │ │ (Policy Assistant) │
            └────────────────────┘ └────────────────────┘ └────────────────────┘
```

---

## 1. MongoDB Atlas Configuration

For detailed, step-by-step Atlas setup, refer to [docs/mongodb-atlas-setup.md](file:///c:/Users/manoj/OneDrive/Desktop/HRX/docs/mongodb-atlas-setup.md).

### Quick Atlas Connection String Checklist:
1. Ensure the user has `readWrite` role on the target database (`hrx_prod`).
2. Add your server's outbound IP (or `0.0.0.0/0` for dynamic PaaS IP pools like Render) in **Network Access**.
3. Format:
   ```env
   MONGODB_URI=mongodb+srv://<username>:<password>@<cluster-host>/hrx_prod?retryWrites=true&w=majority&appName=<ClusterName>
   ```

### Backup & Disaster Recovery:
- Atlas automated daily backups are enabled by default on M10+ tiers.
- For free M0 tiers, use `mongodump` and `mongorestore` CLI tools:
  ```bash
  # Backup
  mongodump --uri="mongodb+srv://<username>:<password>@<cluster-host>/hrx_prod" --out="./backup-$(date +%F)"

  # Restore
  mongorestore --uri="mongodb+srv://<username>:<password>@<cluster-host>/hrx_prod" --drop "./backup-YYYY-MM-DD"
  ```

---

## 2. Render Deployment (Backend API)

HRX includes a preconfigured [render.yaml](file:///c:/Users/manoj/OneDrive/Desktop/HRX/render.yaml) blueprint.

### Step-by-Step Setup:
1. Push your repository to GitHub or GitLab.
2. Sign in to [Render Dashboard](https://dashboard.render.com).
3. Click **New +** > **Blueprint** and connect your repository (or choose **Web Service** manually).
4. Configure service parameters:
   - **Environment**: `Node`
   - **Root Directory**: Leave blank (monorepo root)
   - **Build Command**:
     ```bash
     npm install && npm run build:shared && npm run build:api
     ```
   - **Start Command**:
     ```bash
     npm run start -w apps/api
     ```
   - **Health Check Path**: `/api/v1/health`

### Environment Variables on Render:
| Variable | Value / Description | Required |
| :--- | :--- | :--- |
| `NODE_ENV` | `production` | Yes |
| `PORT` | `10000` | Yes |
| `MONGODB_URI` | `mongodb+srv://...` (Atlas URI) | Yes |
| `JWT_SECRET` | 64+ char random hex string | Yes |
| `JWT_REFRESH_SECRET` | 64+ char random hex string | Yes |
| `CORS_ORIGIN` | `https://your-app.vercel.app` | Yes |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary account cloud name | Optional (Local fallback) |
| `CLOUDINARY_API_KEY` | Cloudinary API Key | Optional |
| `CLOUDINARY_API_SECRET`| Cloudinary API Secret | Optional |
| `GEMINI_API_KEY` | Google AI Studio Key | Optional (Local fallback active) |

> [!WARNING]
> **Render Free-Tier Cold Starts (50s Spin-Down)**:
> Free instances spin down after 15 minutes of inactivity. When a request arrives, a cold start takes ~50 seconds.
> **Mitigation**:
> - Upgrade to the Starter tier ($7/mo) for 24/7 persistence.
> - Or set up a free uptime monitor (e.g., UptimeRobot, cron-job.org) pinging `https://your-api.onrender.com/api/v1/health` every 10 minutes.

---

## 3. Vercel Deployment (Frontend Web SPA)

HRX includes [vercel.json](file:///c:/Users/manoj/OneDrive/Desktop/HRX/vercel.json) configuring client-side routing rewrites and API proxies.

### Step-by-Step Setup:
1. Sign in to [Vercel Dashboard](https://vercel.com).
2. Click **Add New...** > **Project** and import your Git repository.
3. Configure project settings:
   - **Framework Preset**: `Vite`
   - **Root Directory**: `apps/web`
   - **Build Command**: `npm run build` (or from root: `npm run build:shared && npm run build:web`)
   - **Output Directory**: `dist`
4. Configure Environment Variables in Vercel:
   | Variable | Value | Description |
   | :--- | :--- | :--- |
   | `VITE_API_URL` | `https://your-api.onrender.com/api/v1` | Public API base URL |
   | `VITE_SOCKET_URL` | `https://your-api.onrender.com` | Socket.IO server URL |

> [!NOTE]
> `vercel.json` proxies requests from `/api/:path*` to `https://your-api.onrender.com/api/:path*` directly if you prefer same-origin calls without CORS preflight overhead. Update the destination URL in `vercel.json` to match your actual Render URL.

---

## 4. File Storage: Cloudinary vs Local Disk

- In development, document uploads write to `apps/api/uploads/` with SHA-256 validation and magic-byte checks.
- On ephemeral production containers (like Render), local files are wiped on redeploy.
- **Configuring Cloudinary**:
  Add `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, and `CLOUDINARY_API_SECRET` to Render environment variables. The API automatically detects these credentials and uploads files directly to private Cloudinary storage.

---

## 5. AI Assistant & Security Boundaries

- **Gemini AI**: If `GEMINI_API_KEY` is set, calls use `gemini-1.5-flash` with 10s timeout and bounded retries.
- **Fallback**: If `GEMINI_API_KEY` is unset or times out, the service automatically falls back to deterministic local rule engines without crashing.
- **Client Security**: `GEMINI_API_KEY` is strictly managed on the backend and is **never** bundled or exposed to Vite client code.
- **Prompt Injection Defense**: System prompts enforce policy bounds and isolate employee context.

---

## 6. Post-Deployment Verification Checklist

1. [ ] Check API health: `GET https://your-api.onrender.com/api/v1/health` returns `{"status":"ok"}`.
2. [ ] Login with Admin / HR / Manager / Employee accounts.
3. [ ] Verify WebSocket connectivity in browser console: `[Socket] Connected: <socket-id>`.
4. [ ] Run an Attendance Check-in and confirm status updates.
5. [ ] Submit a Leave request and verify real-time notification badge.
6. [ ] Upload a PDF/PNG document and test signed download URL retrieval.
7. [ ] Generate and review an AI Performance Summary draft.
8. [ ] Query the AI HR Assistant with a policy question and test prompt-injection refusal.
9. [ ] Export an Employee / Attendance CSV report.
