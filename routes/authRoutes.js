const express = require("express");
const router = express.Router();
const { register, login, me } = require("../controllers/authController");
const auth = require("../middleware/auth");

// Paths are relative to the mount point (/api/auth, set in server.js)
router.post("/register", register);
router.post("/login", login);

// auth runs first: without a valid token the request never reaches me()
router.get("/me", auth, me);

module.exports = router;
