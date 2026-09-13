const mongoose = require("mongoose");

// A booking of one facility for one time slot.
// Only real Date fields are used: time written as text is hard to compare
// and breaks as soon as time zones are involved.
const bookingSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    facilityId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Facility",
      required: true,
    },
    startAt: { type: Date, required: true },
    endAt: { type: Date, required: true },
    // A booking in the past is found by endAt < now, so no extra status is needed
    status: {
      type: String,
      enum: ["Active", "Cancelled"],
      default: "Active",
    },
  },
  { timestamps: true }
);

// Protection against double booking at the level of the database itself.
// Checking in code is not enough: two requests can pass the check at the same
// moment and both insert a booking. This index makes the second insert fail.
// partialFilterExpression keeps only Active bookings in the index, so after a
// cancellation the slot becomes free again.
bookingSchema.index(
  { facilityId: 1, startAt: 1 },
  { unique: true, partialFilterExpression: { status: "Active" } }
);

module.exports = mongoose.model("Booking", bookingSchema);
