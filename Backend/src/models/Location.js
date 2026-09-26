const mongoose = require('mongoose');

const { Schema } = mongoose;

const LocationSchema = new Schema(
  {
    warehouseId: {
      type: Schema.Types.ObjectId,
      ref: 'Warehouse',
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    code: {
      type: String,
      trim: true,
      default: '',
    },
    warehouseName: {
      type: String,
      trim: true,
      default: '',
    },
    type: {
      type: String,
      trim: true,
      default: 'Storage',
    },
    capacity: {
      type: Number,
      default: 5000,
    },
    occupied: {
      type: Number,
      default: 0,
    },
    aisle: {
      type: String,
      trim: true,
      default: '',
    },
    shelf: {
      type: String,
      trim: true,
      default: '',
    },
    active: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

LocationSchema.index({ warehouseId: 1, name: 1 });

module.exports = mongoose.model('Location', LocationSchema);
