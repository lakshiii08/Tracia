const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const User = require("../models/User");
const { ROLE_PERMISSIONS } = require("../middleware/authMiddleware");

// In-memory fallback operators in case MongoDB daemon is starting or offline
const FALLBACK_OPERATORS = {
  ADMIN: {
    operatorId: "ADMIN",
    passwordPlain: "Admin@123",
    role: "ADMIN",
    name: "Aarav Mehta (Admin)",
    department: "Central Cyber Command & Oversight",
    badgeNumber: "ADM-9001",
    clearanceLevel: "LEVEL 04",
  },
  INVESTIGATOR: {
    operatorId: "INVESTIGATOR",
    passwordPlain: "Investigator@123",
    role: "INVESTIGATING_OFFICER",
    name: "Det. J. Smith",
    department: "Major Crimes & Telecom Intercept Unit",
    badgeNumber: "INV-1014",
    clearanceLevel: "LEVEL 03",
  },
  ANALYST: {
    operatorId: "ANALYST",
    passwordPlain: "Analyst@123",
    role: "INTELLIGENCE_OFFICER",
    name: "Analyst C. Patel",
    department: "Graph Intelligence & Threat Analysis",
    badgeNumber: "ANL-8001",
    clearanceLevel: "LEVEL 02",
  },
  AUDITOR: {
    operatorId: "AUDITOR",
    passwordPlain: "Auditor@123",
    role: "AUDITOR",
    name: "Auditor K. Roy",
    department: "Compliance & Audit Oversight",
    badgeNumber: "AUD-5001",
    clearanceLevel: "LEVEL 03",
  },
};

exports.login = async (req, res) => {
  try {
    const { operatorId, password, cipher } = req.body;
    const inputPassword = password || cipher;

    if (!operatorId || !inputPassword) {
      return res.status(400).json({
        error: "Operator ID and password / access cipher are required.",
      });
    }

    const normalizedId = String(operatorId).trim().toUpperCase();
    let user = null;
    let isMatch = false;

    // 1. Try MongoDB lookup if DB connection is ready
    if (mongoose.connection.readyState === 1) {
      try {
        user = await User.findOne({ operatorId: normalizedId, active: true });
        if (user) {
          isMatch = await user.comparePassword(inputPassword);
        }
      } catch (dbErr) {
        console.warn("[Auth] MongoDB query failed, checking fallback:", dbErr.message);
      }
    }

    // 2. Fallback check if DB offline or empty
    if (!user && FALLBACK_OPERATORS[normalizedId]) {
      const fallback = FALLBACK_OPERATORS[normalizedId];
      if (fallback.passwordPlain === inputPassword) {
        user = fallback;
        isMatch = true;
      }
    }

    if (!user || !isMatch) {
      return res.status(401).json({
        error: "Invalid Operator ID or Access Cipher.",
      });
    }

    // Generate JWT Token
    const secret = process.env.JWT_SECRET || "tracia-super-secret-jwt-key-2026-production";
    const expiresIn = process.env.JWT_EXPIRES_IN || "8h";

    const payload = {
      sub: user.operatorId,
      operatorId: user.operatorId,
      role: user.role,
      name: user.name,
      department: user.department,
      clearanceLevel: user.clearanceLevel,
    };

    const token = jwt.sign(payload, secret, { expiresIn });

    return res.status(200).json({
      success: true,
      message: "Authentication successful.",
      token,
      operatorId: user.operatorId,
      role: user.role,
      name: user.name,
      department: user.department,
      clearanceLevel: user.clearanceLevel,
      permissions: ROLE_PERMISSIONS[user.role] || [],
    });
  } catch (err) {
    console.error("[Auth] Login error:", err);
    return res.status(500).json({
      error: "Internal server error during authentication.",
    });
  }
};

exports.getMe = async (req, res) => {
  try {
    const userRole = req.user.role.toUpperCase();
    return res.status(200).json({
      authenticated: true,
      operatorId: req.user.operatorId,
      role: req.user.role,
      name: req.user.name,
      department: req.user.department,
      clearanceLevel: req.user.clearanceLevel,
      permissions: ROLE_PERMISSIONS[userRole] || [],
    });
  } catch (err) {
    return res.status(500).json({ error: "Failed to retrieve session." });
  }
};

exports.logout = async (req, res) => {
  return res.status(200).json({
    success: true,
    message: "Session terminated successfully.",
  });
};
