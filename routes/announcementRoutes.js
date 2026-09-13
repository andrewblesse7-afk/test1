const express = require("express");
const router = express.Router();
const {
  getAnnouncements,
  getAnnouncementById,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
} = require("../controllers/announcementController");
const auth = require("../middleware/auth");
const requireAdmin = require("../middleware/requireAdmin");

// Every route below needs a valid token
router.use(auth);

// Students can only read
router.get("/", getAnnouncements);
router.get("/:id", getAnnouncementById);

// Writing is only for administrators
router.post("/", requireAdmin, createAnnouncement);
router.patch("/:id", requireAdmin, updateAnnouncement);
router.delete("/:id", requireAdmin, deleteAnnouncement);

module.exports = router;
