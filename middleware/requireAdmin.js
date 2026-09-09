// Lets the request through only for administrators.
// It must run after the auth middleware, which puts the user into req.user.
function requireAdmin(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ error: "Authentication required" });
  }

  if (req.user.role !== "admin") {
    return res.status(403).json({ error: "Administrator access required" });
  }

  next();
}

module.exports = requireAdmin;
