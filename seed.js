require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const User = require("./models/User");
const MaintenanceRequest = require("./models/MaintenanceRequest");
const Facility = require("./models/Facility");
const Booking = require("./models/Booking");

// Demo data for the project. Running this DELETES everything in the database
// and fills it again, so the app is never empty during a presentation.

// Helper: a date a number of days from today at a given hour
function daysFromNow(days, hour) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  date.setHours(hour, 0, 0, 0);
  return date;
}

async function seed() {
  if (!process.env.MONGODB_URI) {
    console.error("MONGODB_URI is not set. Copy .env.example to .env first.");
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGODB_URI);
  console.log("Connected to MongoDB");

  await Promise.all([
    User.deleteMany({}),
    MaintenanceRequest.deleteMany({}),
    Facility.deleteMany({}),
    Booking.deleteMany({}),
  ]);
  console.log("Old data removed");

  // every demo account uses the same password
  const passwordHash = await bcrypt.hash("password123", 10);

  const [admin, anna, bob, clara] = await User.create([
    {
      name: "Admin User",
      email: "admin@dormflow.test",
      passwordHash,
      role: "admin",
    },
    {
      name: "Anna Novak",
      email: "anna@dormflow.test",
      passwordHash,
      roomNumber: "204",
    },
    {
      name: "Bob Silva",
      email: "bob@dormflow.test",
      passwordHash,
      roomNumber: "112",
    },
    {
      name: "Clara Weiss",
      email: "clara@dormflow.test",
      passwordHash,
      roomNumber: "305",
    },
  ]);
  console.log("Users created: 1 admin, 3 students");

  const [laundry, study, common, gym] = await Facility.create([
    {
      name: "Laundry Room",
      description: "Four washing machines and two dryers.",
      location: "Floor 1",
      capacity: 4,
      slotMinutes: 60,
      pricePerSlot: 2,
    },
    {
      name: "Study Room",
      description: "Quiet room with desks for group work.",
      location: "Floor 2",
      capacity: 8,
      slotMinutes: 60,
    },
    {
      name: "Common Room",
      description: "Shared room with sofas and a television.",
      location: "Floor 1",
      capacity: 20,
      slotMinutes: 120,
    },
    {
      name: "Gym Room",
      description: "Small gym with basic equipment.",
      location: "Basement",
      capacity: 6,
      slotMinutes: 60,
    },
  ]);
  console.log("Facilities created: 4");

  await MaintenanceRequest.create([
    {
      resident: anna._id,
      roomNumber: "204",
      category: "Plumbing",
      description: "The sink in the bathroom is leaking.",
      priority: "High",
      status: "Submitted",
    },
    {
      resident: anna._id,
      roomNumber: "204",
      category: "Heating",
      description: "The radiator stays cold in the morning.",
      priority: "Urgent",
      status: "In Progress",
      adminComment: "A technician will come on Thursday.",
      statusHistory: [
        {
          from: "Submitted",
          to: "Reviewed",
          changedBy: admin._id,
          comment: "Checked with the caretaker.",
          changedAt: daysFromNow(-4, 9),
        },
        {
          from: "Reviewed",
          to: "In Progress",
          changedBy: admin._id,
          comment: "A technician will come on Thursday.",
          changedAt: daysFromNow(-2, 11),
        },
      ],
    },
    {
      resident: anna._id,
      roomNumber: "204",
      category: "Internet",
      description: "Wi-Fi is very slow in the evening.",
      priority: "Low",
      status: "Completed",
      statusHistory: [
        {
          from: "Submitted",
          to: "Reviewed",
          changedBy: admin._id,
          comment: "",
          changedAt: daysFromNow(-12, 10),
        },
        {
          from: "Reviewed",
          to: "In Progress",
          changedBy: admin._id,
          comment: "Router replaced.",
          changedAt: daysFromNow(-10, 14),
        },
        {
          from: "In Progress",
          to: "Completed",
          changedBy: admin._id,
          comment: "Speed is back to normal.",
          changedAt: daysFromNow(-9, 16),
        },
      ],
    },
    {
      resident: bob._id,
      roomNumber: "112",
      category: "Electricity",
      description: "One socket near the desk does not work.",
      priority: "Medium",
      status: "Reviewed",
      statusHistory: [
        {
          from: "Submitted",
          to: "Reviewed",
          changedBy: admin._id,
          comment: "Added to the weekly list.",
          changedAt: daysFromNow(-3, 12),
        },
      ],
    },
    {
      resident: bob._id,
      roomNumber: "112",
      category: "Furniture",
      description: "The desk chair is broken and cannot be adjusted.",
      priority: "Low",
      status: "Submitted",
    },
    {
      resident: bob._id,
      roomNumber: "112",
      category: "Plumbing",
      description: "The shower drains very slowly.",
      priority: "Medium",
      status: "Completed",
      statusHistory: [
        {
          from: "Submitted",
          to: "Reviewed",
          changedBy: admin._id,
          comment: "",
          changedAt: daysFromNow(-20, 9),
        },
        {
          from: "Reviewed",
          to: "In Progress",
          changedBy: admin._id,
          comment: "",
          changedAt: daysFromNow(-18, 10),
        },
        {
          from: "In Progress",
          to: "Completed",
          changedBy: admin._id,
          comment: "Pipe cleaned.",
          changedAt: daysFromNow(-17, 15),
        },
      ],
    },
    {
      resident: bob._id,
      roomNumber: "112",
      category: "Other",
      description: "The window in the corridor does not close properly.",
      priority: "Medium",
      status: "Rejected",
      adminComment: "This is handled by the building company, not the dorm.",
      statusHistory: [
        {
          from: "Submitted",
          to: "Rejected",
          changedBy: admin._id,
          comment: "This is handled by the building company, not the dorm.",
          changedAt: daysFromNow(-6, 13),
        },
      ],
    },
    {
      resident: clara._id,
      roomNumber: "305",
      category: "Heating",
      description: "The room is too hot and the valve is stuck.",
      priority: "High",
      status: "In Progress",
      statusHistory: [
        {
          from: "Submitted",
          to: "Reviewed",
          changedBy: admin._id,
          comment: "",
          changedAt: daysFromNow(-5, 9),
        },
        {
          from: "Reviewed",
          to: "In Progress",
          changedBy: admin._id,
          comment: "Parts ordered.",
          changedAt: daysFromNow(-1, 9),
        },
      ],
    },
    {
      resident: clara._id,
      roomNumber: "305",
      category: "Internet",
      description: "The network cable in the room is damaged.",
      priority: "Medium",
      status: "Submitted",
    },
    {
      resident: clara._id,
      roomNumber: "305",
      category: "Electricity",
      description: "The ceiling lamp flickers.",
      priority: "Low",
      status: "Cancelled",
      statusHistory: [
        {
          from: "Submitted",
          to: "Cancelled",
          changedBy: clara._id,
          comment: "Fixed it myself.",
          changedAt: daysFromNow(-8, 18),
        },
      ],
    },
    {
      resident: clara._id,
      roomNumber: "305",
      category: "Furniture",
      description: "The wardrobe door came off its hinge.",
      priority: "High",
      status: "Reviewed",
      statusHistory: [
        {
          from: "Submitted",
          to: "Reviewed",
          changedBy: admin._id,
          comment: "",
          changedAt: daysFromNow(-2, 8),
        },
      ],
    },
    {
      resident: anna._id,
      roomNumber: "204",
      category: "Other",
      description: "The light in the shared kitchen is missing a bulb.",
      priority: "Low",
      status: "Submitted",
    },
    {
      resident: bob._id,
      roomNumber: "112",
      category: "Internet",
      description: "No connection in the room since yesterday.",
      priority: "Urgent",
      status: "Submitted",
    },
  ]);
  console.log("Maintenance requests created: 13");

  await Booking.create([
    // past bookings (endAt is already behind us)
    {
      userId: anna._id,
      facilityId: laundry._id,
      startAt: daysFromNow(-6, 10),
      endAt: daysFromNow(-6, 11),
    },
    {
      userId: bob._id,
      facilityId: gym._id,
      startAt: daysFromNow(-3, 18),
      endAt: daysFromNow(-3, 19),
    },
    {
      userId: clara._id,
      facilityId: common._id,
      startAt: daysFromNow(-2, 16),
      endAt: daysFromNow(-2, 18),
    },
    // future bookings
    {
      userId: anna._id,
      facilityId: study._id,
      startAt: daysFromNow(2, 14),
      endAt: daysFromNow(2, 15),
    },
    {
      userId: anna._id,
      facilityId: laundry._id,
      startAt: daysFromNow(4, 9),
      endAt: daysFromNow(4, 10),
    },
    {
      userId: bob._id,
      facilityId: gym._id,
      startAt: daysFromNow(3, 18),
      endAt: daysFromNow(3, 19),
    },
    // a cancelled booking: the slot is free again
    {
      userId: clara._id,
      facilityId: study._id,
      startAt: daysFromNow(5, 12),
      endAt: daysFromNow(5, 13),
      status: "Cancelled",
    },
  ]);
  console.log("Bookings created: 7 (3 past, 3 upcoming, 1 cancelled)");

  console.log("\nDemo accounts (password for all: password123)");
  console.log("  admin@dormflow.test  (admin)");
  console.log("  anna@dormflow.test   (student, room 204)");
  console.log("  bob@dormflow.test    (student, room 112)");
  console.log("  clara@dormflow.test  (student, room 305)");

  await mongoose.disconnect();
  console.log("\nSeed finished");
}

seed().catch(async (err) => {
  console.error("Seed failed:", err.message);
  await mongoose.disconnect();
  process.exit(1);
});
