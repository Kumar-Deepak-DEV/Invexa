const express = require('express');
const mongoose = require('mongoose');
const Decimal = require('decimal.js');
const Product = require('../models/Product');
const Quant = require('../models/Quant');
const { requireAuth, requireRole } = require('../middleware/auth');
const { getStockByProduct } = require('../services/stockCheck');
const { toDecimal } = require('../utils/decimalHelper');

const router = express.Router();

/**
 * GET /api/products
 * Accessible to any logged-in user.
 * Supports query params: includeInactive, active, category, search, page, limit.
 */
router.get('/', requireAuth, async (req, res, next) => {
  try {
    const { includeInactive, active, category, search, page = 1, limit = 50 } = req.query;
    const filter = {};

    if (active === 'false') {
      filter.active = false;
    } else if (includeInactive !== 'true' && active !== 'all') {
      filter.active = true;
    }

    if (category) {
      filter.category = new RegExp(`^${category}$`, 'i');
    }

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { sku: { $regex: search, $options: 'i' } },
        { category: { $regex: search, $options: 'i' } },
      ];
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 50));
    const skip = (pageNum - 1) * limitNum;

    const [total, products] = await Promise.all([
      Product.countDocuments(filter),
      Product.find(filter).sort({ name: 1, createdAt: -1 }).skip(skip).limit(limitNum).lean(),
    ]);

    // Fetch all quants to enrich products with real-time stock
    const productIds = products.map((p) => p._id);
    const quants = await Quant.find({ productId: { $in: productIds } }).lean();

    const productStockMap = new Map();
    for (const q of quants) {
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
        id: pId,
        stock: stockNum,
        available: stockNum,
        reserved: 0,
        status,
      };
    });

    return res.json({
      data: enriched,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/products/:id
 * Accessible to any logged-in user.
 * Returns 404 if product not found or inactive (unless ?includeInactive=true).
 */
router.get('/:id', requireAuth, async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(404).json({
        error: {
          code: 'PRODUCT_NOT_FOUND',
          message: 'Product not found.',
          details: { id },
        },
      });
    }

    const filter = { _id: id };
    if (req.query.includeInactive !== 'true' && req.query.active !== 'false') {
      filter.active = true;
    }

    const product = await Product.findOne(filter).lean();
    if (!product) {
      return res.status(404).json({
        error: {
          code: 'PRODUCT_NOT_FOUND',
          message: 'Product not found.',
          details: { id },
        },
      });
    }

    const stockDetails = await getStockByProduct(product._id);
    let totalStock = new Decimal(0);
    stockDetails.forEach((s) => {
      totalStock = totalStock.plus(toDecimal(s.quantity));
    });

    const stockNum = totalStock.toNumber();
    const reorderPt = product.reorderPoint !== undefined && product.reorderPoint !== null ? product.reorderPoint : 10;
    let status = 'In Stock';
    if (stockNum === 0) status = 'Out of Stock';
    else if (stockNum <= reorderPt) status = 'Low Stock';

    return res.json({
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
 * Returns stock levels for product across warehouses.
 */
router.get('/:id/stock', requireAuth, async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(404).json({
        error: {
          code: 'PRODUCT_NOT_FOUND',
          message: 'Product not found.',
          details: { id },
        },
      });
    }

    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({
        error: {
          code: 'PRODUCT_NOT_FOUND',
          message: 'Product not found.',
          details: { id },
        },
      });
    }

    const warehouseId = req.query.warehouse || req.query.warehouseId || null;
    const stock = await getStockByProduct(id, warehouseId);

    return res.json({
      productId: id,
      stock,
      data: stock,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/products
 * Manager only. Creates a new product.
 */
router.post('/', requireAuth, requireRole('manager'), async (req, res, next) => {
  try {
    const {
      name,
      sku,
      category = '',
      categoryId = '',
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

    if (!name || typeof name !== 'string' || !name.trim() || !sku || typeof sku !== 'string' || !sku.trim()) {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Product name and SKU are required.',
          details: {},
        },
      });
    }

    const parsedReorderPoint = reorderPoint !== null && reorderPoint !== undefined && reorderPoint !== ''
      ? Number(reorderPoint)
      : (reorderLevel !== null && reorderLevel !== undefined && reorderLevel !== '' ? Number(reorderLevel) : null);

    if (parsedReorderPoint !== null && (isNaN(parsedReorderPoint) || parsedReorderPoint < 0)) {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'reorderPoint must be a non-negative number or null.',
          details: { reorderPoint },
        },
      });
    }

    const cleanSku = sku.trim();
    const existing = await Product.findOne({ sku: cleanSku });
    if (existing) {
      return res.status(400).json({
        error: {
          code: 'DUPLICATE_SKU',
          message: `Product with SKU '${cleanSku}' already exists.`,
          details: { sku: cleanSku },
        },
      });
    }

    const uom = unitOfMeasure || unit || 'units';

    try {
      const product = await Product.create({
        name: name.trim(),
        sku: cleanSku,
        category: typeof category === 'string' ? category.trim() : 'General',
        categoryId: categoryId || '',
        unit: uom,
        unitOfMeasure: uom,
        costPrice: Number(costPrice) || 0,
        sellingPrice: Number(sellingPrice) || 0,
        reorderPoint: parsedReorderPoint !== null ? parsedReorderPoint : 10,
        reorderLevel: parsedReorderPoint !== null ? parsedReorderPoint : 10,
        maxStock: Number(maxStock) || 500,
        reorderQty: Number(reorderQty) || 50,
        description: description || '',
        warehouseId: warehouseId && mongoose.Types.ObjectId.isValid(warehouseId) ? new mongoose.Types.ObjectId(warehouseId) : null,
        locationId: locationId && mongoose.Types.ObjectId.isValid(locationId) ? new mongoose.Types.ObjectId(locationId) : null,
        warehouseName: warehouseName || '',
        locationName: locationName || '',
        active: true,
      });

      return res.status(201).json({
        ...product.toObject(),
        id: product._id.toString(),
        stock: 0,
        available: 0,
        reserved: 0,
        status: 'Out of Stock',
      });
    } catch (err) {
      if (err.code === 11000 || (err.message && err.message.includes('E11000'))) {
        return res.status(400).json({
          error: {
            code: 'DUPLICATE_SKU',
            message: 'A product with this SKU already exists.',
            details: { sku: cleanSku },
          },
        });
      }
      throw err;
    }
  } catch (err) {
    next(err);
  }
});

