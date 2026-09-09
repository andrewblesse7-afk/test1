const express = require("express");
const router = express.Router();
const { register, login } = require("../controllers/authController");

// Paths are relative to the mount point (/api/auth, set in server.js)
router.post("/register", register);
router.post("/login", login);

module.exports = router;
