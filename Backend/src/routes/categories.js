const express = require('express');
const Category = require('../models/Category');
const Product = require('../models/Product');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

/**
 * GET /api/categories
 */
router.get('/', requireAuth, async (req, res, next) => {
  try {
    const categories = await Category.find({ active: true }).sort({ createdAt: 1 }).lean();
    
    // Count live active products per category
    const products = await Product.find({ active: true }).lean();
    const countMap = new Map();
    for (const p of products) {
      const cat = p.category || 'General';
      countMap.set(cat, (countMap.get(cat) || 0) + 1);
    }

    const enriched = categories.map((c) => ({
      ...c,
      id: c._id.toString(),
      productCount: countMap.get(c.name) || 0,
    }));

    res.json(enriched);
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/categories
 */
router.post('/', requireAuth, async (req, res, next) => {
  try {
    const { name, code, description, color, icon } = req.body;
    if (!name) {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Category name is required.',
          details: {},
        },
      });
    }

    const category = await Category.create({
      name: name.trim(),
      code: code || name.slice(0, 4).toUpperCase(),
      description: description || '',
      color: color || '#2563EB',
      icon: icon || 'Package',
      productCount: 0,
      active: true,
    });

    res.status(201).json({
      ...category.toObject(),
      id: category._id.toString(),
    });
  } catch (err) {
    next(err);
  }
});

/**
 * PUT /api/categories/:id
 */
router.put('/:id', requireAuth, async (req, res, next) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({
        error: {
          code: 'NOT_FOUND',
          message: 'Category not found.',
          details: {},
        },
      });
    }

    const { name, code, description, color, icon } = req.body;
    if (name) category.name = name.trim();
    if (code !== undefined) category.code = code;
    if (description !== undefined) category.description = description;
    if (color !== undefined) category.color = color;
    if (icon !== undefined) category.icon = icon;

    await category.save();

    res.json({
      ...category.toObject(),
      id: category._id.toString(),
    });
  } catch (err) {
    next(err);
  }
});

/**
 * DELETE /api/categories/:id
 */
router.delete('/:id', requireAuth, async (req, res, next) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({
        error: {
          code: 'NOT_FOUND',
          message: 'Category not found.',
          details: {},
        },
      });
    }

    category.active = false;
    await category.save();

    res.json({
      message: 'Category deleted successfully.',
      id: category._id.toString(),
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
