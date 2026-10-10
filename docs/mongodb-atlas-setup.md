# Manual MongoDB Atlas Setup Guide for HRX

This guide provides step-by-step instructions to set up a cloud-hosted MongoDB Atlas database and connect it to your HRX application.

---

## Step 1: Create a MongoDB Atlas Account & Cluster

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas/register) and sign up or log in.
2. Click **Create** to create a new cluster.
3. Choose the **M0 Free (Shared)** tier.
4. Select your preferred Cloud Provider and Region (recommended: **AWS / Mumbai (`ap-south-1`)** or the region closest to you).
5. Click **Create Deployment**.

---

## Step 2: Configure Database User (Database Access)

1. In the Atlas dashboard, navigate to **Security** → **Database Access** in the left sidebar.
2. Click **+ Add New Database User**.
3. Select **Password** as the authentication method.
4. Enter:
   - **Username**: e.g., `hrx_admin`
   - **Password**: Click **Autogenerate Secure Password** or enter a strong password (e.g., `HrxSecurePass2026!`).
     *(Important: Save this password safely!)*
5. Under **Database User Privileges**, select **Read and write to any database** (or **Built-in Role: Atlas admin**).
6. Click **Add User**.

---

## Step 3: Configure Network Access (IP Whitelist)

1. Navigate to **Security** → **Network Access** in the left sidebar.
2. Click **+ Add IP Address**.
3. For local development or cloud deployment (Render/Vercel):
   - Click **Allow Access from Anywhere** (`0.0.0.0/0`), or enter your current public IP address.
   - Comment: `HRX App Access`
4. Click **Confirm**. Wait ~1 minute until the status shows **Active**.

---

## Step 4: Obtain Your Connection String

1. In the Atlas sidebar, navigate to **Deployment** → **Database**.
2. Click the **Connect** button next to your cluster.
3. Select **Drivers** (Node.js).
4. Select Driver: **Node.js**, Version: **5.5 or later**.
5. Copy the connection string format:
   ```text
   mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0
   ```
6. Replace:
   - `<username>` with your database user (e.g., `hrx_admin`)
   - `<password>` with your database password (e.g., `HrxSecurePass2026!`)
   - Append the database name before the query string: `/hrx_dev?retryWrites=true&w=majority`

### Example Finished Connection String:
```text
mongodb+srv://hrx_admin:HrxSecurePass2026!@cluster0.abcde.mongodb.net/hrx_dev?retryWrites=true&w=majority
```

> **Note on Special Characters**: If your password contains special characters (like `@`, `:`, `/`, `?`), they must be URL-encoded (e.g., `@` becomes `%40`, `!` becomes `%21`), or use an alphanumeric password.

---

## Step 5: Update Your HRX Environment Configuration

Open `apps/api/.env` (and root `.env` if using one) and update the `MONGODB_URI`:

```env
MONGODB_URI=mongodb+srv://hrx_admin:HrxSecurePass2026!@cluster0.abcde.mongodb.net/hrx_dev?retryWrites=true&w=majority
```

---

## Step 6: Seed Your MongoDB Atlas Database

Once the `MONGODB_URI` is saved in `apps/api/.env`, run the seed script to populate all initial roles, departments, employees, leave balances, and HR policies:

```bash
npm run seed -w apps/api
```

You will see:
```text
🌱 Starting HRX database seeding...
⚙️  Creating OrgSettings...
🏢 Creating Departments...
🏖️  Creating Leave Types...
👥 Creating Demo Users & Employee Profiles...
⚖️  Seeding Leave Balances for year 2026...
📜 Seeding Company HR Policies...
📢 Seeding Announcements...
⭐ Seeding Sample Performance Reviews...
✅ HRX Seed Completed Successfully!
```

---

## Step 7: Start the Application

Start the backend API with the new Atlas connection:

```bash
npm run dev:api
```

Your API server will log:
```text
[INFO]: Connected to MongoDB database
[INFO]: 🚀 HRX API & Socket.IO server running on port 5000 in development mode
```

---

## Step 8: Production Deployment (Render / Vercel)

When deploying to Render:
1. In the Render Dashboard under **Environment Variables**, set:
   - **Key**: `MONGODB_URI`
   - **Value**: Your full Atlas connection string (`mongodb+srv://...`)
2. Ensure your Atlas Network Access has `0.0.0.0/0` enabled so Render's dynamic IP addresses can communicate with the database.
