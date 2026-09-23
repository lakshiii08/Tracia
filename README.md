# TRACIA Authentication & RBAC Backend

Node.js + Express + MongoDB authentication and role-based access control service for the TRACIA intelligence platform.

---

## Seeded Operator Credentials

The following operators and passwords have been pre-configured:

| Operator ID | Password | Role | Permissions & Access Scope |
| :--- | :--- | :--- | :--- |
| **`Admin`** | `Admin@123` | `ADMIN` | **Full Global Access**: Can view all cases, assign cases, approve access requests, inspect audit logs, review evidence, and use graph intelligence. |
| **`Investigator`** | `Investigator@123` | `INVESTIGATING_OFFICER` | **Operational Case Access**: Full access to assigned cases, related case discovery, evidence review, CDR analysis, and knowledge graph. **Restricted from Audit Logs and Admin approvals.** |
| **`Analyst`** | `Analyst@123` | `INTELLIGENCE_OFFICER` | **Intelligence & Graph Access**: Access to knowledge graph, AI Copilot / GraphRAG, CDR analysis, and analytics. **Restricted from Audit Logs and Evidence modification.** |
| **`Auditor`** | `Auditor@123` | `AUDITOR` | **Compliance Oversight**: Read-only access to Audit & Security Logs and Reports. **Restricted from Knowledge Graph, Evidence uploads, and case assignment.** |

---

## Getting Started

### 1. Configuration (`.env`)
Create or edit `backend/.env`:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/tracia
JWT_SECRET=tracia-super-secret-jwt-key-2026-production
JWT_EXPIRES_IN=8h
CORS_ORIGIN=http://localhost:3000
```

> **Note**: If you are using MongoDB Atlas, simply replace `MONGODB_URI` with your connection string:
> `mongodb+srv://<username>:<password>@cluster.mongodb.net/tracia`

### 2. Install Dependencies
```bash
cd backend
npm install
```

### 3. Seed Operator Accounts into MongoDB
```bash
npm run seed
```

### 4. Run the Server
```bash
npm start
# Or for development auto-reload:
npm run dev
```

---

## API Endpoints

### Public Endpoints
- `POST /api/auth/login`: Authenticate operator ID and password.
- `GET /api/health`: Health status.

### Authenticated Endpoints (Bearer Token)
- `GET /api/auth/me`: Current operator session & role permissions.
- `POST /api/auth/logout`: Terminate session.

### Role-Gated Protected Endpoints
- `GET /api/audit-logs`: Requires `ADMIN` or `AUDITOR` role. Returns 403 Forbidden for `Investigator` / `Analyst`.
- `GET /api/graph`: Requires `ADMIN`, `INVESTIGATING_OFFICER`, or `INTELLIGENCE_OFFICER`. Returns 403 Forbidden for `Auditor`.
- `GET /api/evidence`: Requires `ADMIN` or `INVESTIGATING_OFFICER`. Returns 403 Forbidden for `Auditor` / `Analyst`.
- `POST /api/cases/manage`: Restricted to `ADMIN` only.
