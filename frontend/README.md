
<div align="center">

# TRACIA — Frontend

### Trace. Analyze. Connect. Intelligence Architecture.

**AI-Powered Criminal Network Analysis System**

A modern web interface for AI-powered investigative intelligence, criminal network analysis, and connected data exploration.

[🚀 Live Demo](https://tracia-frontend-ne6u-qi7ubw8tr.vercel.app/login?next=%2F) · [💻 GitHub Repository](https://github.com/lakshiii08/Tracia)

![Next.js](https://img.shields.io/badge/Next.js-Framework-black?logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-Enabled-blue?logo=typescript)
![Vercel](https://img.shields.io/badge/Deployment-Vercel-black?logo=vercel)

</div>

---

## Overview

The TRACIA frontend is the user-facing application of an AI-powered investigative intelligence platform designed to help investigators explore connected information, analyze criminal networks, and manage investigative workflows.

Built with Next.js and TypeScript, the frontend provides an interface for authentication, protected routes, and interaction with the platform's investigative features.

The application is designed to integrate with backend APIs, AI-powered document processing, knowledge graph analysis, and blockchain-based evidence integrity verification.

## Live Application

**Deployed Frontend:**  
[https://tracia-frontend-ne6u-qi7ubw8tr.vercel.app/login?next=%2F](https://tracia-frontend-ne6u-qi7ubw8tr.vercel.app/login?next=%2F)

**Main Repository:**  
[https://github.com/lakshiii08/Tracia](https://github.com/lakshiii08/Tracia)

---

## Features

### Authentication and Access
- Login interface with credential validation.
- HTTP-only JWT cookie-based authentication.
- Protected application routes.
- Logout functionality.
- Loading and error states.
- Demo authentication for development and evaluation.

### Local Authentication
- SQLite-backed local authentication database.
- Automatic database initialization and seeding.
- Password verification using scrypt password hashes.
- Server-side authentication endpoint.
- Configurable JWT signing secret.

### Application Architecture
- Next.js application framework.
- TypeScript support.
- Component-based UI development.
- Environment-based configuration.
- Vercel deployment support.

> The current demo authentication implementation uses a local SQLite database. Integration with the production backend should be completed before handling sensitive investigative information.

---

## Technology Stack

| Technology | Purpose |
|---|---|
| Next.js | Web application framework |
| React | UI component library |
| TypeScript | Type-safe development |
| Node.js | Runtime for server-side functionality |
| SQLite | Local authentication database |
| scrypt | Password hashing |
| JWT | Authentication tokens |
| HTTP-only Cookies | Authentication token handling |
| Vercel | Deployment and hosting |

---

## Project Structure

The frontend directory follows the structure of the existing Next.js application.

```text
frontend/
├── app/
│   ├── api/
│   │   └── auth/
│   │       └── login/
│   ├── page.tsx
│   └── layout.tsx
├── components/
├── lib/
├── public/
├── data/
│   └── tracia.db
├── .env.example
├── .gitignore
├── package.json
├── package-lock.json
├── tsconfig.json
└── README.md
```

*This is a representative structure. Exact paths may differ depending on the current implementation. The SQLite database is generated at runtime if configured by the application.*

---

## Getting Started

### Prerequisites

Install the following:

- Node.js 22 or a compatible version supporting the Node.js built-in SQLite API used by this project.
- npm.
- Git.

### 1. Clone the Repository

```bash
git clone https://github.com/lakshiii08/Tracia.git
cd Tracia/frontend
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Create a `.env.local` file in the frontend directory using `.env.example` as a reference.

Configure the JWT signing secret:

```env
AUTH_JWT_SECRET=replace_with_a_strong_random_secret
```

Generate a cryptographically secure secret for local development and configure a separate secret for production.

**Never commit `.env.local` or real secrets to GitHub.**

### 4. Run the Development Server

```bash
npm run dev
```

Open the application in your browser:

[http://localhost:3000](http://localhost:3000)

### 5. Create a Production Build

```bash
npm run build
npm run start
```

Run the commands from the frontend directory. Ensure all required environment variables are configured before starting the application.

---

## Demo Login Credentials

The current frontend demo authentication endpoint is documented with the following accounts:

| Role | User ID | Password |
|---|---|---|
| Administrator | `TRACIA-ADMIN` | `TRACIA-2026` |
| Investigator | `INVESTIGATOR-01` | `TRACIA-2026` |
| Analyst | `ANALYST-01` | `TRACIA-2026` |
| Auditor | `AUDITOR-01` | `TRACIA-2026` |

These credentials are for the demo authentication implementation and must be verified against the deployed application.

**Security warning:** Do not use shared demo credentials for production. Replace demo authentication with the real backend authentication service before granting access to sensitive data.

---

## Authentication Flow

The current authentication workflow is designed as follows:

1. The user enters their credentials on the login page.
2. The frontend sends the credentials to the authentication endpoint.
3. The server validates the credentials against the configured authentication database.
4. Upon successful authentication, the server issues a JWT in an HTTP-only cookie.
5. Protected routes check authentication status.
6. The application displays appropriate loading, success, or error states.
7. The user can log out to end the authenticated session.

The current implementation uses local SQLite-backed demo authentication while integration with the external backend is pending.

---

## Local Authentication Database

The local authentication database is configured at:

`data/tracia.db`

The database uses Node.js's built-in SQLite API and scrypt-based password hashing.

Depending on the implementation, the database is initialized and seeded when authentication is first used.

### Production Considerations

For production deployments:

- Use a managed database appropriate for the deployment.
- Replace demo credentials with securely provisioned accounts.
- Keep database files and credentials out of public repositories.
- Use strong JWT signing secrets.
- Implement server-side authorization and session expiration.
- Configure appropriate cookie security settings.
- Add CSRF protection where required.
- Avoid storing sensitive investigative information in the demo database.

A local SQLite database should not be assumed to provide persistent shared storage across serverless deployment instances.

---

## Deployment on Vercel

The TRACIA frontend is deployed using Vercel.

### Deployment Steps

1. Import the GitHub repository into Vercel.
2. Set the project root directory to `frontend` if deploying from the monorepo.
3. Configure the required environment variables.
4. Ensure the build command matches the frontend's package configuration.
5. Deploy the application.
6. Verify login, logout, protected routes, and session behavior.

### Environment Variables

Configure the following in Vercel's project settings:

| Variable | Description |
|---|---|
| `AUTH_JWT_SECRET` | Secret used to sign authentication tokens |

Additional environment variables may be required when connecting the production backend.

Do not expose server-side secrets through public variables such as `NEXT_PUBLIC_*`.

**Important:** Serverless deployments may not provide persistent writable local storage. Configure a suitable managed database before relying on SQLite for production authentication.

---

## Security Best Practices

- Keep credentials and secrets out of source control.
- Use secure password hashing instead of plaintext passwords.
- Configure HTTP-only, Secure, and appropriate SameSite cookies.
- Enforce authorization on the server, not only in the frontend.
- Validate all incoming requests.
- Protect cookie-based authentication against CSRF where required.
- Apply session expiration and token rotation policies where appropriate.
- Do not expose sensitive information in logs or error messages.
- Restrict access to investigative data.
- Disable demo accounts in production.

---

## Integration Roadmap

Potential future improvements include:

- Integration with the production TRACIA backend.
- AI-powered document upload and extraction interfaces.
- Interactive criminal network visualization.
- Knowledge graph and GraphRAG integration.
- Blockchain evidence integrity verification interface.
- Role-specific dashboards and permissions.
- Automated frontend tests.
- Continuous integration and deployment.

These are planned integration areas, not a claim that all features are already implemented.

---

## Troubleshooting

### Application does not start

Check your Node.js version and install dependencies again if needed.

```bash
node --version
npm install
npm run dev
```

### Authentication fails

- Verify the demo credentials against the current authentication implementation.
- Confirm that `AUTH_JWT_SECRET` is configured.
- Inspect the server logs for errors.
- Verify that the authentication database can be initialized and accessed.

### Production login differs from local login

Check the environment variables and authentication configuration in Vercel. Also confirm whether the deployed version uses the same authentication implementation as your local branch.

---

## Project Information

| Field | Details |
|---|---|
| Project | TRACIA |
| Full Form | Trace. Analyze. Connect. Intelligence Architecture |
| Module | Frontend |
| Domain | AI, Investigative Intelligence, Graph Analytics, Blockchain |
| Framework | Next.js |
| Language | TypeScript |
| Hosting | Vercel |
| Competition | Smart India Hackathon 2026 |
| Repository | [lakshiii08/Tracia](https://github.com/lakshiii08/Tracia) |
| Live Demo | [Launch TRACIA](https://tracia-frontend-ne6u-qi7ubw8tr.vercel.app/login?next=%2F) |

---

## License

Refer to the root repository's license, if available. Do not assume that the frontend is licensed for unrestricted reuse unless an appropriate license has been added.

---

<div align="center">

**TRACIA — Trace Connections. Strengthen Intelligence.**

[🚀 Live Demo](https://tracia-frontend-ne6u-qi7ubw8tr.vercel.app/login?next=%2F) · [💻 GitHub](https://github.com/lakshiii08/Tracia)

</div>
