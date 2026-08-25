const mongoose = require("mongoose");

// Maintenance request submitted by a student.
// "resident" holds the student's name as a string for now;
// it becomes a reference to the User model in Phase 4.
const maintenanceRequestSchema = new mongoose.Schema(
  {
    resident: { type: String, required: true },
    roomNumber: { type: String, required: true },
    category: {
      type: String,
      enum: ["Plumbing", "Electricity", "Heating", "Furniture", "Internet", "Other"],
      required: true,
    },
    description: { type: String, required: true },
    priority: {
      type: String,
      enum: ["Low", "Medium", "High", "Urgent"],
      default: "Medium",
    },
    status: {
      type: String,
      enum: ["Submitted", "Reviewed", "In Progress", "Completed", "Rejected"],
      default: "Submitted",
    },
    adminComment: { type: String, default: "" },
  },
  { timestamps: true } // adds createdAt and updatedAt automatically
);

module.exports = mongoose.model("MaintenanceRequest", maintenanceRequestSchema);
