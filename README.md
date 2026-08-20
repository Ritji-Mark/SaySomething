# SaySomething

SaySomething is a civic reporting platform that lets citizens report public issues and have them routed to — and resolved by — the authority responsible for them.

It makes civic reporting easier, more transparent, and trackable by connecting citizens with the authorities who address their reports, and by keeping citizens informed at every step.

> **Status:** Functional MVP — the full report lifecycle works end to end (citizen submits → auto-routed to the right authority → tracked to resolution, with notifications). Preparing for first deployment.

---

## Features

### Citizens

* Register and log in with email/password, or sign in with Google
* Reset a forgotten password by email
* Submit a report with a category, title, description, optional address, and precise location captured from the browser ("Use my location")
* Attach evidence (images or PDF)
* View their reports and follow each one's status timeline
* Receive in-app notifications (and email) as reports progress

### Authorities (staff)

* Log in via the dedicated staff entrance (`/admin/login`)
* See the reports assigned to their authority in a dashboard
* Review a report with its location on a map, evidence, and full history
* Update status, add comments — every change is recorded in the timeline, notifies the reporter, and sends an email

### Administrators

* Everything an authority can do, plus:
* Manage users (create authority/admin accounts)
* Manage authorities and their departments
* Configure **category → authority routing** (see below)
* Manually assign any unrouted report

### How routing works

An administrator maps each report category to the authority responsible for it (optionally a specific department). When a citizen submits a report in a **mapped** category, it is created **already assigned** to that authority — visible in their dashboard immediately, with the reporter notified, and no admin touch required. Reports in **unmapped** categories fall back to the admin queue for manual assignment.

### Cross-cutting

* Geospatial storage and querying of report locations via PostGIS
* JWT authentication with role-based authorization (Citizen / Authority / Administrator)
* Transactional email via Resend (status updates, assignment notices, password resets)
* Security headers (helmet) and rate limiting on authentication endpoints
* CORS locked to the configured frontend origin in production

---

## User Roles

### Citizen

Create an account, submit and track reports, provide descriptions/evidence/location, and receive updates.

### Authority

Log in, view reports assigned to them, review and manage them, update status, add comments, and resolve reports.

### Administrator

Manage users, authorities, departments, and category routing; view and assign all reports; oversee platform activity.

---

## Report Categories

SaySomething ships with five categories, each of which an administrator can route to a responsible authority:

1. Roads
2. Electricity
3. Water
4. Environment
5. Public Safety

The category set is stored in the database and can be extended.

---

## Report Lifecycle

```text
Submitted → Under Review → Assigned → In Progress → Resolved
```

Reports in a routed category enter the lifecycle at **Assigned** automatically; others start at **Submitted**. Additional statuses (`Rejected`, `Duplicate`, `Closed`) may be added later.

---

## Technology Stack

| Layer | Technology |
| ----- | ---------- |
| Frontend | React 19, Vite 8, React Router 7, Tailwind CSS 4, Leaflet + React-Leaflet, Axios |
| Backend | Node.js, Express 5, JWT (`jsonwebtoken`), `bcryptjs`, `multer`, `helmet`, `express-rate-limit`, CORS |
| Database | PostgreSQL + PostGIS (via `pg`) |
| Integrations | Resend (email), Google Identity (`google-auth-library`) |
| Deployment | Vercel (frontend), Render (backend), Supabase (PostgreSQL/PostGIS) |

---

## Project Structure

```text
SaySomething/
├── backend/
│   ├── config/            # database.js — PostgreSQL (pg) connection pool
│   ├── middleware/        # auth.js (JWT), roles.js (role-based access)
│   ├── routes/            # auth, reports, comments, evidence, notifications,
│   │                      #   categories, authorities, departments,
│   │                      #   reportStatuses, users
│   ├── services/          # mailer.js, emailTemplates.js (Resend)
│   ├── utils/             # reportAccess.js, orgValidation.js
│   ├── uploads/           # evidence files (local dev; UPLOAD_DIR in prod)
│   ├── server.js          # app entry: middleware + route mounts
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── api/           # axios client + per-resource API helpers
│   │   ├── components/    # Navbar, Layout, ProtectedRoute, ReportMap, …
│   │   ├── context/       # AuthContext
│   │   ├── pages/         # Login, Register, ReportsList, NewReport,
│   │   │                  #   ReportDetail, StaffDashboard, AdminUsers,
│   │   │                  #   AdminAuthorities, AdminRouting, …
│   │   ├── utils/         # roles, formatting helpers
│   │   ├── App.jsx        # routes
│   │   └── main.jsx
│   ├── vercel.json        # SPA rewrite so client-side routes survive a refresh
│   └── package.json
│
├── database/
│   ├── schema.sql         # full schema + seed data (roles, statuses, categories)
│   └── migrations/        # 001_google_auth, 002_password_resets, 003_category_routing
│
├── .env.example           # backend environment template
└── README.md
```

---

## Getting Started (local development)

### Prerequisites

* Node.js 18 or newer
* PostgreSQL 14+ with the **PostGIS** extension available

### 1. Clone and configure environment

