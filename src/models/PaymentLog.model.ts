import mongoose, { Schema } from 'mongoose';
import { IPaymentLog } from '../interfaces/package';

const paymentLogSchema: Schema<IPaymentLog> = new Schema({
  user_id: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  pack_id: {
    type: Schema.Types.ObjectId,
    ref: 'Package',
    required: true
  },
  payment_id: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  stripe_session_id: {
    type: String,
    trim: true
  },
  stripe_customer_id: {
    type: String,
    trim: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  currency: {
    type: String,
    required: true,
    default: 'usd',
    trim: true,
    lowercase: true
  },
  pack_type: {
    type: String,
    required: true,
    enum: ['daily', 'weekly', 'monthly', 'yearly', 'one-time'],
    trim: true
  },
  payment_type: {
    type: String,
    required: true,
    default: 'Stripe',
    trim: true
  },
  payment_status: {
    type: String,
    required: true,
    enum: ['pending', 'completed', 'failed', 'cancelled'],
    default: 'pending'
  },
  stripe_status: {
    type: String,
    trim: true
  },
  checkout_url: {
    type: String,
    trim: true
  },
  success_url: {
    type: String,
    trim: true
  },
  cancel_url: {
    type: String,
    trim: true
  },
  error_message: {
    type: String,
    trim: true
  },
  metadata: {
    type: Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true
});

// Index for better query performance
paymentLogSchema.index({ user_id: 1, payment_status: 1 });
paymentLogSchema.index({ pack_id: 1 });
paymentLogSchema.index({ stripe_session_id: 1 });
paymentLogSchema.index({ stripe_customer_id: 1 });
paymentLogSchema.index({ payment_status: 1 });
paymentLogSchema.index({ createdAt: -1 });

// Generate unique payment ID
paymentLogSchema.statics.generatePaymentId = function(): string {
  const timestamp = Date.now().toString();
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `pay_${timestamp}_${random}`;
};

const PaymentLog = mongoose.model<IPaymentLog>('PaymentLog', paymentLogSchema);

export default PaymentLog;