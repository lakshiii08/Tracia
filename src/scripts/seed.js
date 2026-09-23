require("dotenv").config({ path: require("path").resolve(__dirname, "../../.env") });
const mongoose = require("mongoose");
const User = require("../models/User");
const connectDB = require("../config/db");

const SEED_OPERATORS = [
  {
    operatorId: "ADMIN",
    password: "Admin@123",
    role: "ADMIN",
    name: "Aarav Mehta (Admin)",
    department: "Central Cyber Command & Oversight",
    badgeNumber: "ADM-9001",
    clearanceLevel: "LEVEL 04",
  },
  {
    operatorId: "INVESTIGATOR",
    password: "Investigator@123",
    role: "INVESTIGATING_OFFICER",
    name: "Det. J. Smith",
    department: "Major Crimes & Telecom Intercept Unit",
    badgeNumber: "INV-1014",
    clearanceLevel: "LEVEL 03",
  },
  {
    operatorId: "ANALYST",
    password: "Analyst@123",
    role: "INTELLIGENCE_OFFICER",
    name: "Analyst C. Patel",
    department: "Graph Intelligence & Threat Analysis",
    badgeNumber: "ANL-8001",
    clearanceLevel: "LEVEL 02",
  },
  {
    operatorId: "AUDITOR",
    password: "Auditor@123",
    role: "AUDITOR",
    name: "Auditor K. Roy",
    department: "Compliance & Audit Oversight",
    badgeNumber: "AUD-5001",
    clearanceLevel: "LEVEL 03",
  },
];

async function seedUsers() {
  try {
    for (const op of SEED_OPERATORS) {
      const existing = await User.findOne({ operatorId: op.operatorId });
      if (!existing) {
        await User.create(op);
        console.log(`[Seed] Created operator: ${op.operatorId} (${op.role})`);
      } else {
        // Update password & role to guarantee credentials match
        existing.password = op.password;
        existing.role = op.role;
        existing.name = op.name;
        existing.department = op.department;
        existing.badgeNumber = op.badgeNumber;
        existing.clearanceLevel = op.clearanceLevel;
        existing.active = true;
        await existing.save();
        console.log(`[Seed] Synchronized operator: ${op.operatorId} (${op.role})`);
      }
    }
    console.log("[Seed] Operator seeding complete.");
    return true;
  } catch (err) {
    console.error("[Seed] Error seeding users:", err.message);
    return false;
  }
}

// Standalone execution
if (require.main === module) {
  (async () => {
    const connected = await connectDB();
    if (connected) {
      await seedUsers();
    }
    await mongoose.disconnect();
    process.exit(0);
  })();
}

module.exports = { seedUsers, SEED_OPERATORS };
