const express = require("express");
const router = express.Router();
const {
  createBooking,
  getBookings,
  getBookingById,
  cancelBooking,
} = require("../controllers/bookingController");
const auth = require("../middleware/auth");

// Every route below needs a valid token
router.use(auth);

router.get("/", getBookings);
router.post("/", createBooking);
router.get("/:id", getBookingById);

// cancelling keeps the row and only changes the status
router.delete("/:id", cancelBooking);

module.exports = router;
