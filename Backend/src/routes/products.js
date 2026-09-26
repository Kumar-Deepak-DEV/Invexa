const express = require('express');
const mongoose = require('mongoose');
const Product = require('../models/Product');
const Quant = require('../models/Quant');
const { requireAuth, requireRole } = require('../middleware/auth');
const { getStockByProduct, hasNonZeroStock } = require('../services/stockCheck');
const { toDecimal } = require('../utils/decimalHelper');
const Decimal = require('decimal.js');

const router = express.Router();

/**
 * GET /api/products
 * Returns all active products with real-time stock balances from Quants
 */
router.get('/', requireAuth, async (req, res, next) => {
  try {
    const { category, search, active = 'true' } = req.query;
    const filter = {};

    if (active === 'true') {
      filter.active = true;
    } else if (active === 'false') {
      filter.active = false;
    }

    if (category) {
      filter.category = new RegExp(category, 'i');
    }

    if (search) {
      filter.$or = [
        { name: new RegExp(search, 'i') },
        { sku: new RegExp(search, 'i') },
        { category: new RegExp(search, 'i') },
      ];
    }

    const products = await Product.find(filter).sort({ createdAt: -1 }).lean();

    // Fetch all quants to calculate live stock totals per product
    const allQuants = await Quant.find({}).lean();
    const productStockMap = new Map();

    for (const q of allQuants) {
      const pId = q.productId.toString();
      const current = productStockMap.get(pId) || new Decimal(0);
      productStockMap.set(pId, current.plus(toDecimal(q.quantity)));
    }

    const enriched = products.map((p) => {
      const pId = p._id.toString();
      const stockDecimal = productStockMap.get(pId) || new Decimal(0);
      const stockNum = stockDecimal.toNumber();
      const reorderPt = p.reorderPoint !== undefined && p.reorderPoint !== null ? p.reorderPoint : 10;

      let status = 'In Stock';
      if (stockNum === 0) {
        status = 'Out of Stock';
      } else if (stockNum <= reorderPt) {
        status = 'Low Stock';
      }

      return {
        ...p,
        id: p._id.toString(),
        stock: stockNum,
        available: stockNum,
        reserved: 0,
        status,
      };
    });

    res.json(enriched);
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/products
 */
router.post('/', requireAuth, async (req, res, next) => {
  try {
    const {
      name,
      sku,
      category,
      categoryId,
      unit,
      unitOfMeasure,
      costPrice,
      sellingPrice,
      reorderPoint,
      reorderLevel,
      maxStock,
      reorderQty,
      description,
      warehouseId,
      locationId,
      warehouseName,
      locationName,
    } = req.body;

    if (!name || !sku) {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Product name and SKU are required.',
          details: {},
        },
      });
    }

    const cleanSku = sku.trim().toUpperCase();
    const existing = await Product.findOne({ sku: cleanSku });
    if (existing) {
      return res.status(409).json({
        error: {
          code: 'DUPLICATE_SKU',
          message: `Product with SKU '${cleanSku}' already exists.`,
          details: {},
        },
      });
    }

    const product = await Product.create({
      name: name.trim(),
      sku: cleanSku,
      category: category || 'General',
      categoryId: categoryId || '',
      unit: unit || unitOfMeasure || 'units',
      unitOfMeasure: unitOfMeasure || unit || 'units',
      costPrice: Number(costPrice) || 0,
      sellingPrice: Number(sellingPrice) || 0,
      reorderPoint: Number(reorderPoint || reorderLevel) || 10,
      reorderLevel: Number(reorderLevel || reorderPoint) || 10,
      maxStock: Number(maxStock) || 500,
      reorderQty: Number(reorderQty) || 50,
      description: description || '',
      warehouseId: warehouseId ? new mongoose.Types.ObjectId(warehouseId) : null,
      locationId: locationId ? new mongoose.Types.ObjectId(locationId) : null,
      warehouseName: warehouseName || '',
      locationName: locationName || '',
      active: true,
    });

    res.status(201).json({
      ...product.toObject(),
      id: product._id.toString(),
      stock: 0,
      available: 0,
      reserved: 0,
      status: 'Out of Stock',
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/products/:id
 */
router.get('/:id', requireAuth, async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id).lean();
    if (!product) {
      return res.status(404).json({
        error: {
          code: 'NOT_FOUND',
          message: 'Product not found.',
          details: {},
        },
      });
    }

    const stockDetails = await getStockByProduct(product._id);
    let totalStock = new Decimal(0);
    stockDetails.forEach((s) => {
      totalStock = totalStock.plus(toDecimal(s.quantity));
    });

    const stockNum = totalStock.toNumber();
    const reorderPt = product.reorderPoint || 10;
    let status = 'In Stock';
    if (stockNum === 0) status = 'Out of Stock';
    else if (stockNum <= reorderPt) status = 'Low Stock';

    res.json({
      ...product,
      id: product._id.toString(),
      stock: stockNum,
      available: stockNum,
      reserved: 0,
      status,
      stockBreakdown: stockDetails,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/products/:id/stock
 */
router.get('/:id/stock', requireAuth, async (req, res, next) => {
  try {
    const stock = await getStockByProduct(req.params.id, req.query.warehouseId);
    res.json({ data: stock });
  } catch (err) {
    next(err);
  }
});

/**
 * PUT /api/products/:id
 */
router.put('/:id', requireAuth, async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({
        error: {
          code: 'NOT_FOUND',
          message: 'Product not found.',
          details: {},
        },
      });
    }

    const {
      name,
      sku,
      category,
      categoryId,
      unit,
      unitOfMeasure,
      costPrice,
      sellingPrice,
      reorderPoint,
      reorderLevel,
      maxStock,
      reorderQty,
      description,
      warehouseId,
      locationId,
      warehouseName,
      locationName,
      active,
    } = req.body;

    if (name) product.name = name.trim();
    if (sku) {
      const cleanSku = sku.trim().toUpperCase();
      if (cleanSku !== product.sku) {
        const existing = await Product.findOne({ sku: cleanSku, _id: { $ne: product._id } });
        if (existing) {
          return res.status(409).json({
            error: {
              code: 'DUPLICATE_SKU',
              message: `Product with SKU '${cleanSku}' already exists.`,
              details: {},
            },
          });
        }
        product.sku = cleanSku;
      }
    }

    if (category !== undefined) product.category = category;
    if (categoryId !== undefined) product.categoryId = categoryId;
    if (unit !== undefined) product.unit = unit;
    if (unitOfMeasure !== undefined) product.unitOfMeasure = unitOfMeasure;
    if (costPrice !== undefined) product.costPrice = Number(costPrice);
    if (sellingPrice !== undefined) product.sellingPrice = Number(sellingPrice);
    if (reorderPoint !== undefined) product.reorderPoint = Number(reorderPoint);
    if (reorderLevel !== undefined) product.reorderLevel = Number(reorderLevel);
    if (maxStock !== undefined) product.maxStock = Number(maxStock);
    if (reorderQty !== undefined) product.reorderQty = Number(reorderQty);
    if (description !== undefined) product.description = description;
    if (warehouseId !== undefined) product.warehouseId = warehouseId ? new mongoose.Types.ObjectId(warehouseId) : null;
    if (locationId !== undefined) product.locationId = locationId ? new mongoose.Types.ObjectId(locationId) : null;
    if (warehouseName !== undefined) product.warehouseName = warehouseName;
    if (locationName !== undefined) product.locationName = locationName;
    if (active !== undefined) product.active = Boolean(active);

    await product.save();

    res.json({
      ...product.toObject(),
      id: product._id.toString(),
    });
  } catch (err) {
    next(err);
  }
});

/**
 * DELETE /api/products/:id
 */
router.delete('/:id', requireAuth, async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({
        error: {
          code: 'NOT_FOUND',
          message: 'Product not found.',
          details: {},
        },
      });
    }

    // Check if product has non-zero stock
    const stockList = await getStockByProduct(product._id);
    const hasStock = stockList.some((s) => s.quantity && s.quantity !== '0' && Number(s.quantity) > 0);

    if (hasStock) {
      return res.status(409).json({
        error: {
          code: 'PRODUCT_HAS_STOCK',
          message: 'Cannot delete product with existing non-zero stock balance.',
          details: {},
        },
      });
    }

    product.active = false;
    await product.save();

    res.json({
      message: 'Product deleted successfully.',
      id: product._id.toString(),
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
