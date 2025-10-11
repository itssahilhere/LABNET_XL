import mongoose, { Document } from 'mongoose';

export interface IPackage extends Document {
  name: string;
  description: string;
  amount: number;
  pack_type: 'daily' | 'weekly' | 'monthly' | 'yearly' | 'one-time';
  duration_days: number;
  max_products: number | null;
  features: string[];
  is_active: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IPackActive extends Document {
  user_id: mongoose.Types.ObjectId;
  pack_id: mongoose.Types.ObjectId;
  payment_id: string;
  amount: number;
  pack_type: string;
  payment_type: string;
  is_active: boolean;
  activated_at: Date;
  expires_at: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IPaymentLog extends Document {
  user_id: mongoose.Types.ObjectId;
  pack_id: mongoose.Types.ObjectId;
  payment_id: string;
  stripe_session_id?: string;
  stripe_customer_id?: string;
  amount: number;
  currency: string;
  pack_type: 'daily' | 'weekly' | 'monthly' | 'yearly' | 'one-time';
  payment_type: string;
  payment_status: 'pending' | 'completed' | 'failed' | 'cancelled';
  stripe_status?: string;
  checkout_url?: string;
  success_url?: string;
  cancel_url?: string;
  error_message?: string;
  metadata?: any;
  createdAt?: Date;
  updatedAt?: Date;
}