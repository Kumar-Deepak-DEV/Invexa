const User = require('../models/User');
const Warehouse = require('../models/Warehouse');

/**
 * Role-based authorization middleware (PRD §6, Segment A §4).
 * Returns 403 FORBIDDEN if req.user.role !== role.
 * Supports a single role string or multiple allowed roles.
 * @param  {...string} roles Allowed roles
 * @returns {Function} Express middleware
 */
function requireRole(...roles) {
  const allowedRoles = roles.flat().map(r => r.toLowerCase());

  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      return res.status(401).json({
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required.',
          details: {},
        },
      });
    }

    const userRole = req.user.role.toLowerCase();
    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({
        error: {
          code: 'FORBIDDEN',
          message: `Role '${req.user.role}' does not have access to this resource.`,
          details: {},
        },
      });
    }

    next();
  };
}

/**
 * Normalizes input from getWarehouseIds into an array of string IDs.
 * Supports:
 * - [ObjectId | string]
 * - ObjectId | string
 * - { source: ObjectId | string, dest: ObjectId | string }
 * - { sourceWarehouseId: ..., destWarehouseId: ... }
 * @param {any} raw 
 * @returns {string[]}
 */
function normalizeWarehouseIds(raw) {
  if (!raw) return [];

  let list = [];
  if (Array.isArray(raw)) {
    list = raw;
  } else if (typeof raw === 'object' && ('source' in raw || 'dest' in raw || 'sourceWarehouseId' in raw || 'destWarehouseId' in raw)) {
    const source = raw.source || raw.sourceWarehouseId;
    const dest = raw.dest || raw.destWarehouseId;
    if (source) list.push(source);
    if (dest) list.push(dest);
  } else {
    list = [raw];
  }

  return list
    .filter(Boolean)
    .map(id => (id._id ? id._id.toString() : id.toString()));
}

/**
 * Warehouse scoping middleware (Segment A §4, PRD §5.1, §5.9, §6).
 * 
 * Contract:
 * - getWarehouseIds: (req) => [ObjectId] | { source: ObjectId, dest: ObjectId }
 * - Manager role: always next(), no scoping.
 * - Staff role: live DB read of assignedWarehouses by req.user.userId
 *   (never from JWT; reflects live DB state on every request, no caching).
 * - Single-warehouse form: 403 WAREHOUSE_NOT_ASSIGNED if not in assigned list.
 * - Transfer form ({source, dest}): 403 if EITHER side is missing.
 * - Inactive warehouse check: 409 WAREHOUSE_INACTIVE if any warehouse is soft-deleted (active === false).
 * 
 * @param {Function} getWarehouseIds 
 * @returns {Function} Express middleware
 */
function requireWarehouseAccess(getWarehouseIds) {
  return async (req, res, next) => {
    try {
      if (!req.user || !req.user.userId) {
        return res.status(401).json({
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authentication required.',
            details: {},
          },
        });
      }

      // Manager role bypasses warehouse scoping (PRD §5.9, §6)
      if (req.user.role && req.user.role.toLowerCase() === 'manager') {
        return next();
      }

      // Extract and normalize required warehouse IDs
      const rawIds = await Promise.resolve(getWarehouseIds(req));
      const requiredWarehouseIds = normalizeWarehouseIds(rawIds);

      // If no warehouses are targeted by this operation, proceed
      if (requiredWarehouseIds.length === 0) {
        return next();
      }

      // Staff role: Live DB read of assignedWarehouses by req.user.userId (PRD §5.1, Segment A §4, §9)
      const user = await User.findById(req.user.userId);
      if (!user || user.active === false) {
        return res.status(401).json({
          error: {
            code: 'UNAUTHORIZED',
            message: 'User account is disabled or does not exist.',
            details: {},
          },
        });
      }

      const assignedWarehouses = (user.assignedWarehouses || []).map(id => id.toString());

      // Verify that EVERY required warehouse is in assignedWarehouses
      const unassignedId = requiredWarehouseIds.find(id => !assignedWarehouses.includes(id));
      if (unassignedId) {
        return res.status(403).json({
          error: {
            code: 'WAREHOUSE_NOT_ASSIGNED',
            message: 'You do not have access to the requested warehouse(s).',
            details: {
              warehouseId: unassignedId,
            },
          },
        });
      }

      // Verify that all targeted warehouses are active (not soft-deleted)
      const warehouses = await Warehouse.find({ _id: { $in: requiredWarehouseIds } });
      for (const targetId of requiredWarehouseIds) {
        const wh = warehouses.find(w => w._id.toString() === targetId);
        if (!wh || wh.active === false) {
          return res.status(409).json({
            error: {
              code: 'WAREHOUSE_INACTIVE',
              message: 'Warehouse is inactive or has been deleted.',
              details: {
                warehouseId: targetId,
              },
            },
          });
        }
      }

      next();
    } catch (err) {
      next(err);
    }
  };
}

module.exports = {
  requireRole,
  requireWarehouseAccess,
};
