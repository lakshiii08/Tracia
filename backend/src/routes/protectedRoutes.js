const express = require("express");
const router = express.Router();
const { verifyToken, requireRole, requirePermission } = require("../middleware/authMiddleware");

// Audit & Security Logs: Only accessible to ADMIN and AUDITOR roles
router.get("/audit-logs", verifyToken, requireRole(["ADMIN", "AUDITOR"]), (req, res) => {
  res.status(200).json({
    success: true,
    message: "Audit logs retrieved successfully.",
    accessGrantedTo: req.user.role,
    logs: [
      { id: "aud-101", timestamp: new Date().toISOString(), event: "SYSTEM_ACCESS_CHECK", operator: req.user.operatorId },
      { id: "aud-102", timestamp: new Date().toISOString(), event: "AUDIT_COMPLIANCE_VERIFIED", operator: "SYSTEM" },
    ],
  });
});

// Knowledge Graph & Entity Relations: Accessible to ADMIN, INVESTIGATING_OFFICER, and INTELLIGENCE_OFFICER (Restricted from AUDITOR)
router.get("/graph", verifyToken, requireRole(["ADMIN", "INVESTIGATING_OFFICER", "INTELLIGENCE_OFFICER"]), (req, res) => {
  res.status(200).json({
    success: true,
    message: "Knowledge graph data accessed.",
    accessGrantedTo: req.user.role,
    nodesCount: 12,
    edgesCount: 12,
  });
});

// Evidence & Chain of Custody: Accessible to ADMIN and INVESTIGATING_OFFICER (Restricted from AUDITOR & ANALYST)
router.get("/evidence", verifyToken, requireRole(["ADMIN", "INVESTIGATING_OFFICER"]), (req, res) => {
  res.status(200).json({
    success: true,
    message: "Evidence custody files accessed.",
    accessGrantedTo: req.user.role,
    evidenceCount: 3,
  });
});

// Administrative Case Assignment & Management: Restricted to ADMIN only
router.post("/cases/manage", verifyToken, requireRole("ADMIN"), (req, res) => {
  res.status(200).json({
    success: true,
    message: "Administrative case management action permitted.",
    operator: req.user.operatorId,
  });
});

module.exports = router;
