require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");

const app = express();
const PORT = process.env.PORT || 3000;

// Connect to MongoDB using the connection string from .env
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("MongoDB connection error:", err.message));

// Serve static files (HTML, CSS, JS) from the "public" folder
app.use(express.static("public"));

// Health check route: used to verify that the server is running
app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

// 404 handler: runs when no route or static file matched the request
app.use((req, res) => {
  res.status(404).json({ error: "Not found" });
});

// Error handler: runs when a route passes an error to next(err)
// Express recognizes it by the four parameters (err first)
app.use((err, req, res, next) => {
  console.error(err.message);
  res.status(500).json({ error: "Internal server error" });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
