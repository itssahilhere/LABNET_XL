import mongoose, { Schema } from 'mongoose';
import { IPackage } from '../interfaces/package';

const packageSchema: Schema<IPackage> = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    pack_type: {
      type: String,
      required: true,
      enum: ['daily', 'weekly', 'monthly', 'yearly', 'one-time'],
      trim: true,
    },
    duration_days: {
      type: Number,
      required: true,
      min: 1,
    },
    max_products: {
      type: Number,
      min: 0,
      default: null, // null means unlimited
    },
    features: [
      {
        type: String,
        trim: true,
      },
    ],
    is_active: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Index for better query performance
packageSchema.index({ is_active: 1 });
packageSchema.index({ amount: 1 });

const Package = mongoose.model<IPackage>('Package', packageSchema);

export default Package;
