// One place that turns errors into proper HTTP answers.
// Express recognizes an error handler by its four parameters.
function errorHandler(err, req, res, next) {
  // a badly formed id, for example /api/requests/abc
  if (err.name === "CastError") {
    return res.status(400).json({ error: "Invalid id" });
  }

  // a model rejected the data: missing field, value outside the enum, ...
  if (err.name === "ValidationError") {
    const message = Object.values(err.errors)
      .map((error) => error.message)
      .join(", ");
    return res.status(400).json({ error: message });
  }

  // a unique index rejected the value, for example an email already in use
  if (err.code === 11000) {
    return res.status(409).json({ error: "This value is already used" });
  }

  // anything we did not expect stays a 500, and the details go to the log only
  console.error(err.message);
  res.status(500).json({ error: "Internal server error" });
}

module.exports = errorHandler;
