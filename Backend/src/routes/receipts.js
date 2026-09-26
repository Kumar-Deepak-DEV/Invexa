const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Receipt = require('../models/Receipt');
const Ledger = require('../models/Ledger');
const ApiError = require('../errors/ApiError');
const { requireAuth, requireRole, requireWarehouseAccess } = require('../middleware/auth');
const { validateLineItems } = require('../utils/documentValidator');
const {
  executeStockIncrease,
  executeReversalOp,
  runInTransaction
} = require('../services/quantOps');

// Middleware to load receipt document onto req for scoping
async function loadReceipt(req, res, next) {
  try {
    const receipt = await Receipt.findById(req.params.id);
    if (!receipt) {
      return next(new ApiError(404, 'NOT_FOUND', 'Receipt not found'));
    }
    req.document = receipt;
    next();
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/receipts
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
    const docs = await Receipt.find(filter)
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
 * POST /api/receipts
 */
router.post(
  '/',
  requireAuth,
  requireWarehouseAccess(req => [req.body.warehouseId]),
  async (req, res, next) => {
    try {
      const { warehouseId, locationId, supplier, lines, items, status } = req.body;

      if (!warehouseId || !locationId) {
        throw new ApiError(400, 'VALIDATION_ERROR', 'warehouseId and locationId are required');
      }

      const rawLines = lines || items || [];
      const formattedLines = validateLineItems(rawLines);

      const initialStatus = ['draft', 'waiting'].includes(status) ? status : 'draft';

      const receipt = await Receipt.create({
        warehouseId: new mongoose.Types.ObjectId(warehouseId),
        locationId: new mongoose.Types.ObjectId(locationId),
        supplier: supplier || '',
        status: initialStatus,
        lines: formattedLines,
        createdBy: new mongoose.Types.ObjectId(req.user.userId)
      });

      res.status(201).json(receipt);
    } catch (err) {
      next(err);
    }
  }
);

/**
 * GET /api/receipts/:id
 */
router.get('/:id', requireAuth, loadReceipt, async (req, res) => {
  res.json(req.document);
});

/**
 * PUT /api/receipts/:id
 */
router.put(
  '/:id',
  requireAuth,
  loadReceipt,
  requireWarehouseAccess(req => [req.document.warehouseId, req.body.warehouseId]),
  async (req, res, next) => {
    try {
      const doc = req.document;

      if (['done', 'reversed'].includes(doc.status)) {
        throw new ApiError(409, 'DOCUMENT_LOCKED', `Cannot modify receipt in '${doc.status}' status`);
      }

      const { warehouseId, locationId, supplier, lines, status } = req.body;

      if (warehouseId) doc.warehouseId = new mongoose.Types.ObjectId(warehouseId);
      if (locationId) doc.locationId = new mongoose.Types.ObjectId(locationId);
      if (supplier !== undefined) doc.supplier = supplier;
      if (lines) doc.lines = validateLineItems(lines);

      if (status) {
        if (!['draft', 'waiting'].includes(status)) {
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
 * POST /api/receipts/:id/validate
 * Atomic: status check + quant update (upsert) + ledger insert
 */
router.post(
  '/:id/validate',
  requireAuth,
  loadReceipt,
  requireWarehouseAccess(req => [req.document.warehouseId]),
  async (req, res, next) => {
    try {
      const receiptId = req.document._id;

      const result = await runInTransaction(async (session) => {
        // Fetch fresh inside transaction
        const doc = await Receipt.findById(receiptId).session(session);
        if (!doc) {
          throw new ApiError(404, 'NOT_FOUND', 'Receipt not found');
        }

        if (doc.status === 'done' || doc.status === 'reversed') {
          throw new ApiError(409, 'INVALID_STATUS_TRANSITION', `Receipt is already ${doc.status}`);
        }

        if (doc.status === 'canceled') {
          throw new ApiError(409, 'INVALID_STATUS_TRANSITION', 'Cannot validate a canceled receipt');
        }

        if (!['draft', 'waiting'].includes(doc.status)) {
          throw new ApiError(409, 'INVALID_STATUS_TRANSITION', `Invalid status '${doc.status}' for validation`);
        }

        if (!doc.lines || doc.lines.length === 0) {
          throw new ApiError(400, 'EMPTY_DOCUMENT', 'Receipt must contain at least one line item');
        }

        // Process line items into Quant and Ledger
        for (const line of doc.lines) {
          await executeStockIncrease({
            documentId: doc._id,
            type: 'receipt',
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
 * POST /api/receipts/:id/cancel
 */
router.post(
  '/:id/cancel',
  requireAuth,
  loadReceipt,
  requireWarehouseAccess(req => [req.document.warehouseId]),
  async (req, res, next) => {
    try {
      const doc = req.document;

      if (['done', 'reversed'].includes(doc.status)) {
        throw new ApiError(409, 'INVALID_STATUS_TRANSITION', `Cannot cancel a receipt in '${doc.status}' status`);
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
 * POST /api/receipts/:id/reverse
 * Manager-only
 */
router.post(
  '/:id/reverse',
  requireAuth,
  requireRole('manager'),
  loadReceipt,
  requireWarehouseAccess(req => [req.document.warehouseId]),
  async (req, res, next) => {
    try {
      const receiptId = req.document._id;

      const result = await runInTransaction(async (session) => {
        const doc = await Receipt.findById(receiptId).session(session);
        if (!doc) {
          throw new ApiError(404, 'NOT_FOUND', 'Receipt not found');
        }

        if (doc.status === 'reversed') {
          throw new ApiError(409, 'ALREADY_REVERSED', 'Receipt has already been reversed');
        }

        if (doc.status !== 'done') {
          throw new ApiError(409, 'INVALID_STATUS_TRANSITION', 'Only done receipts can be reversed');
        }

        // Find original ledger entries for this receipt
        const originalLedgers = await Ledger.find({
          documentId: doc._id,
          type: 'receipt'
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
