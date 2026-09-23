const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const { verifyToken } = require("../middleware/authMiddleware");

// Public authentication endpoint
router.post("/login", authController.login);

// Authenticated session profile endpoint
router.get("/me", verifyToken, authController.getMe);

// Logout endpoint
router.post("/logout", authController.logout);

module.exports = router;
