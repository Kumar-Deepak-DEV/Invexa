const express = require('express');
const mongoose = require('mongoose');
const Location = require('../models/Location');
const Warehouse = require('../models/Warehouse');
const { requireAuth } = require('../middleware/auth');
const { hasNonZeroStock } = require('../services/stockCheck');

const router = express.Router();

/**
 * GET /api/locations
 */
router.get('/', requireAuth, async (req, res, next) => {
  try {
    const { warehouseId, active = 'true' } = req.query;
    const filter = {};
    if (active === 'true') filter.active = true;
    else if (active === 'false') filter.active = false;
    if (warehouseId) filter.warehouseId = new mongoose.Types.ObjectId(warehouseId);

    const locations = await Location.find(filter).sort({ createdAt: 1 }).lean();
    const enriched = locations.map((l) => ({ ...l, id: l._id.toString() }));

    res.json(enriched);
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/locations
 */
router.post('/', requireAuth, async (req, res, next) => {
  try {
    const { warehouseId, name, code, warehouseName, type, capacity, occupied, aisle, shelf } = req.body;

    if (!warehouseId || !name) {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'warehouseId and location name are required.',
          details: {},
        },
      });
    }

    let whName = warehouseName;
    if (!whName) {
      const wh = await Warehouse.findById(warehouseId).lean();
      if (wh) whName = wh.name;
    }

    const location = await Location.create({
      warehouseId: new mongoose.Types.ObjectId(warehouseId),
      name: name.trim(),
      code: code || '',
      warehouseName: whName || '',
      type: type || 'Storage',
      capacity: Number(capacity) || 5000,
      occupied: Number(occupied) || 0,
      aisle: aisle || '',
      shelf: shelf || '',
      active: true,
    });

    res.status(201).json({
      ...location.toObject(),
      id: location._id.toString(),
    });
  } catch (err) {
    next(err);
  }
});

/**
 * PUT /api/locations/:id
 */
router.put('/:id', requireAuth, async (req, res, next) => {
  try {
    const location = await Location.findById(req.params.id);
    if (!location) {
      return res.status(404).json({
        error: {
          code: 'NOT_FOUND',
          message: 'Location not found.',
          details: {},
        },
      });
    }

    const { warehouseId, name, code, warehouseName, type, capacity, occupied, aisle, shelf, active } = req.body;

    if (warehouseId) location.warehouseId = new mongoose.Types.ObjectId(warehouseId);
    if (name) location.name = name.trim();
    if (code !== undefined) location.code = code;
    if (warehouseName !== undefined) location.warehouseName = warehouseName;
    if (type !== undefined) location.type = type;
    if (capacity !== undefined) location.capacity = Number(capacity);
    if (occupied !== undefined) location.occupied = Number(occupied);
    if (aisle !== undefined) location.aisle = aisle;
    if (shelf !== undefined) location.shelf = shelf;
    if (active !== undefined) location.active = Boolean(active);

    await location.save();

    res.json({
      ...location.toObject(),
      id: location._id.toString(),
    });
  } catch (err) {
    next(err);
  }
});

/**
 * DELETE /api/locations/:id
 */
router.delete('/:id', requireAuth, async (req, res, next) => {
  try {
    const location = await Location.findById(req.params.id);
    if (!location) {
      return res.status(404).json({
        error: {
          code: 'NOT_FOUND',
          message: 'Location not found.',
          details: {},
        },
      });
    }

    // Check if location has non-zero stock
    const hasStock = await hasNonZeroStock(location.warehouseId, location._id);
    if (hasStock) {
      return res.status(409).json({
        error: {
          code: 'LOCATION_HAS_STOCK',
          message: 'Cannot delete location that currently contains inventory stock.',
          details: {},
        },
      });
    }

    location.active = false;
    await location.save();

    res.json({
      message: 'Location deleted successfully.',
      id: location._id.toString(),
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