```bash
git clone <your-repo-url> SaySomething
cd SaySomething

# Backend env (root .env) — fill in DB credentials, a JWT secret, etc.
cp .env.example .env

# Frontend env — point the app at your backend
cp frontend/.env.example frontend/.env
```

`.env` files are gitignored — never commit real secrets.

### 2. Set up the database

Create a database, enable PostGIS, and load the schema (which also seeds roles, statuses, and categories):

```sql
CREATE DATABASE saysomething;
```

```bash
psql -d saysomething -c "CREATE EXTENSION IF NOT EXISTS postgis;"
psql -d saysomething -f database/schema.sql
```

> `schema.sql` already includes all migrations, so you don't need to run the files in `database/migrations/` separately on a fresh database.

### 3. Run the backend

```bash
cd backend
npm install
npm run dev        # nodemon (or: npm start)
# API on http://localhost:5000
```

### 4. Run the frontend

```bash
cd frontend
npm install
npm run dev
# App on http://localhost:5173
```

### 5. Create the first administrator

Registration only creates **citizen** accounts, so seed an admin directly. Generate a password hash, then insert the user (`role_id = 3` is Administrator):

```bash
# from backend/ (where bcryptjs is installed)
node -e "console.log(require('bcryptjs').hashSync('your-strong-password', 12))"
```

```sql
INSERT INTO users (full_name, email, password_hash, role_id)
VALUES ('Admin', 'admin@example.com', '<paste-hash-here>', 3);
```

Staff (authority/admin) sign in at `/admin/login`.

---

## Environment Variables

Configure these via `.env` locally and via your host's dashboard in production. See [`.env.example`](.env.example) and [`frontend/.env.example`](frontend/.env.example) for the full list and inline notes.

**Backend** (`.env`)

| Variable | Purpose |
| -------- | ------- |
| `PORT` | API port (host-assigned in production) |
| `NODE_ENV` | `production` locks CORS to `CLIENT_ORIGIN` |
| `CLIENT_ORIGIN` | Allowed frontend origin in production |
| `DB_HOST` / `DB_PORT` / `DB_NAME` / `DB_USER` / `DB_PASSWORD` | PostgreSQL connection |
| `DB_SSL` | `true` for managed Postgres (e.g. Supabase) |
| `UPLOAD_DIR` | Where evidence files are stored (use a persistent path in production) |
| `JWT_SECRET` | Signs auth tokens — use a long random string in production |
| `GOOGLE_CLIENT_ID` | Google sign-in (optional; disabled when empty) |
| `RESEND_API_KEY` | Transactional email (optional; **secret**) |
| `MAIL_FROM` | Verified sender address |
| `APP_ORIGIN` | Public frontend URL, used in email links |

**Frontend** (`frontend/.env`, baked in at build time)

| Variable | Purpose |
| -------- | ------- |
| `VITE_API_URL` | Backend origin (e.g. `https://api.example.com`) |
| `VITE_GOOGLE_CLIENT_ID` | Google sign-in (optional) |

---

## Deployment

The app is designed to deploy across three managed services:

* **Supabase** — create a project, enable the PostGIS extension, and run `database/schema.sql`, then seed an admin. Use the connection details for the backend's `DB_*` variables and set `DB_SSL=true`.
* **Render** — deploy the backend as a Web Service with **root directory `backend`**, build `npm install`, start `npm start`. Set the backend environment variables, and attach a persistent disk with `UPLOAD_DIR` pointed at it so uploaded evidence survives restarts.
* **Vercel** — deploy the frontend with **root directory `frontend`**. Set `VITE_API_URL` to the Render URL before building. `vercel.json` handles SPA routing.

Finally, set `CLIENT_ORIGIN` and `APP_ORIGIN` on Render to your Vercel URL. To send email to recipients other than your own inbox, verify a domain in Resend.

---

## API Overview

All endpoints are served under `/api`. Authentication is via a `Bearer` JWT.

| Route group | Purpose |
| ----------- | ------- |
| `/api/auth` | Register, login, Google sign-in, forgot/reset password |
| `/api/reports` | Create, list (scoped by role), view, update status, assign; nested `/comments` and `/evidence`; status history |
| `/api/categories` | List categories; configure routing (admin) |
| `/api/authorities`, `/api/departments` | List / create / update (admin) |
| `/api/report-statuses` | List available statuses |
| `/api/notifications` | List and count unread notifications |
| `/api/users` | User management (admin) |

---

## Current Status

**Functional MVP — preparing for first deployment.**

Implemented:

* [x] Authentication & role-based access (email/password, Google, password reset)
* [x] Citizen reporting (categories, evidence upload, browser geolocation, tracking)
* [x] Category → authority routing with automatic assignment
* [x] Authority dashboard, status management, comments, resolution
* [x] Administrator dashboards (users, authorities, departments, routing)
* [x] Notifications (in-app + email) and interactive maps
* [x] Security hardening (helmet, auth rate limiting, production CORS)

Not yet implemented (post-MVP):

* [ ] Duplicate report detection
* [ ] Analytics / reporting dashboards
* [ ] AI-assisted report classification
* [ ] Report search, filtering, and pagination
* [ ] In-app category management UI
* [ ] Automated test suite

---

## License

This project is currently under development. License details will be added before the first public release.
