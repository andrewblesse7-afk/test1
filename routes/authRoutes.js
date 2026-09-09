const express = require("express");
const router = express.Router();
const { register } = require("../controllers/authController");

// Paths are relative to the mount point (/api/auth, set in server.js)
router.post("/register", register);

module.exports = router;
