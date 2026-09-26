const express = require('express');
const rateLimit = require('express-rate-limit');
const User = require('../models/User');
const BootstrapSentinel = require('../models/BootstrapSentinel');
const { hashPassword, verifyPassword } = require('../services/passwordUtils');
const { signToken, requireAuth } = require('../middleware/auth');
const ApiError = require('../errors/ApiError');

const router = express.Router();

// Rate limiting for login endpoint
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === 'test' ? 1000 : 50,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      error: {
        code: 'RATE_LIMITED',
        message: 'Too many login attempts. Please try again after 15 minutes.',
        details: {},
      },
    });
  },
});

/**
 * POST /api/auth/signup and /api/auth/register
 * Handles user registration with validation, duplicate checks, and immediate JWT issuance.
 */
async function handleSignup(req, res, next) {
  try {
    const { name, fullName, email, password, loginId, phone, role, department } = req.body;
    const userName = (name || fullName || '').trim();
    const userEmail = (email || '').toLowerCase().trim();
    const userPassword = password || '';

    if (!userName || !userEmail || !userPassword) {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Full name, email, and password are required.',
          details: {},
        },
      });
    }

    // Basic email format check
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(userEmail)) {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Please provide a valid email address.',
          details: {},
        },
      });
    }

    if (userPassword.length < 6) {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Password must be at least 6 characters long.',
          details: {},
        },
      });
    }

    // Check duplicate email
    const existing = await User.findOne({ email: userEmail });
    if (existing) {
      return res.status(409).json({
        error: {
          code: 'EMAIL_EXISTS',
          message: 'An account with this email already exists.',
          details: {},
        },
      });
    }

    const assignedLoginId = (loginId || userEmail.split('@')[0]).trim();
    const passwordHash = await hashPassword(userPassword);

    const userCount = await User.countDocuments();
    const assignedRole = role || (userCount === 0 ? 'manager' : 'staff');

    const user = await User.create({
      name: userName,
      email: userEmail,
      loginId: assignedLoginId,
      phone: phone || '',
      department: department || 'Supply Chain Operations',
      passwordHash,
      role: assignedRole,
      mustChangePassword: false,
      active: true,
    });

    const token = signToken(user);

    return res.status(201).json({
      message: 'Account created successfully.',
      token,
      user: {
        id: user._id,
        name: user.name,
        fullName: user.name,
        email: user.email,
        loginId: user.loginId,
        role: user.role,
        phone: user.phone,
        department: user.department,
        avatar: user.avatar,
        warehouse: user.warehouse,
      },
    });
  } catch (err) {
    next(err);
  }
}

router.post('/signup', handleSignup);
router.post('/register', handleSignup);

/**
 * Handler for atomic first-admin bootstrap setup
 */
async function handleFirstAdmin(req, res, next) {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'name, email, and password are required for initial setup.',
          details: {},
        },
      });
    }

    const trimmedEmail = email.toLowerCase().trim();
    const trimmedName = name.trim();

    if (password.length < 6) {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Password must be at least 6 characters long.',
          details: {},
        },
      });
    }

    const existingSentinel = await BootstrapSentinel.findById('bootstrap');
    if (existingSentinel && existingSentinel.used) {
      return res.status(409).json({
        error: {
          code: 'ALREADY_BOOTSTRAPPED',
          message: 'First admin account has already been created.',
          details: {},
        },
      });
    }

    try {
      const sentinel = await BootstrapSentinel.findOneAndUpdate(
        { _id: 'bootstrap', used: false },
        { $set: { used: true, usedAt: new Date() } },
        { upsert: true, new: true }
      );

      if (!sentinel || !sentinel.used) {
        return res.status(409).json({
          error: {
            code: 'ALREADY_BOOTSTRAPPED',
            message: 'First admin account has already been created.',
            details: {},
          },
        });
      }
    } catch (upsertErr) {
      if (upsertErr.code === 11000 || (upsertErr.message && upsertErr.message.includes('E11000'))) {
        return res.status(409).json({
          error: {
            code: 'ALREADY_BOOTSTRAPPED',
            message: 'First admin account has already been created.',
            details: {},
          },
        });
      }
      throw upsertErr;
    }

    const passwordHash = await hashPassword(password);
    const user = await User.create({
      name: trimmedName,
      email: trimmedEmail,
      loginId: trimmedEmail.split('@')[0],
      passwordHash,
      role: 'manager',
      mustChangePassword: false,
      active: true,
    });

    const token = signToken(user);

    return res.status(201).json({
      message: 'First admin account created successfully.',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        mustChangePassword: user.mustChangePassword,
      },
    });
  } catch (err) {
    next(err);
  }
}

