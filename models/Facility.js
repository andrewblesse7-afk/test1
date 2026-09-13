const mongoose = require("mongoose");

// A shared room students can book, for example a laundry or a study room.
const facilitySchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    description: { type: String, default: "" },
    location: { type: String, default: "" },
    capacity: { type: Number, default: 1 },
    // an unavailable facility is closed for new bookings
    available: { type: Boolean, default: true },
    // length of one booking slot in minutes
    slotMinutes: { type: Number, default: 60 },
    // price of one slot in euro; 0 means the facility is free
    pricePerSlot: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Facility", facilitySchema);
