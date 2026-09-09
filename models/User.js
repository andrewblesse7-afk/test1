const mongoose = require("mongoose");

// A user of the portal: either a student or an administrator.
// The plain password is never stored, only its bcrypt hash.
const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    // select: false means this field is not loaded by normal queries,
    // so the hash cannot leak into an API response by accident.
    passwordHash: { type: String, required: true, select: false },
    roomNumber: { type: String },
    role: {
      type: String,
      enum: ["student", "admin"],
      default: "student",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
