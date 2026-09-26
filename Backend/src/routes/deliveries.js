const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Delivery = require('../models/Delivery');
const Ledger = require('../models/Ledger');
const ApiError = require('../errors/ApiError');
const { requireAuth, requireRole, requireWarehouseAccess } = require('../middleware/auth');
const { validateLineItems } = require('../utils/documentValidator');
const {
  executeStockDecrease,
  executeReversalOp,
  runInTransaction
} = require('../services/quantOps');

// Middleware to load delivery document onto req for scoping
async function loadDelivery(req, res, next) {
  try {
    const delivery = await Delivery.findById(req.params.id);
    if (!delivery) {
      return next(new ApiError(404, 'NOT_FOUND', 'Delivery not found'));
    }
    req.document = delivery;
    next();
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/deliveries
 */
router.get('/', requireAuth, async (req, res, next) => {
  try {
    const { status, warehouseId, limit = 50, cursor } = req.query;
    const filter = {};

    if (status) filter.status = status;
    if (warehouseId) filter.warehouseId = new mongoose.Types.ObjectId(warehouseId);

    // If Staff, restrict to assigned warehouses if set
    if (req.user.role !== 'manager' && req.user.assignedWarehouses && req.user.assignedWarehouses.length > 0) {
      const allowed = req.user.assignedWarehouses.map(id => new mongoose.Types.ObjectId(id));
      if (filter.warehouseId) {
        if (!req.user.assignedWarehouses.includes(filter.warehouseId.toString())) {
          return res.json({ data: [], nextCursor: null, hasMore: false });
        }
      } else {
        filter.warehouseId = { $in: allowed };
      }
    }

    if (cursor) {
      filter._id = { $lt: new mongoose.Types.ObjectId(cursor) };
    }

    const pageSize = Math.min(parseInt(limit, 10) || 50, 100);
    const docs = await Delivery.find(filter)
      .sort({ _id: -1 })
      .limit(pageSize + 1);

    const hasMore = docs.length > pageSize;
    const results = hasMore ? docs.slice(0, pageSize) : docs;
    const nextCursor = hasMore ? results[results.length - 1]._id.toString() : null;

    res.json({
      data: results,
      nextCursor,
      hasMore
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/deliveries
 */
router.post(
  '/',
  requireAuth,
  requireWarehouseAccess(req => [req.body.warehouseId]),
  async (req, res, next) => {
    try {
      const { warehouseId, locationId, customer, lines, items, status } = req.body;

      if (!warehouseId || !locationId) {
        throw new ApiError(400, 'VALIDATION_ERROR', 'warehouseId and locationId are required');
      }

      const rawLines = lines || items || [];
      const formattedLines = validateLineItems(rawLines);

      const initialStatus = ['draft', 'waiting', 'ready'].includes(status) ? status : 'draft';

      const delivery = await Delivery.create({
        warehouseId: new mongoose.Types.ObjectId(warehouseId),
        locationId: new mongoose.Types.ObjectId(locationId),
        customer: customer || '',
        status: initialStatus,
        lines: formattedLines,
        createdBy: new mongoose.Types.ObjectId(req.user.userId)
      });

      res.status(201).json(delivery);
    } catch (err) {
      next(err);
    }
  }
);

/**
 * GET /api/deliveries/:id
 */
router.get('/:id', requireAuth, loadDelivery, async (req, res) => {
  res.json(req.document);
});

/**
 * PUT /api/deliveries/:id
 */
router.put(
  '/:id',
  requireAuth,
  loadDelivery,
  requireWarehouseAccess(req => [req.document.warehouseId, req.body.warehouseId]),
  async (req, res, next) => {
    try {
      const doc = req.document;

      if (['done', 'reversed'].includes(doc.status)) {
        throw new ApiError(409, 'DOCUMENT_LOCKED', `Cannot modify delivery in '${doc.status}' status`);
      }

      const { warehouseId, locationId, customer, lines, status } = req.body;

      if (warehouseId) doc.warehouseId = new mongoose.Types.ObjectId(warehouseId);
      if (locationId) doc.locationId = new mongoose.Types.ObjectId(locationId);
      if (customer !== undefined) doc.customer = customer;
      if (lines) doc.lines = validateLineItems(lines);

      if (status) {
        if (!['draft', 'waiting', 'ready'].includes(status)) {
          throw new ApiError(400, 'VALIDATION_ERROR', `Invalid status transition to '${status}' via PUT`);
        }
        doc.status = status;
      }

      await doc.save();
      res.json(doc);
    } catch (err) {
      next(err);
    }
  }
);

/**
 * POST /api/deliveries/:id/validate
 * Atomic: status check + quant update (conditional decrement) + ledger insert
 */
router.post(
  '/:id/validate',
  requireAuth,
  loadDelivery,
  requireWarehouseAccess(req => [req.document.warehouseId]),
  async (req, res, next) => {
    try {
      const deliveryId = req.document._id;

      const result = await runInTransaction(async (session) => {
        const doc = await Delivery.findById(deliveryId).session(session);
        if (!doc) {
          throw new ApiError(404, 'NOT_FOUND', 'Delivery not found');
        }

        if (doc.status === 'done' || doc.status === 'reversed') {
          throw new ApiError(409, 'INVALID_STATUS_TRANSITION', `Delivery is already ${doc.status}`);
        }

        if (doc.status === 'canceled') {
          throw new ApiError(409, 'INVALID_STATUS_TRANSITION', 'Cannot validate a canceled delivery');
        }

        if (!['draft', 'waiting', 'ready'].includes(doc.status)) {
          throw new ApiError(409, 'INVALID_STATUS_TRANSITION', `Invalid status '${doc.status}' for validation`);
        }

        if (!doc.lines || doc.lines.length === 0) {
          throw new ApiError(400, 'EMPTY_DOCUMENT', 'Delivery must contain at least one line item');
        }

        // Process line items into Quant and Ledger
        for (const line of doc.lines) {
          await executeStockDecrease({
            documentId: doc._id,
            type: 'delivery',
            warehouseId: doc.warehouseId,
            locationId: doc.locationId,
            productId: line.productId,
            amount: line.quantity,
            user: new mongoose.Types.ObjectId(req.user.userId),
            session
          });
        }

        doc.status = 'done';
        await doc.save({ session });

        return doc;
      });

      res.json(result);
    } catch (err) {
      next(err);
    }
  }
);

/**
 * POST /api/deliveries/:id/cancel
 */
router.post(
  '/:id/cancel',
  requireAuth,
  loadDelivery,
  requireWarehouseAccess(req => [req.document.warehouseId]),
  async (req, res, next) => {
    try {
      const doc = req.document;

      if (['done', 'reversed'].includes(doc.status)) {
        throw new ApiError(409, 'INVALID_STATUS_TRANSITION', `Cannot cancel a delivery in '${doc.status}' status`);
      }

      doc.status = 'canceled';
      await doc.save();

      res.json(doc);
    } catch (err) {
      next(err);
    }
  }
);

/**
 * POST /api/deliveries/:id/reverse
 * Manager-only
 */
router.post(
  '/:id/reverse',
  requireAuth,
  requireRole('manager'),
  loadDelivery,
  requireWarehouseAccess(req => [req.document.warehouseId]),
  async (req, res, next) => {
    try {
      const deliveryId = req.document._id;

      const result = await runInTransaction(async (session) => {
        const doc = await Delivery.findById(deliveryId).session(session);
        if (!doc) {
          throw new ApiError(404, 'NOT_FOUND', 'Delivery not found');
        }

        if (doc.status === 'reversed') {
          throw new ApiError(409, 'ALREADY_REVERSED', 'Delivery has already been reversed');
        }

        if (doc.status !== 'done') {
          throw new ApiError(409, 'INVALID_STATUS_TRANSITION', 'Only done deliveries can be reversed');
        }

        const originalLedgers = await Ledger.find({
          documentId: doc._id,
          type: 'delivery'
        }).session(session);

        await executeReversalOp({
          documentId: doc._id,
          originalLedgerEntries: originalLedgers,
          user: new mongoose.Types.ObjectId(req.user.userId),
          session
        });

        doc.status = 'reversed';
        await doc.save({ session });

        return doc;
      });

      res.json(result);
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;
