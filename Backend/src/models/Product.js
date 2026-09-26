const mongoose = require('mongoose');

const { Schema } = mongoose;

const ProductSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    sku: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    category: {
      type: String,
      trim: true,
      default: 'General',
    },
    categoryId: {
      type: String,
      trim: true,
      default: '',
    },
    unitOfMeasure: {
      type: String,
      default: 'units',
      trim: true,
    },
    unit: {
      type: String,
      default: 'units',
      trim: true,
    },
    costPrice: {
      type: Number,
      default: 0,
      min: 0,
    },
    sellingPrice: {
      type: Number,
      default: 0,
      min: 0,
    },
    description: {
      type: String,
      default: '',
      trim: true,
    },
    warehouseId: {
      type: Schema.Types.ObjectId,
      ref: 'Warehouse',
      default: null,
    },
    locationId: {
      type: Schema.Types.ObjectId,
      ref: 'Location',
      default: null,
    },
    warehouseName: {
      type: String,
      default: '',
    },
    locationName: {
      type: String,
      default: '',
    },
    reorderPoint: {
      type: Number,
      default: 10,
      min: 0,
    },
    reorderLevel: {
      type: Number,
      default: 10,
      min: 0,
    },
    maxStock: {
      type: Number,
      default: 500,
      min: 0,
    },
    reorderQty: {
      type: Number,
      default: 50,
      min: 0,
    },
    active: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Product', ProductSchema);
