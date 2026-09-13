const Booking = require("../models/Booking");

// A student may only touch their own bookings, an admin may touch any of them
function canAccess(user, booking) {
  return user.role === "admin" || booking.userId.equals(user._id);
}

// POST /api/bookings — book a slot in a facility
async function createBooking(req, res, next) {
  try {
    const { facilityId, startAt, endAt } = req.body;

    if (!facilityId || !startAt || !endAt) {
      return res
        .status(400)
        .json({ error: "Facility, start time and end time are required" });
    }

    const start = new Date(startAt);
    const end = new Date(endAt);

    // an unreadable date becomes an "Invalid Date", which has a NaN time
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      return res
        .status(400)
        .json({ error: "Start and end time must be valid dates" });
    }

    if (end <= start) {
      return res
        .status(400)
        .json({ error: "End time must be after start time" });
    }

    if (start < new Date()) {
      return res.status(400).json({ error: "Cannot book a time in the past" });
    }

    // Two slots overlap when the new one starts before the old one ends
    // and ends after the old one starts. Only Active bookings block a slot.
    const overlapping = await Booking.findOne({
      facilityId,
      status: "Active",
      startAt: { $lt: end },
      endAt: { $gt: start },
    });

    if (overlapping) {
      return res
        .status(409)
        .json({ error: "This time slot is already booked" });
    }

    const booking = await Booking.create({
      // the owner comes from the token, not from the body
      userId: req.user._id,
      facilityId,
      startAt: start,
      endAt: end,
    });

    res.status(201).json(booking);
  } catch (err) {
    // 11000 is the duplicate key error from the unique slot index. It happens
    // when two requests pass the check above at the same moment: the database
    // lets only one of them in.
    if (err.code === 11000) {
      return res
        .status(409)
        .json({ error: "This time slot is already booked" });
    }
    next(err);
  }
}

// GET /api/bookings — a student sees their own bookings, an admin sees all
async function getBookings(req, res, next) {
  try {
    const filter = req.user.role === "admin" ? {} : { userId: req.user._id };

    // populate replaces the facility id with the fields we ask for
    const bookings = await Booking.find(filter)
      .populate("facilityId", "name location pricePerSlot")
      .sort({ startAt: -1 });

    res.json(bookings);
  } catch (err) {
    next(err);
  }
}

// GET /api/bookings/:id — one booking
async function getBookingById(req, res, next) {
  try {
    const booking = await Booking.findById(req.params.id).populate(
      "facilityId",
      "name location pricePerSlot"
    );
    if (!booking) {
      return res.status(404).json({ error: "Booking not found" });
    }
    if (!canAccess(req.user, booking)) {
      return res
        .status(403)
        .json({ error: "You can only open your own bookings" });
    }
    res.json(booking);
  } catch (err) {
    next(err);
  }
}

module.exports = { createBooking, getBookings, getBookingById };
