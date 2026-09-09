const mongoose = require("mongoose");

// Maintenance request submitted by a student.
// "resident" points to the User who created the request.
const maintenanceRequestSchema = new mongoose.Schema(
  {
    resident: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
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
