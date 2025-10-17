import mongoose, { Schema } from 'mongoose';
import { IPackActive } from '../interfaces/package';

const packActiveSchema: Schema<IPackActive> = new Schema(
  {
    user_id: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    pack_id: {
      type: Schema.Types.ObjectId,
      ref: 'Package',
      required: true,
    },
    payment_id: {
      type: String,
      required: true,
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
    payment_type: {
      type: String,
      required: true,
      default: 'Stripe',
      trim: true,
    },
    is_active: {
      type: Boolean,
      default: true,
    },
    activated_at: {
      type: Date,
      required: true,
      default: Date.now,
    },
    expires_at: {
      type: Date,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Index for better query performance
packActiveSchema.index({ user_id: 1, is_active: 1 });
packActiveSchema.index({ pack_id: 1 });
packActiveSchema.index({ expires_at: 1 });
packActiveSchema.index({ payment_id: 1 });

// Virtual to populate package details
packActiveSchema.virtual('package', {
  ref: 'Package',
  localField: 'pack_id',
  foreignField: '_id',
  justOne: true,
});

// Virtual to populate user details
packActiveSchema.virtual('seller', {
  ref: 'User',
  localField: 'user_id',
  foreignField: '_id',
  justOne: true,
});

// Ensure virtual fields are serialized
packActiveSchema.set('toJSON', { virtuals: true });
packActiveSchema.set('toObject', { virtuals: true });

const PackActive = mongoose.model<IPackActive>('PackActive', packActiveSchema);

export default PackActive;
