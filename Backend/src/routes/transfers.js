const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Transfer = require('../models/Transfer');
const Ledger = require('../models/Ledger');
const ApiError = require('../errors/ApiError');
const { requireAuth, requireRole, requireWarehouseAccess } = require('../middleware/auth');
const { validateLineItems } = require('../utils/documentValidator');
const {
  executeStockDecrease,
  executeStockIncrease,
  executeReversalOp,
  runInTransaction
} = require('../services/quantOps');

// Middleware to load transfer document onto req for scoping
async function loadTransfer(req, res, next) {
  try {
    const transfer = await Transfer.findById(req.params.id);
    if (!transfer) {
      return next(new ApiError(404, 'NOT_FOUND', 'Transfer not found'));
    }
    req.document = transfer;
    next();
  } catch (err) {
    next(err);
  }
}

/**
 * Helper to get warehouse IDs from transfer for permission checks (both source & dest)
 */
function getTransferWarehouseIds(req) {
  const ids = [];
  if (req.document) {
    if (req.document.sourceWarehouseId) ids.push(req.document.sourceWarehouseId);
    if (req.document.destWarehouseId) ids.push(req.document.destWarehouseId);
  }
  if (req.body) {
    if (req.body.sourceWarehouseId) ids.push(req.body.sourceWarehouseId);
    if (req.body.destWarehouseId) ids.push(req.body.destWarehouseId);
  }
  return ids;
}

/**
 * GET /api/transfers
 */
