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
      enum: [
        "Submitted",
        "Reviewed",
        "In Progress",
        "Completed",
        "Rejected",
        "Cancelled",
      ],
      default: "Submitted",
    },
    adminComment: { type: String, default: "" },
    // Journal of every status change. Entries are only added, never edited.
    statusHistory: [
      {
        from: String,
        to: String,
        changedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        comment: String,
        changedAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true } // adds createdAt and updatedAt automatically
);

// Indexes for the two lists the application asks for most often.
// Without an index MongoDB reads the whole collection; with one it goes
// straight to the matching documents, already in the right order.
maintenanceRequestSchema.index({ status: 1, createdAt: -1 }); // admin list by status
maintenanceRequestSchema.index({ resident: 1, createdAt: -1 }); // "my requests"

module.exports = mongoose.model("MaintenanceRequest", maintenanceRequestSchema);
