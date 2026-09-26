const mongoose = require('mongoose');

const { Schema } = mongoose;

const UserSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ['manager', 'staff', 'Inventory Manager', 'Warehouse Staff', 'Admin'],
      default: 'manager',
      required: true,
    },
    loginId: {
      type: String,
      trim: true,
      sparse: true,
    },
    phone: {
      type: String,
      trim: true,
      default: '',
    },
    department: {
      type: String,
      trim: true,
      default: 'Supply Chain Operations',
    },
    avatar: {
      type: String,
      default: '',
    },
    warehouse: {
      type: String,
      default: '',
    },
    assignedWarehouses: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Warehouse',
      },
    ],
    mustChangePassword: {
      type: Boolean,
      default: false,
    },
    active: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

// Never serialize the password hash
UserSchema.set('toJSON', {
  transform: (_doc, ret) => {
    delete ret.passwordHash;
    return ret;
  },
});

module.exports = mongoose.model('User', UserSchema);
