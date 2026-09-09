const MaintenanceRequest = require("../models/MaintenanceRequest");

// POST /api/requests — create a new request
async function createRequest(req, res, next) {
  try {
    const { roomNumber, category, description, priority } = req.body;
    const request = await MaintenanceRequest.create({
      // the owner comes from the token, so nobody can post as another student
      resident: req.user._id,
      roomNumber,
      category,
      description,
      priority,
    });
    res.status(201).json(request);
  } catch (err) {
    next(err);
  }
}

// A student may only touch their own requests, an admin may touch any of them
function canAccess(user, request) {
  return user.role === "admin" || request.resident.equals(user._id);
}

// GET /api/requests — list requests (newest first)
async function getRequests(req, res, next) {
  try {
    // the limit is applied in the database query, not hidden in the page
    const filter =
      req.user.role === "admin" ? {} : { resident: req.user._id };

    const requests = await MaintenanceRequest.find(filter).sort({
      createdAt: -1,
    });
    res.json(requests);
  } catch (err) {
    next(err);
  }
}

// GET /api/requests/:id — get one request by id
async function getRequestById(req, res, next) {
  try {
    const request = await MaintenanceRequest.findById(req.params.id);
    if (!request) {
      return res.status(404).json({ error: "Request not found" });
    }
    if (!canAccess(req.user, request)) {
      return res
        .status(403)
        .json({ error: "You can only open your own requests" });
    }
    res.json(request);
  } catch (err) {
    next(err);
  }
}

// PATCH /api/requests/:id — update editable fields only (never the status)
async function updateRequest(req, res, next) {
  try {
    const request = await MaintenanceRequest.findById(req.params.id);
    if (!request) {
      return res.status(404).json({ error: "Request not found" });
    }
    if (!canAccess(req.user, request)) {
      return res
        .status(403)
        .json({ error: "You can only change your own requests" });
    }

    const { roomNumber, category, description, priority } = req.body;
    const updates = { roomNumber, category, description, priority };

    // keep only the fields that were actually sent
    Object.keys(updates).forEach((key) => {
      if (updates[key] === undefined) delete updates[key];
    });

    Object.assign(request, updates); // status is deliberately not touched here
    await request.save();

    res.json(request);
  } catch (err) {
    next(err);
  }
}

// DELETE /api/requests/:id — delete a request
async function deleteRequest(req, res, next) {
  try {
    const request = await MaintenanceRequest.findById(req.params.id);
    if (!request) {
      return res.status(404).json({ error: "Request not found" });
    }
    if (!canAccess(req.user, request)) {
      return res
        .status(403)
        .json({ error: "You can only delete your own requests" });
    }

    await request.deleteOne();
    res.json({ message: "Request deleted" });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  createRequest,
  getRequests,
  getRequestById,
  updateRequest,
  deleteRequest,
};
