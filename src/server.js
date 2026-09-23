require("dotenv").config({ path: require("path").resolve(__dirname, "../.env") });
const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");
const { seedUsers } = require("./scripts/seed");
const authRoutes = require("./routes/authRoutes");
const protectedRoutes = require("./routes/protectedRoutes");

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS for frontend
const corsOrigin = process.env.CORS_ORIGIN || "http://localhost:3000";
app.use(
  cors({
    origin: [corsOrigin, "http://localhost:3000", "http://127.0.0.1:3000"],
    credentials: true,
  })
);

// Body parser
app.use(express.json());

// Request logger
app.use((req, res, next) => {
  const start = Date.now();
  res.on("finish", () => {
    const duration = Date.now() - start;
    console.log(`[HTTP] ${req.method} ${req.originalUrl} ${res.statusCode} (${duration}ms)`);
  });
  next();
});

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.status(200).json({
    status: "online",
    service: "TRACIA Auth & RBAC Backend",
    timestamp: new Date().toISOString(),
  });
});

app.get("/", (req, res) => {
  res.status(200).json({
    service: "TRACIA Backend Authentication API",
    status: "active",
    endpoints: {
      login: "POST /api/auth/login",
      me: "GET /api/auth/me",
      auditLogs: "GET /api/audit-logs (Requires ADMIN or AUDITOR)",
      graph: "GET /api/graph (Requires ADMIN, INVESTIGATOR, or ANALYST)",
      evidence: "GET /api/evidence (Requires ADMIN or INVESTIGATOR)",
    },
  });
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api", protectedRoutes);

// Global 404 handler
app.use((req, res) => {
  res.status(404).json({ error: `Cannot ${req.method} ${req.originalUrl}` });
});

// Start server and initialize DB connection
async function startServer() {
  const isConnected = await connectDB();
  if (isConnected) {
    await seedUsers();
  } else {
    console.log("[Server] Running with active in-memory operator credentials fallback.");
  }

  app.listen(PORT, () => {
    console.log(`=======================================================`);
    console.log(`  TRACIA Authentication Backend running on port ${PORT}`);
    console.log(`  Health Check: http://localhost:${PORT}/api/health`);
    console.log(`  Login Endpoint: http://localhost:${PORT}/api/auth/login`);
    console.log(`=======================================================`);
  });
}

startServer();

module.exports = app;
