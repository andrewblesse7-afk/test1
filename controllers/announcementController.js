const Announcement = require("../models/Announcement");

// GET /api/announcements — everyone who is logged in can read announcements
async function getAnnouncements(req, res, next) {
  try {
    const announcements = await Announcement.find()
      .populate("createdBy", "name")
      .sort({ createdAt: -1 });
    res.json(announcements);
  } catch (err) {
    next(err);
  }
}

// GET /api/announcements/:id — one announcement
async function getAnnouncementById(req, res, next) {
  try {
    const announcement = await Announcement.findById(req.params.id).populate(
      "createdBy",
      "name"
    );
    if (!announcement) {
      return res.status(404).json({ error: "Announcement not found" });
    }
    res.json(announcement);
  } catch (err) {
    next(err);
  }
}

// POST /api/announcements — create an announcement (admin only)
async function createAnnouncement(req, res, next) {
  try {
    const { title, content, category } = req.body;

    if (!title || !content) {
      return res.status(400).json({ error: "Title and content are required" });
    }

    const announcement = await Announcement.create({
      title,
      content,
      category,
      // the author comes from the token
      createdBy: req.user._id,
    });

    res.status(201).json(announcement);
  } catch (err) {
    next(err);
  }
}

// PATCH /api/announcements/:id — change an announcement (admin only)
async function updateAnnouncement(req, res, next) {
  try {
    const { title, content, category } = req.body;
    const updates = { title, content, category };

    // keep only the fields that were actually sent
    Object.keys(updates).forEach((key) => {
      if (updates[key] === undefined) delete updates[key];
    });

    const announcement = await Announcement.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    );
    if (!announcement) {
      return res.status(404).json({ error: "Announcement not found" });
    }
    res.json(announcement);
  } catch (err) {
    next(err);
  }
}

// DELETE /api/announcements/:id — remove an announcement (admin only)
async function deleteAnnouncement(req, res, next) {
  try {
    const announcement = await Announcement.findByIdAndDelete(req.params.id);
    if (!announcement) {
      return res.status(404).json({ error: "Announcement not found" });
    }
    res.json({ message: "Announcement deleted" });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getAnnouncements,
  getAnnouncementById,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
};
