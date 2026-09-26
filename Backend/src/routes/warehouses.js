const express = require('express');
const mongoose = require('mongoose');
const Warehouse = require('../models/Warehouse');
const Location = require('../models/Location');
const { requireAuth, requireRole } = require('../middleware/auth');
const { hasNonZeroStock } = require('../services/stockCheck');

const router = express.Router();

/**
 * GET /api/warehouses
 */
router.get('/', requireAuth, async (req, res, next) => {
  try {
    const { active = 'true' } = req.query;
    const filter = {};
    if (active === 'true') filter.active = true;
    else if (active === 'false') filter.active = false;

    const warehouses = await Warehouse.find(filter).sort({ createdAt: 1 }).lean();
    const locations = await Location.find({ active: true }).lean();

    const enriched = warehouses.map((w) => {
      const whLocations = locations.filter((l) => l.warehouseId.toString() === w._id.toString());
      return {
        ...w,
        id: w._id.toString(),
        locations: whLocations.map((l) => ({ ...l, id: l._id.toString() })),
        locationCount: whLocations.length,
      };
    });

    res.json(enriched);
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/warehouses
 */
router.post('/', requireAuth, async (req, res, next) => {
  try {
    const { name, code, shortName, city, address, type, capacity, manager, status } = req.body;

    if (!name) {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Warehouse name is required.',
          details: {},
        },
      });
    }

    const warehouse = await Warehouse.create({
      name: name.trim(),
      code: code || '',
      shortName: shortName || name.trim(),
      city: city || '',
      address: address || '',
      type: type || 'Central Hub',
      capacity: Number(capacity) || 10000,
      manager: manager || '',
      status: status || 'Active',
      active: true,
    });

    res.status(201).json({
      ...warehouse.toObject(),
      id: warehouse._id.toString(),
      locations: [],
      locationCount: 0,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/warehouses/:id
 */
router.get('/:id', requireAuth, async (req, res, next) => {
  try {
    const warehouse = await Warehouse.findById(req.params.id).lean();
    if (!warehouse) {
      return res.status(404).json({
        error: {
          code: 'NOT_FOUND',
          message: 'Warehouse not found.',
          details: {},
        },
      });
    }

    const locations = await Location.find({ warehouseId: warehouse._id, active: true }).lean();

    res.json({
      ...warehouse,
      id: warehouse._id.toString(),
      locations: locations.map((l) => ({ ...l, id: l._id.toString() })),
      locationCount: locations.length,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * PUT /api/warehouses/:id
 */
router.put('/:id', requireAuth, async (req, res, next) => {
  try {
    const warehouse = await Warehouse.findById(req.params.id);
    if (!warehouse) {
      return res.status(404).json({
        error: {
          code: 'NOT_FOUND',
          message: 'Warehouse not found.',
          details: {},
        },
      });
    }

    const { name, code, shortName, city, address, type, capacity, manager, status, active } = req.body;

    if (name) warehouse.name = name.trim();
    if (code !== undefined) warehouse.code = code;
    if (shortName !== undefined) warehouse.shortName = shortName;
    if (city !== undefined) warehouse.city = city;
    if (address !== undefined) warehouse.address = address;
    if (type !== undefined) warehouse.type = type;
    if (capacity !== undefined) warehouse.capacity = Number(capacity);
    if (manager !== undefined) warehouse.manager = manager;
    if (status !== undefined) warehouse.status = status;
    if (active !== undefined) warehouse.active = Boolean(active);

    await warehouse.save();

    res.json({
      ...warehouse.toObject(),
      id: warehouse._id.toString(),
    });
  } catch (err) {
    next(err);
  }
});

/**
 * DELETE /api/warehouses/:id
 */
router.delete('/:id', requireAuth, async (req, res, next) => {
  try {
    const warehouse = await Warehouse.findById(req.params.id);
    if (!warehouse) {
      return res.status(404).json({
        error: {
          code: 'NOT_FOUND',
          message: 'Warehouse not found.',
          details: {},
        },
      });
    }

    // Check if warehouse has non-zero stock
    const hasStock = await hasNonZeroStock(warehouse._id);
    if (hasStock) {
      return res.status(409).json({
        error: {
          code: 'WAREHOUSE_HAS_STOCK',
          message: 'Cannot delete warehouse that currently holds inventory stock.',
          details: {},
        },
      });
    }

    warehouse.active = false;
    await warehouse.save();

    res.json({
      message: 'Warehouse deleted successfully.',
      id: warehouse._id.toString(),
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
