const jwt = require("jsonwebtoken");
const User = require("../models/User");

// Checks the token from the request and puts the current user into req.user.
// Routes that use this middleware can only be reached with a valid token.
async function auth(req, res, next) {
  const header = req.headers.authorization;

  // the header must look like: Authorization: Bearer <token>
  if (!header || !header.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Authentication required" });
  }

  const token = header.split(" ")[1];

  let decoded;
  try {
    // verify fails if the signature is wrong or the token has expired
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }

  try {
    // the token only stores the id, so the real user is loaded from the database
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({ error: "Authentication required" });
    }

    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
}

module.exports = auth;
