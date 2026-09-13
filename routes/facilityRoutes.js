const express = require("express");
const router = express.Router();
const {
  getFacilities,
  getFacilityById,
  createFacility,
  updateFacility,
  deleteFacility,
} = require("../controllers/facilityController");
const auth = require("../middleware/auth");
const requireAdmin = require("../middleware/requireAdmin");

// Every route below needs a valid token
router.use(auth);

// Reading is open to any logged in user
router.get("/", getFacilities);
router.get("/:id", getFacilityById);

// Changing facilities is only for administrators
router.post("/", requireAdmin, createFacility);
router.patch("/:id", requireAdmin, updateFacility);
router.delete("/:id", requireAdmin, deleteFacility);

module.exports = router;
