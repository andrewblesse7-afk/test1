const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
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

// POST /api/auth/login — check the password and give back a token
async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    // passwordHash has select: false in the model, so it must be asked for
    const user = await User.findOne({
      email: email.toLowerCase().trim(),
    }).select("+passwordHash");

    // the same message in both cases, so nobody can find out which emails exist
    if (!user) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const passwordMatches = await bcrypt.compare(password, user.passwordHash);
    if (!passwordMatches) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    // the token says who the user is; it is signed with the secret from .env
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        roomNumber: user.roomNumber,
        role: user.role,
      },
    });
  } catch (err) {
    next(err);
  }
}

// GET /api/auth/me — data about the user who owns the token
function me(req, res) {
  // req.user was loaded from the database by the auth middleware
  res.json({
    id: req.user._id,
    name: req.user.name,
    email: req.user.email,
    roomNumber: req.user.roomNumber,
    role: req.user.role,
  });
}

module.exports = { register, login, me };
