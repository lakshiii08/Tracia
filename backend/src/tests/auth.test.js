require("dotenv").config({ path: require("path").resolve(__dirname, "../../.env") });
const express = require("express");
const authRoutes = require("../routes/authRoutes");
const protectedRoutes = require("../routes/protectedRoutes");

const app = express();
app.use(express.json());
app.use("/api/auth", authRoutes);
app.use("/api", protectedRoutes);

async function runTests() {
  const server = app.listen(0);
  const port = server.address().port;
  const baseUrl = `http://localhost:${port}`;

  console.log(`[Test] Running Auth & RBAC Verification Tests on test server port ${port}...`);

  let passed = 0;
  let failed = 0;

  async function testCase(name, fn) {
    try {
      await fn();
      console.log(`  ✓ ${name}`);
      passed++;
    } catch (err) {
      console.error(`  ✗ ${name}:`, err.message);
      failed++;
    }
  }

  const credentials = [
    { id: "Admin", pass: "Admin@123", expectedRole: "ADMIN" },
    { id: "Investigator", pass: "Investigator@123", expectedRole: "INVESTIGATING_OFFICER" },
    { id: "Analyst", pass: "Analyst@123", expectedRole: "INTELLIGENCE_OFFICER" },
    { id: "Auditor", pass: "Auditor@123", expectedRole: "AUDITOR" },
  ];

  const tokens = {};

  // 1. Test valid logins
  for (const cred of credentials) {
    await testCase(`Login operator '${cred.id}' with correct password`, async () => {
      const res = await fetch(`${baseUrl}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ operatorId: cred.id, password: cred.pass }),
      });
      const data = await res.json();
      if (res.status !== 200 || !data.token) {
        throw new Error(`Expected 200 with token, got ${res.status}: ${JSON.stringify(data)}`);
      }
      if (data.role !== cred.expectedRole) {
        throw new Error(`Expected role '${cred.expectedRole}', got '${data.role}'`);
      }
      tokens[cred.id] = data.token;
    });
  }

  // 2. Test invalid password
  await testCase("Login operator 'Admin' with invalid password fails (401)", async () => {
    const res = await fetch(`${baseUrl}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ operatorId: "Admin", password: "WrongPassword999!" }),
    });
    if (res.status !== 401) {
      throw new Error(`Expected 401 Unauthorized, got ${res.status}`);
    }
  });

  // 3. Test invalid operator ID
  await testCase("Login non-existent operator fails (401)", async () => {
    const res = await fetch(`${baseUrl}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ operatorId: "GhostOperator", password: "SomePassword@123" }),
    });
    if (res.status !== 401) {
      throw new Error(`Expected 401 Unauthorized, got ${res.status}`);
    }
  });

  // 4. Test session /api/auth/me
  await testCase("Retrieve session profile via /api/auth/me for 'Admin'", async () => {
    const res = await fetch(`${baseUrl}/api/auth/me`, {
      headers: { Authorization: `Bearer ${tokens.Admin}` },
    });
    const data = await res.json();
    if (res.status !== 200 || data.operatorId !== "ADMIN") {
      throw new Error(`Expected 200 with ADMIN operatorId, got ${res.status}`);
    }
  });

  // 5. RBAC: Audit logs access
  await testCase("Auditor CAN access /api/audit-logs (200 OK)", async () => {
    const res = await fetch(`${baseUrl}/api/audit-logs`, {
      headers: { Authorization: `Bearer ${tokens.Auditor}` },
    });
    if (res.status !== 200) {
      throw new Error(`Expected 200 OK, got ${res.status}`);
    }
  });

  await testCase("Investigator CANNOT access /api/audit-logs (403 Forbidden)", async () => {
    const res = await fetch(`${baseUrl}/api/audit-logs`, {
      headers: { Authorization: `Bearer ${tokens.Investigator}` },
    });
    if (res.status !== 403) {
      throw new Error(`Expected 403 Forbidden, got ${res.status}`);
    }
  });

  await testCase("Analyst CANNOT access /api/audit-logs (403 Forbidden)", async () => {
    const res = await fetch(`${baseUrl}/api/audit-logs`, {
      headers: { Authorization: `Bearer ${tokens.Analyst}` },
    });
    if (res.status !== 403) {
      throw new Error(`Expected 403 Forbidden, got ${res.status}`);
    }
  });

  // 6. RBAC: Knowledge graph access
  await testCase("Analyst CAN access /api/graph (200 OK)", async () => {
    const res = await fetch(`${baseUrl}/api/graph`, {
      headers: { Authorization: `Bearer ${tokens.Analyst}` },
    });
    if (res.status !== 200) {
      throw new Error(`Expected 200 OK, got ${res.status}`);
    }
  });

  await testCase("Auditor CANNOT access /api/graph (403 Forbidden)", async () => {
    const res = await fetch(`${baseUrl}/api/graph`, {
      headers: { Authorization: `Bearer ${tokens.Auditor}` },
    });
    if (res.status !== 403) {
      throw new Error(`Expected 403 Forbidden, got ${res.status}`);
    }
  });

  // 7. RBAC: Case administrative management
  await testCase("Admin CAN access /api/cases/manage (200 OK)", async () => {
    const res = await fetch(`${baseUrl}/api/cases/manage`, {
      method: "POST",
      headers: { Authorization: `Bearer ${tokens.Admin}` },
    });
    if (res.status !== 200) {
      throw new Error(`Expected 200 OK, got ${res.status}`);
    }
  });

  await testCase("Investigator CANNOT access /api/cases/manage (403 Forbidden)", async () => {
    const res = await fetch(`${baseUrl}/api/cases/manage`, {
      method: "POST",
      headers: { Authorization: `Bearer ${tokens.Investigator}` },
    });
    if (res.status !== 403) {
      throw new Error(`Expected 403 Forbidden, got ${res.status}`);
    }
  });

  server.close();
  console.log(`\n[Test Summary] ${passed} passed, ${failed} failed.`);
  if (failed > 0) process.exit(1);
}

runTests().catch((err) => {
  console.error("Test error:", err);
  process.exit(1);
});