router.get('/', requireAuth, async (req, res, next) => {
  try {
    const { status, warehouseId, limit = 50, cursor } = req.query;
    const filter = {};

    if (status) filter.status = status;

    if (warehouseId) {
      const whObjId = new mongoose.Types.ObjectId(warehouseId);
      filter.$or = [{ sourceWarehouseId: whObjId }, { destWarehouseId: whObjId }];
    }

    if (cursor) {
      filter._id = { $lt: new mongoose.Types.ObjectId(cursor) };
    }

    const pageSize = Math.min(parseInt(limit, 10) || 50, 100);
    const docs = await Transfer.find(filter)
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
 * POST /api/transfers
 */
router.post(
  '/',
  requireAuth,
  requireWarehouseAccess(getTransferWarehouseIds),
  async (req, res, next) => {
    try {
      const srcWh = req.body.sourceWarehouseId || req.body.fromWarehouseId;
      const srcLoc = req.body.sourceLocationId || req.body.fromLocationId;
      const dstWh = req.body.destWarehouseId || req.body.toWarehouseId;
      const dstLoc = req.body.destLocationId || req.body.toLocationId;
      const status = req.body.status;

      if (!srcWh || !srcLoc || !dstWh || !dstLoc) {
        throw new ApiError(
          400,
          'VALIDATION_ERROR',
          'sourceWarehouseId, sourceLocationId, destWarehouseId, and destLocationId are required'
        );
      }

      if (srcLoc.toString() === dstLoc.toString()) {
        throw new ApiError(400, 'SAME_SOURCE_DEST', 'Source and destination locations cannot be the same');
      }

      let rawLines = req.body.lines || req.body.items || [];
      if (rawLines.length === 0 && req.body.productId && req.body.quantity) {
        rawLines = [{ productId: req.body.productId, quantity: req.body.quantity }];
      }

      const formattedLines = validateLineItems(rawLines);

      const initialStatus = ['draft', 'waiting', 'ready'].includes(status) ? status : 'draft';
      const transferGroupId = new mongoose.Types.ObjectId();

      const transfer = await Transfer.create({
        sourceWarehouseId: new mongoose.Types.ObjectId(srcWh),
        sourceLocationId: new mongoose.Types.ObjectId(srcLoc),
        destWarehouseId: new mongoose.Types.ObjectId(dstWh),
        destLocationId: new mongoose.Types.ObjectId(dstLoc),
        status: initialStatus,
        lines: formattedLines,
        transferGroupId,
        createdBy: new mongoose.Types.ObjectId(req.user.userId)
      });

      res.status(201).json(transfer);
    } catch (err) {
      next(err);
    }
  }
);

/**
 * GET /api/transfers/:id
 */
router.get('/:id', requireAuth, loadTransfer, async (req, res) => {
  res.json(req.document);
});

/**
 * PUT /api/transfers/:id
 */
router.put(
  '/:id',
  requireAuth,
  loadTransfer,
  requireWarehouseAccess(getTransferWarehouseIds),
  async (req, res, next) => {
    try {
      const doc = req.document;

      if (['done', 'reversed'].includes(doc.status)) {
        throw new ApiError(409, 'DOCUMENT_LOCKED', `Cannot modify transfer in '${doc.status}' status`);
      }

      const {
        sourceWarehouseId,
        sourceLocationId,
        destWarehouseId,
        destLocationId,
        lines,
        status
      } = req.body;

      if (sourceWarehouseId) doc.sourceWarehouseId = new mongoose.Types.ObjectId(sourceWarehouseId);
      if (sourceLocationId) doc.sourceLocationId = new mongoose.Types.ObjectId(sourceLocationId);
      if (destWarehouseId) doc.destWarehouseId = new mongoose.Types.ObjectId(destWarehouseId);
      if (destLocationId) doc.destLocationId = new mongoose.Types.ObjectId(destLocationId);

      if (doc.sourceLocationId.toString() === doc.destLocationId.toString()) {
        throw new ApiError(400, 'SAME_SOURCE_DEST', 'Source and destination locations cannot be the same');
      }

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
 * POST /api/transfers/:id/validate
 * Atomic: status check + quant update (both source decrement and dest increment) + ledger inserts
 */
router.post(
  '/:id/validate',
  requireAuth,
  loadTransfer,
  requireWarehouseAccess(getTransferWarehouseIds),
  async (req, res, next) => {
    try {
      const transferId = req.document._id;

      const result = await runInTransaction(async (session) => {
        const doc = await Transfer.findById(transferId).session(session);
        if (!doc) {
          throw new ApiError(404, 'NOT_FOUND', 'Transfer not found');
        }

        if (doc.status === 'done' || doc.status === 'reversed') {
          throw new ApiError(409, 'INVALID_STATUS_TRANSITION', `Transfer is already ${doc.status}`);
        }

        if (doc.status === 'canceled') {
          throw new ApiError(409, 'INVALID_STATUS_TRANSITION', 'Cannot validate a canceled transfer');
        }

        if (!['draft', 'waiting', 'ready'].includes(doc.status)) {
          throw new ApiError(409, 'INVALID_STATUS_TRANSITION', `Invalid status '${doc.status}' for validation`);
        }

        if (!doc.lines || doc.lines.length === 0) {
          throw new ApiError(400, 'EMPTY_DOCUMENT', 'Transfer must contain at least one line item');
        }

        if (doc.sourceLocationId.toString() === doc.destLocationId.toString()) {
          throw new ApiError(400, 'SAME_SOURCE_DEST', 'Source and destination locations cannot be the same');
        }

        const transferGroupId = doc.transferGroupId || new mongoose.Types.ObjectId();
        doc.transferGroupId = transferGroupId;

        // Atomically process each line item
        for (const line of doc.lines) {
          // 1. Decrement source location stock (transfer_out)
          await executeStockDecrease({
            documentId: doc._id,
            type: 'transfer_out',
            warehouseId: doc.sourceWarehouseId,
            locationId: doc.sourceLocationId,
            productId: line.productId,
            amount: line.quantity,
            user: new mongoose.Types.ObjectId(req.user.userId),
            transferGroupId,
            session
          });

          // 2. Increment destination location stock (transfer_in)
          await executeStockIncrease({
            documentId: doc._id,
            type: 'transfer_in',
            warehouseId: doc.destWarehouseId,
            locationId: doc.destLocationId,
            productId: line.productId,
            amount: line.quantity,
            user: new mongoose.Types.ObjectId(req.user.userId),
            transferGroupId,
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
 * POST /api/transfers/:id/cancel
 */
router.post(
  '/:id/cancel',
  requireAuth,
  loadTransfer,
  requireWarehouseAccess(getTransferWarehouseIds),
  async (req, res, next) => {
    try {
      const doc = req.document;

      if (['done', 'reversed'].includes(doc.status)) {
        throw new ApiError(409, 'INVALID_STATUS_TRANSITION', `Cannot cancel a transfer in '${doc.status}' status`);
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
 * POST /api/transfers/:id/reverse
 * Manager-only. Checks both warehouses. Reverses both legs inheriting original transferGroupId.
 */
router.post(
  '/:id/reverse',
  requireAuth,
  requireRole('manager'),
  loadTransfer,
  requireWarehouseAccess(getTransferWarehouseIds),
  async (req, res, next) => {
    try {
      const transferId = req.document._id;

      const result = await runInTransaction(async (session) => {
        const doc = await Transfer.findById(transferId).session(session);
        if (!doc) {
          throw new ApiError(404, 'NOT_FOUND', 'Transfer not found');
        }

        if (doc.status === 'reversed') {
          throw new ApiError(409, 'ALREADY_REVERSED', 'Transfer has already been reversed');
        }

        if (doc.status !== 'done') {
          throw new ApiError(409, 'INVALID_STATUS_TRANSITION', 'Only done transfers can be reversed');
        }

        const originalLedgers = await Ledger.find({
          documentId: doc._id,
          type: { $in: ['transfer_out', 'transfer_in'] }
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