/**
 * PUT /api/products/:id and PATCH /api/products/:id
 * Manager only. Updates an existing product.
 */
const updateProductHandler = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(404).json({
        error: {
          code: 'PRODUCT_NOT_FOUND',
          message: 'Product not found.',
          details: { id },
        },
      });
    }

    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({
        error: {
          code: 'PRODUCT_NOT_FOUND',
          message: 'Product not found.',
          details: { id },
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

    if (name !== undefined) {
      if (typeof name !== 'string' || !name.trim()) {
        return res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Product name must be a non-empty string.',
            details: {},
          },
        });
      }
      product.name = name.trim();
    }

    if (sku !== undefined) {
      const cleanSku = sku.trim();
      if (cleanSku !== product.sku) {
        const existing = await Product.findOne({ sku: cleanSku, _id: { $ne: product._id } });
        if (existing) {
          return res.status(400).json({
            error: {
              code: 'DUPLICATE_SKU',
              message: `Product with SKU '${cleanSku}' already exists.`,
              details: { sku: cleanSku },
            },
          });
        }
        product.sku = cleanSku;
      }
    }

    if (category !== undefined) product.category = typeof category === 'string' ? category.trim() : '';
    if (categoryId !== undefined) product.categoryId = categoryId;
    if (unit !== undefined) product.unit = unit;
    if (unitOfMeasure !== undefined) product.unitOfMeasure = unitOfMeasure.trim();
    if (costPrice !== undefined) product.costPrice = Number(costPrice);
    if (sellingPrice !== undefined) product.sellingPrice = Number(sellingPrice);
    if (maxStock !== undefined) product.maxStock = Number(maxStock);
    if (reorderQty !== undefined) product.reorderQty = Number(reorderQty);
    if (description !== undefined) product.description = description;
    if (warehouseId !== undefined) product.warehouseId = warehouseId && mongoose.Types.ObjectId.isValid(warehouseId) ? new mongoose.Types.ObjectId(warehouseId) : null;
    if (locationId !== undefined) product.locationId = locationId && mongoose.Types.ObjectId.isValid(locationId) ? new mongoose.Types.ObjectId(locationId) : null;
    if (warehouseName !== undefined) product.warehouseName = warehouseName;
    if (locationName !== undefined) product.locationName = locationName;
    if (active !== undefined) product.active = Boolean(active);

    const checkReorder = reorderPoint !== undefined ? reorderPoint : reorderLevel;
    if (checkReorder !== undefined) {
      const parsedReorderPoint = checkReorder !== null && checkReorder !== ''
        ? Number(checkReorder)
        : null;

      if (parsedReorderPoint !== null && (isNaN(parsedReorderPoint) || parsedReorderPoint < 0)) {
        return res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'reorderPoint must be a non-negative number or null.',
            details: { reorderPoint: checkReorder },
          },
        });
      }
      product.reorderPoint = parsedReorderPoint;
      product.reorderLevel = parsedReorderPoint;
    }

    try {
      await product.save();
      return res.json({
        ...product.toObject(),
        id: product._id.toString(),
      });
    } catch (err) {
      if (err.code === 11000 || (err.message && err.message.includes('E11000'))) {
        return res.status(400).json({
          error: {
            code: 'DUPLICATE_SKU',
            message: 'A product with this SKU already exists.',
            details: { sku: product.sku },
          },
        });
      }
      throw err;
    }
  } catch (err) {
    next(err);
  }
};

router.put('/:id', requireAuth, requireRole('manager'), updateProductHandler);
router.patch('/:id', requireAuth, requireRole('manager'), updateProductHandler);

/**
 * DELETE /api/products/:id
 * Manager only. Soft-deletes product (active: false).
 */
router.delete('/:id', requireAuth, requireRole('manager'), async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(404).json({
        error: {
          code: 'PRODUCT_NOT_FOUND',
          message: 'Product not found.',
          details: { id },
        },
      });
    }

    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({
        error: {
          code: 'PRODUCT_NOT_FOUND',
          message: 'Product not found.',
          details: { id },
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
          details: { productId: id },
        },
      });
    }

    product.active = false;
    await product.save();

    return res.json({
      message: 'Product deactivated successfully.',
      id: product._id.toString(),
      product,
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