router.post('/first-admin', handleFirstAdmin);
router.post('/setup/first-admin', handleFirstAdmin);

/**
 * POST /api/auth/login
 * Validates credentials via email OR loginId, checks active status, and issues stateless JWT.
 */
router.post('/login', loginLimiter, async (req, res, next) => {
  try {
    const { email, loginId, password } = req.body;
    const identifier = (email || loginId || '').toLowerCase().trim();

    if (!identifier || !password) {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Email or Login ID and password are required.',
          details: {},
        },
      });
    }

    // Find by email or loginId
    const user = await User.findOne({
      $or: [{ email: identifier }, { loginId: identifier }],
    });

    if (!user) {
      return res.status(401).json({
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'Invalid email or password.',
          details: {},
        },
      });
    }

    const isMatch = await verifyPassword(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'Invalid email or password.',
          details: {},
        },
      });
    }

    if (user.active === false) {
      return res.status(403).json({
        error: {
          code: 'ACCOUNT_DISABLED',
          message: 'Account is disabled. Contact your administrator.',
          details: {},
        },
      });
    }

    const token = signToken(user);

    return res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        fullName: user.name,
        email: user.email,
        loginId: user.loginId || user.email.split('@')[0],
        role: user.role,
        phone: user.phone || '',
        department: user.department || 'Supply Chain Operations',
        avatar: user.avatar || '',
        warehouse: user.warehouse || '',
        mustChangePassword: user.mustChangePassword,
        assignedWarehouses: user.assignedWarehouses || [],
      },
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/auth/me
 * Returns authenticated user profile.
 */
router.get('/me', requireAuth, async (req, res, next) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User profile not found.',
          details: {},
        },
      });
    }

    return res.json({
      user: {
        id: user._id,
        name: user.name,
        fullName: user.name,
        email: user.email,
        loginId: user.loginId || user.email.split('@')[0],
        role: user.role,
        phone: user.phone || '',
        department: user.department || 'Supply Chain Operations',
        avatar: user.avatar || '',
        warehouse: user.warehouse || '',
        mustChangePassword: user.mustChangePassword,
        assignedWarehouses: user.assignedWarehouses || [],
      },
    });
  } catch (err) {
    next(err);
  }
});

/**
 * PUT /api/auth/profile
 * Updates user profile details (name, phone, department, avatar, warehouse).
 */
router.put('/profile', requireAuth, async (req, res, next) => {
  try {
    const { name, fullName, phone, department, avatar, warehouse } = req.body;
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User not found.',
          details: {},
        },
      });
    }

    const updatedName = (name || fullName || '').trim();
    if (updatedName) user.name = updatedName;
    if (phone !== undefined) user.phone = phone.trim();
    if (department !== undefined) user.department = department.trim();
    if (avatar !== undefined) user.avatar = avatar;
    if (warehouse !== undefined) user.warehouse = warehouse;

    await user.save();

    return res.json({
      message: 'Profile updated successfully.',
      user: {
        id: user._id,
        name: user.name,
        fullName: user.name,
        email: user.email,
        loginId: user.loginId || user.email.split('@')[0],
        role: user.role,
        phone: user.phone || '',
        department: user.department || 'Supply Chain Operations',
        avatar: user.avatar || '',
        warehouse: user.warehouse || '',
        mustChangePassword: user.mustChangePassword,
        assignedWarehouses: user.assignedWarehouses || [],
      },
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/auth/logout
 */
router.post('/logout', requireAuth, async (req, res) => {
  return res.json({
    message: 'Logged out successfully.',
  });
});

/**
 * PUT /api/auth/change-password
 */
router.put('/change-password', requireAuth, async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'currentPassword and newPassword are required.',
          details: {},
        },
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'New password must be at least 6 characters long.',
          details: {},
        },
      });
    }

    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User not found.',
          details: {},
        },
      });
    }

    const isMatch = await verifyPassword(currentPassword, user.passwordHash);
    if (!isMatch) {
      return res.status(400).json({
        error: {
          code: 'INCORRECT_PASSWORD',
          message: 'Current password is incorrect.',
          details: {},
        },
      });
    }

    user.passwordHash = await hashPassword(newPassword);
    user.mustChangePassword = false;
    await user.save();

    return res.json({
      message: 'Password changed successfully.',
      user: {
        id: user._id,
        name: user.name,
        fullName: user.name,
        email: user.email,
        role: user.role,
        mustChangePassword: user.mustChangePassword,
      },
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
