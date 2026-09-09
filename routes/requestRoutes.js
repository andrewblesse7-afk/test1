const express = require("express");
const router = express.Router();
const {
  createRequest,
  getRequests,
  getRequestById,
  updateRequest,
  deleteRequest,
} = require("../controllers/requestController");
const auth = require("../middleware/auth");

// Every route below needs a valid token
router.use(auth);

// Paths are relative to the mount point (/api/requests, set in server.js)
router.get("/", getRequests);
router.post("/", createRequest);
router.get("/:id", getRequestById);
router.patch("/:id", updateRequest);
router.delete("/:id", deleteRequest);

module.exports = router;
