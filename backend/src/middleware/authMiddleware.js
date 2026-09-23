const jwt = require("jsonwebtoken");

const ROLE_PERMISSIONS = {
  ADMIN: [
    "cases.view",
    "cases.viewAll",
    "cases.assign",
    "cases.approveAccess",
    "evidence.view",
    "evidence.upload",
    "reports.view",
    "graph.view",
    "audit.view",
    "operators.manage",
  ],
  INVESTIGATING_OFFICER: [
    "cases.view",
    "cases.viewAssigned",
    "cases.viewRelated",
    "cases.requestAccess",
    "evidence.view",
    "evidence.upload",
    "reports.view",
    "graph.view",
  ],
  INTELLIGENCE_OFFICER: [
    "cases.view",
    "cases.viewAssigned",
    "cases.viewRelated",
    "cases.requestAccess",
    "graph.view",
    "reports.view",
  ],
  AUDITOR: [
    "cases.view",
    "audit.view",
    "reports.view",
  ],
};

function verifyToken(req, res, next) {
  let token = null;

  if (req.headers.authorization && req.headers.authorization.startsWith("Bearer ")) {
    token = req.headers.authorization.split(" ")[1];
  } else if (req.cookies && req.cookies.tracia_access_token) {
    token = req.cookies.tracia_access_token;
  }

  if (!token) {
    return res.status(401).json({
      error: "Authentication required. Missing Bearer token.",
      authenticated: false,
    });
  }

  const secret = process.env.JWT_SECRET || "tracia-super-secret-jwt-key-2026-production";

  try {
    const decoded = jwt.verify(token, secret);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({
      error: "Invalid or expired session token.",
      authenticated: false,
    });
  }
}

function requireRole(allowedRoles) {
  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      return res.status(401).json({ error: "Unauthorized. Operator profile not found in token." });
    }

    const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
    const userRole = req.user.role.toUpperCase();

    if (!roles.map((r) => r.toUpperCase()).includes(userRole)) {
      return res.status(403).json({
        error: `Access Denied: Role '${req.user.role}' is not authorized to access this resource.`,
        requiredRoles: roles,
        userRole: req.user.role,
      });
    }

    next();
  };
}

function requirePermission(permission) {
  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      return res.status(401).json({ error: "Unauthorized. Operator profile not found in token." });
    }

    const userRole = req.user.role.toUpperCase();
    const perms = ROLE_PERMISSIONS[userRole] || [];

    if (!perms.includes(permission)) {
      return res.status(403).json({
        error: `Access Denied: Missing permission '${permission}' for role '${req.user.role}'.`,
        requiredPermission: permission,
        userRole: req.user.role,
      });
    }

    next();
  };
}

module.exports = {
  verifyToken,
  requireRole,
  requirePermission,
  ROLE_PERMISSIONS,
};
