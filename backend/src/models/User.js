const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const UserSchema = new mongoose.Schema(
  {
    operatorId: {
      type: String,
      required: [true, "Operator ID is required"],
      unique: true,
      trim: true,
      uppercase: true,
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: 6,
    },
    role: {
      type: String,
      required: [true, "User role is required"],
      enum: ["ADMIN", "INVESTIGATING_OFFICER", "INTELLIGENCE_OFFICER", "AUDITOR"],
      default: "INVESTIGATING_OFFICER",
    },
    name: {
      type: String,
      required: true,
    },
    department: {
      type: String,
      default: "General Operations",
    },
    badgeNumber: {
      type: String,
      default: "",
    },
    clearanceLevel: {
      type: String,
      default: "LEVEL 02",
    },
    active: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Pre-save password hashing
UserSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    return next();
  }
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});

// Compare password method
UserSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model("User", UserSchema);
