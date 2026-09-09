const bcrypt = require("bcrypt");
const User = require("../models/User");

// POST /api/auth/register — create a new account
async function register(req, res, next) {
  try {
    const { name, email, password, roomNumber } = req.body;

    if (!name || !email || !password) {
      return res
        .status(400)
        .json({ error: "Name, email and password are required" });
    }

    const existing = await User.findOne({ email: email.toLowerCase().trim() });
    if (existing) {
      return res.status(409).json({ error: "Email is already registered" });
    }

    // 10 is the cost factor: the higher it is, the slower a brute force attack
    const passwordHash = await bcrypt.hash(password, 10);

    const user = await User.create({ name, email, passwordHash, roomNumber });

    // the hash is never sent back to the browser
    res.status(201).json({
      id: user._id,
      name: user.name,
      email: user.email,
      roomNumber: user.roomNumber,
      role: user.role,
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { register };
