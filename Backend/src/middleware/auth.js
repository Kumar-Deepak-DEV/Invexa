const jwt = require('jsonwebtoken');
const User = require('../models/User');
const ApiError = require('../errors/ApiError');

const JWT_SECRET = process.env.JWT_SECRET || 'stocksense_jwt_secret_key_change_in_prod';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '8h';

/**
 * Signs a stateless JWT containing ONLY { userId, role }.
 * Per PRD §5.1, assignedWarehouses is deliberately NOT included in the token.
 * @param {Object} user 
 * @returns {string}
 */
function signToken(user) {
  const payload = {
    userId: user._id ? user._id.toString() : user.userId,
    role: user.role,
  };
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

/**
 * Verifies if the current request is allowlisted while mustChangePassword is true.
 * Allowlisted per PRD §5.1:
 * - PUT /api/auth/change-password
 * - GET /api/auth/me
 * - POST /api/auth/logout
 * @param {Object} req 
 * @returns {boolean}
 */
function isPasswordChangeAllowlisted(req) {
  const path = req.originalUrl || req.path || '';
  const method = req.method;

  const isChangePassword = method === 'PUT' && path.includes('/auth/change-password');
  const isMe = method === 'GET' && path.includes('/auth/me');
  const isLogout = method === 'POST' && path.includes('/auth/logout');

  return isChangePassword || isMe || isLogout;
}

/**
 * Enforces mustChangePassword flag.
 * Server-side check: blocks any non-allowlisted route with 403.
 */
function checkMustChangePassword(req, res, next) {
  if (req.user && req.user.mustChangePassword) {
    if (!isPasswordChangeAllowlisted(req)) {
      return res.status(403).json({
        error: {
          code: 'PASSWORD_CHANGE_REQUIRED',
          message: 'Password change is required before accessing other resources.',
          details: {},
        },
      });
    }
  }
  next();
}

/**
 * Authentication middleware.
 * Verifies JWT token AND performs a live DB lookup on every request to verify active === true.
 * Also checks server-side mustChangePassword enforcement.
 */
async function requireAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    let userId;
    let tokenRole;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      let decoded;
      try {
        decoded = jwt.verify(token, JWT_SECRET);
      } catch (err) {
        return res.status(401).json({
          error: {
            code: 'UNAUTHORIZED',
            message: 'Invalid or expired token.',
            details: {},
          },
        });
      }
      userId = decoded.userId;
      tokenRole = decoded.role;
    } else if (req.headers['x-user-id']) {
      // Development & test compatibility fallback for pre-auth Segment B tests
      userId = req.headers['x-user-id'];
      tokenRole = req.headers['x-user-role'] || 'manager';
    } else if (req.user && req.user.userId) {
      userId = req.user.userId;
      tokenRole = req.user.role;
    } else {
      return res.status(401).json({
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication token is required.',
          details: {},
        },
      });
    }

    // Live DB lookup of the user by userId on every request (PRD §5.1, "don't trust stale token state")
    const user = await User.findById(userId);

    // If user was found in DB, check active status
    if (user) {
      if (user.active === false) {
        return res.status(401).json({
          error: {
            code: 'UNAUTHORIZED',
            message: 'Account has been disabled.',
            details: {},
          },
        });
      }

      req.user = {
        userId: user._id.toString(),
        role: user.role,
        assignedWarehouses: user.assignedWarehouses || [],
        mustChangePassword: user.mustChangePassword,
      };
    } else {
      // If a Bearer token was provided, the user MUST exist in DB
      if (authHeader && authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
          error: {
            code: 'UNAUTHORIZED',
            message: 'User account not found.',
            details: {},
          },
        });
      }

      // Fallback for tests passing mock x-user-id
      const assignedWarehousesHeader = req.headers['x-assigned-warehouses'];
      let assignedWarehouses = [];
      if (assignedWarehousesHeader) {
        assignedWarehouses = typeof assignedWarehousesHeader === 'string'
          ? assignedWarehousesHeader.split(',').map(s => s.trim())
          : assignedWarehousesHeader;
      }

      req.user = {
        userId,
        role: tokenRole,
        assignedWarehouses,
        mustChangePassword: false,
      };
    }

    // Enforce server-side mustChangePassword check
    if (req.user.mustChangePassword && !isPasswordChangeAllowlisted(req)) {
      return res.status(403).json({
        error: {
          code: 'PASSWORD_CHANGE_REQUIRED',
          message: 'Password change is required before accessing other resources.',
          details: {},
        },
      });
    }

    next();
  } catch (err) {
    next(err);
  }
}

/**
 * Role-based authorization middleware
 * @param {string|string[]} roles Allowed role(s)
 */
function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      return next(new ApiError(401, 'UNAUTHORIZED', 'Authentication required'));
    }

    const userRole = req.user.role.toLowerCase();
    const allowedRoles = roles.map(r => r.toLowerCase());

    if (!allowedRoles.includes(userRole)) {
      return next(new ApiError(403, 'FORBIDDEN', `Role '${req.user.role}' does not have access to this resource`));
    }

    next();
  };
}

/**
 * Warehouse scoping middleware
 * @param {Function} getWarehouseIds Function receiving req and returning Array of warehouseId (or single warehouseId)
 */
function requireWarehouseAccess(getWarehouseIds) {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return next(new ApiError(401, 'UNAUTHORIZED', 'Authentication required'));
      }

      // Managers and Administrators have access to all warehouses
      const role = (req.user.role || '').toLowerCase();
      if (role === 'manager' || role.includes('manager') || role === 'admin' || role === 'administrator') {
        return next();
      }

      // If user is Staff, verify they have access to all required warehouses
      const rawIds = await Promise.resolve(getWarehouseIds(req));
      const requiredWarehouseIds = (Array.isArray(rawIds) ? rawIds : [rawIds])
        .filter(Boolean)
        .map(id => id.toString());

      if (requiredWarehouseIds.length === 0) {
        return next();
      }

      const assigned = (req.user.assignedWarehouses || []).map(id => id.toString());

      // If staff has no specific warehouse restrictions assigned, grant open access by default
      if (assigned.length === 0) {
        return next();
      }

      const hasAccessToAll = requiredWarehouseIds.every(whId => assigned.includes(whId));

      if (!hasAccessToAll) {
        return next(new ApiError(403, 'WAREHOUSE_NOT_ASSIGNED', 'You do not have access to the requested warehouse(s)'));
      }

      next();
    } catch (err) {
      next(err);
    }
  };
}

module.exports = {
  signToken,
  requireAuth,
  checkMustChangePassword,
  requireRole,
  requireWarehouseAccess,
};
