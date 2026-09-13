const express = require("express");
const router = express.Router();
const {
  createBooking,
  getBookings,
  getBookingById,
} = require("../controllers/bookingController");
const auth = require("../middleware/auth");

// Every route below needs a valid token
router.use(auth);

router.get("/", getBookings);
router.post("/", createBooking);
router.get("/:id", getBookingById);

module.exports = router;
