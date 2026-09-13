const Facility = require("../models/Facility");

// GET /api/facilities — list all facilities (any logged in user)
async function getFacilities(req, res, next) {
  try {
    const facilities = await Facility.find().sort({ name: 1 });
    res.json(facilities);
  } catch (err) {
    next(err);
  }
}

// GET /api/facilities/:id — one facility
async function getFacilityById(req, res, next) {
  try {
    const facility = await Facility.findById(req.params.id);
    if (!facility) {
      return res.status(404).json({ error: "Facility not found" });
    }
    res.json(facility);
  } catch (err) {
    next(err);
  }
}

// POST /api/facilities — create a facility (admin only)
async function createFacility(req, res, next) {
  try {
    const { name, description, location, capacity, available, slotMinutes, pricePerSlot } =
      req.body;

    if (!name) {
      return res.status(400).json({ error: "Name is required" });
    }

    const facility = await Facility.create({
      name,
      description,
      location,
      capacity,
      available,
      slotMinutes,
      pricePerSlot,
    });
    res.status(201).json(facility);
  } catch (err) {
    next(err);
  }
}

// PATCH /api/facilities/:id — change a facility (admin only)
async function updateFacility(req, res, next) {
  try {
    const { name, description, location, capacity, available, slotMinutes, pricePerSlot } =
      req.body;
    const updates = {
      name,
      description,
      location,
      capacity,
      available,
      slotMinutes,
      pricePerSlot,
    };

    // keep only the fields that were actually sent
    Object.keys(updates).forEach((key) => {
      if (updates[key] === undefined) delete updates[key];
    });

    const facility = await Facility.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true,
    });
    if (!facility) {
      return res.status(404).json({ error: "Facility not found" });
    }
    res.json(facility);
  } catch (err) {
    next(err);
  }
}

// DELETE /api/facilities/:id — remove a facility (admin only)
async function deleteFacility(req, res, next) {
  try {
    const facility = await Facility.findByIdAndDelete(req.params.id);
    if (!facility) {
      return res.status(404).json({ error: "Facility not found" });
    }
    res.json({ message: "Facility deleted" });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getFacilities,
  getFacilityById,
  createFacility,
  updateFacility,
  deleteFacility,
};
