const MaintenanceRequest = require("../models/MaintenanceRequest");

// POST /api/requests — create a new request
async function createRequest(req, res, next) {
  try {
    const { resident, roomNumber, category, description, priority } = req.body;
    const request = await MaintenanceRequest.create({
      resident,
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

// GET /api/requests — list all requests (newest first)
async function getRequests(req, res, next) {
  try {
    const requests = await MaintenanceRequest.find().sort({ createdAt: -1 });
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
    res.json(request);
  } catch (err) {
    next(err);
  }
}

// PATCH /api/requests/:id — update editable fields only (never the status)
async function updateRequest(req, res, next) {
  try {
    const { roomNumber, category, description, priority } = req.body;
    const updates = { roomNumber, category, description, priority };

    // keep only the fields that were actually sent
    Object.keys(updates).forEach((key) => {
      if (updates[key] === undefined) delete updates[key];
    });

    const request = await MaintenanceRequest.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    );
    if (!request) {
      return res.status(404).json({ error: "Request not found" });
    }
    res.json(request);
  } catch (err) {
    next(err);
  }
}

// DELETE /api/requests/:id — delete a request
async function deleteRequest(req, res, next) {
  try {
    const request = await MaintenanceRequest.findByIdAndDelete(req.params.id);
    if (!request) {
      return res.status(404).json({ error: "Request not found" });
    }
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
