import mongoose, { Document, Model } from 'mongoose';

export interface IUser extends Document {
  name: string;
  email: string;
  company_name: string;
  location: string;
  phone_no: string;
  whatsapp_no?: string;
  password: string;
  show_pass: string;
  uid: string;
  kyc: number;
  vat_number: string;
  id_proof?: string;
  pack_id?: mongoose.Types.ObjectId;
  enable?: number;
  role: 'user' | 'admin';
  approval_status: 'pending' | 'approved' | 'rejected';
  approved_by?: mongoose.Types.ObjectId;
  approved_at?: Date;
  rejection_reason?: string;
  pack_start_date?: Date;
  pack_end_date?: Date;
  createdAt?: Date;
  updatedAt?: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
  generateAuthToken(): string;
}

export interface IUserModel extends Model<IUser> {
  findByCredentials(email: string, password: string): Promise<IUser>;
  generateUniqueUid(): Promise<string>;
  createDefaultAdmin(): Promise<IUser>;
}

export interface IRegisterRequest {
  name: string;
  company_name: string;
  location: string;
  email: string;
  password: string;
  phone_number: string;
  whatsapp_number?: string;
  vat_number: string;
  id_proof?: any; 
}

export interface IRegisterResponse {
  message: string;
  user: Partial<IUser>;
  token: string;
}

export interface ILoginRequest {
  email: string;
  password: string;
}

export interface IAuthResponse {
  message: string;
  user: Partial<IUser>;
  token: string;
}

export interface IApprovalRequest {
  userId: string;
  status: 'approved' | 'rejected';
  rejectionReason?: string;
}

export interface IPendingUsersResponse {
  message: string;
  users: Partial<IUser>[];
  total: number;
}

export interface IRoleUpdateRequest {
  role: 'user' | 'admin';
  reason?: string;
}

export interface IRoleUpdateResponse {
  message: string;
  userId: string;
  email: string;
  name: string;
  oldRole: 'user' | 'admin';
  newRole: 'user' | 'admin';
  updatedBy: string;
  updatedAt: Date;
  reason?: string;
}