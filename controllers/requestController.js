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

// Which status may follow which. An empty list means the status is final,
// so a finished request can never go back to the beginning.
const allowedTransitions = {
  Submitted: ["Reviewed", "Rejected", "Cancelled"],
  Reviewed: ["In Progress", "Rejected"],
  "In Progress": ["Completed"],
  Completed: [],
  Rejected: [],
  Cancelled: [],
};

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

// PATCH /api/requests/:id/status — the only place where the status changes
async function updateRequestStatus(req, res, next) {
  try {
    const { status, comment } = req.body;

    if (!status) {
      return res.status(400).json({ error: "New status is required" });
    }

    const request = await MaintenanceRequest.findById(req.params.id);
    if (!request) {
      return res.status(404).json({ error: "Request not found" });
    }

    const isAdmin = req.user.role === "admin";
    const isOwner = request.resident.equals(req.user._id);

    // a student may only cancel their own request while it is still Submitted
    const studentMayCancel =
      isOwner && status === "Cancelled" && request.status === "Submitted";

    if (!isAdmin && !studentMayCancel) {
      return res
        .status(403)
        .json({ error: "Only an administrator can change the status" });
    }

    // the transition table decides, not the client
    const allowed = allowedTransitions[request.status] || [];
    if (!allowed.includes(status)) {
      return res.status(409).json({
        error: `Cannot change status from "${request.status}" to "${status}"`,
      });
    }

    // one entry per change: who moved the request, from where, to where and when
    const historyEntry = {
      from: request.status,
      to: status,
      changedBy: req.user._id,
      comment: comment || "",
      changedAt: new Date(),
    };

    const updates = { status };
    if (isAdmin && comment) {
      updates.adminComment = comment;
    }

    // $push only adds to the array, so older entries can never be lost
    const updated = await MaintenanceRequest.findByIdAndUpdate(
      request._id,
      { $set: updates, $push: { statusHistory: historyEntry } },
      { new: true, runValidators: true }
    );

    res.json(updated);
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
  updateRequestStatus,
  allowedTransitions, // exported so the workflow table can be checked and reused
};
