import mongoose, { Document } from 'mongoose';

export interface IProduct extends Document {
  pid: string;
  product_id: string;
  stock_id: string;
  shape: string;
  carat: number;
  color: string;
  clarity: string;
  cut: string;
  polish: string;
  symmetry: string;
  fluorescence: string;
  laboratory: string;
  certificate_number: string;
  depth_percentage: number;
  table_percentage: number;
  price_per_carat: number;
  total_price: number;
  growth_type: string;
  fancy_color: string;
  fancy_color_intensity: string;
  fancy_color_overtone: string;
  seller_name: string;
  seller_company: string;
  seller_location: string;
  seller_phone: string;
  seller_whatsapp: string;
  seller_email: string;
  video_url: string;
  image_url: string;
  certificate_url: string;
  measurements: string;
  seller_id: mongoose.Types.ObjectId;
  createdAt?: Date;
  updatedAt?: Date;
}

// Product Check (Staging) Interface
export interface IProductCheck extends Document {
  pid: string;
  product_id: string;
  stock_id: string;
  shape: string;
  carat: number;
  color: string;
  clarity: string;
  cut: string;
  polish: string;
  symmetry: string;
  fluorescence: string;
  laboratory: string;
  certificate_number: string;
  depth_percentage: number;
  table_percentage: number;
  price_per_carat: number;
  total_price: number;
  growth_type: string;
  fancy_color: string;
  fancy_color_intensity: string;
  fancy_color_overtone: string;
  seller_name: string;
  seller_company: string;
  seller_location: string;
  seller_phone: string;
  seller_whatsapp: string;
  seller_email: string;
  video_url: string;
  image_url: string;
  certificate_url: string;
  measurements: string;
  seller_id: mongoose.Types.ObjectId;
  status: 'valid' | 'invalid';
  remarks: Record<string, string>;
  createdAt?: Date;
  updatedAt?: Date;
}

// Excel row interface for parsing
export interface IExcelRow {
  Stock_ID?: string;
  Shape?: string;
  Carat?: string | number;
  Color?: string;
  Clarity?: string;
  Cut?: string;
  Polish?: string;
  Symmetry?: string;
  Fluorescence?: string;
  Laboratory?: string;
  Certificate_Number?: string;
  Measurements?: string;
  Depth_Percentage?: string | number;
  Table_Percentage?: string | number;
  Price_Per_Carat?: string | number;
  Total_Price?: string | number;
  Growth_Type?: string;
  Fancy_Color?: string;
  Fancy_Color_Intensity?: string;
  Fancy_Color_Overtone?: string;
  Seller_Name?: string;
  Seller_Company?: string;
  Seller_Location?: string;
  Seller_Phone?: string;
  Seller_WhatsApp?: string;
  Seller_Email?: string;
  Video_URL?: string;
  Image_URL?: string;
  Certificate_URL?: string;
}

// Validation error structure
export interface IValidationError {
  row: number;
  stock_id: string;
  errors: Record<string, string>;
}

// Upload response structure
export interface IUploadResponse {
  status: boolean;
  inserted: number;
  errors: IValidationError[];
}
