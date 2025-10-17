import { IExcelRow } from '../interfaces/product';
import Product from '../models/Product.model';
import ProductCheck from '../models/ProductCheck.model';
import {
  isValidShape,
  isValidClarity,
  isValidColor,
  isValidFancyColor,
  isValidFluorescence,
  isValidCutPolishSymmetry,
  isValidFancyColorIntensity,
  isValidLaboratory,
  isValidGrowthType,
  isValidMeasurement,
} from '../constants/productValidation';

export interface IProductValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
  data?: any;
}

/**
 * Validate a single product row from Excel
 * @param excludeStockIds - Array of stock_ids to exclude from duplicate check (for same upload batch)
 */
export async function validateProductRow(
  row: IExcelRow,
  sellerId: string,
  userUid: string,
  excludeStockIds: string[] = []
): Promise<IProductValidationResult> {
  const errors: Record<string, string> = {};

  // Required field validation
  if (!row.Stock_ID || row.Stock_ID.toString().trim() === '') {
    errors.stock_id = 'Stock ID is required';
  }

  if (!row.Shape || row.Shape.toString().trim() === '') {
    errors.shape = 'Shape is required';
  } else if (!isValidShape(row.Shape.toString())) {
    errors.shape = `Invalid: "${row.Shape}"`;
  }

  if (!row.Carat || row.Carat.toString().trim() === '') {
    errors.carat = 'Carat is required';
  } else if (isNaN(Number(row.Carat))) {
    errors.carat = 'Carat must be numeric';
  } else if (Number(row.Carat) <= 0) {
    errors.carat = 'Carat must be greater than 0';
  }

  if (!row.Color || row.Color.toString().trim() === '') {
    errors.color = 'Color is required';
  } else if (!isValidColor(row.Color.toString())) {
    errors.color = `Invalid: "${row.Color}"`;
  }

  if (!row.Clarity || row.Clarity.toString().trim() === '') {
    errors.clarity = 'Clarity is required';
  } else if (!isValidClarity(row.Clarity.toString())) {
    errors.clarity = `Invalid: "${row.Clarity}"`;
  }

  // Optional field validation (when provided)
  if (row.Cut && !isValidCutPolishSymmetry(row.Cut.toString())) {
    errors.cut = `Invalid: "${row.Cut}"`;
  }

  if (row.Polish && !isValidCutPolishSymmetry(row.Polish.toString())) {
    errors.polish = `Invalid: "${row.Polish}"`;
  }

  if (row.Symmetry && !isValidCutPolishSymmetry(row.Symmetry.toString())) {
    errors.symmetry = `Invalid: "${row.Symmetry}"`;
  }

  if (row.Fluorescence && !isValidFluorescence(row.Fluorescence.toString())) {
    errors.fluorescence = `Invalid: "${row.Fluorescence}"`;
  }

  if (row.Laboratory && !isValidLaboratory(row.Laboratory.toString())) {
    errors.laboratory = `Invalid: "${row.Laboratory}"`;
  }

  if (row.Fancy_Color && !isValidFancyColor(row.Fancy_Color.toString())) {
    errors.fancy_color = `Invalid: "${row.Fancy_Color}"`;
  }

  if (
    row.Fancy_Color_Intensity &&
    !isValidFancyColorIntensity(row.Fancy_Color_Intensity.toString())
  ) {
    errors.fancy_color_intensity = `Invalid: "${row.Fancy_Color_Intensity}"`;
  }

  if (row.Fancy_Color_Overtone && !isValidFancyColor(row.Fancy_Color_Overtone.toString())) {
    errors.fancy_color_overtone = `Invalid: "${row.Fancy_Color_Overtone}"`;
  }

  if (row.Growth_Type && !isValidGrowthType(row.Growth_Type.toString())) {
    errors.growth_type = `Invalid: "${row.Growth_Type}"`;
  }

  if (row.Measurements && !isValidMeasurement(row.Measurements.toString())) {
    errors.measurements = 'Measurement must be in the format 99.99*99.99*99.99';
  }

  // Email validation
  if (row.Seller_Email) {
    const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
    if (!emailRegex.test(row.Seller_Email.toString())) {
      errors.seller_email = 'Invalid email format';
    }
  }

  // URL validation (when provided)
  const urlRegex = /^https?:\/\/.+/;
  if (row.Video_URL && !urlRegex.test(row.Video_URL.toString())) {
    errors.video_url = 'Invalid URL format';
  }

  if (row.Image_URL && !urlRegex.test(row.Image_URL.toString())) {
    errors.image_url = 'Invalid URL format';
  }

  if (row.Certificate_URL && !urlRegex.test(row.Certificate_URL.toString())) {
    errors.certificate_url = 'Invalid URL format';
  }

  // Percentage validations
  if (
    row.Depth_Percentage &&
    (Number(row.Depth_Percentage) < 0 || Number(row.Depth_Percentage) > 100)
  ) {
    errors.depth_percentage = 'Depth percentage must be between 0 and 100';
  }

  if (
    row.Table_Percentage &&
    (Number(row.Table_Percentage) < 0 || Number(row.Table_Percentage) > 100)
  ) {
    errors.table_percentage = 'Table percentage must be between 0 and 100';
  }

  // Duplicate check - Stock ID
  if (row.Stock_ID) {
    const stockId = row.Stock_ID.toString().trim();

    // Check in the current upload batch first
    if (excludeStockIds.includes(stockId)) {
      errors.stock_id = 'Duplicate Stock ID in current upload';
    } else {
      // Check in products table
      const existingProduct = await Product.findOne({
        stock_id: stockId,
        seller_id: sellerId,
      });

      if (existingProduct) {
        errors.stock_id = 'Duplicate Stock ID in products';
      } else {
        // Check in staging table
        const existingInStaging = await ProductCheck.findOne({
          stock_id: stockId,
          seller_id: sellerId,
        });

        if (existingInStaging) {
          errors.stock_id = 'Duplicate Stock ID in staging';
        }
      }
    }
  }

  const isValid = Object.keys(errors).length === 0;

  // Return validation result
  return {
    isValid,
    errors,
    data: isValid ? prepareProductData(row, sellerId, userUid) : null,
  };
}

/**
 * Prepare product data from Excel row
 */
function prepareProductData(row: IExcelRow, sellerId: string, userUid: string) {
  const stockId = row.Stock_ID?.toString().trim() || '';
  const carat = Number(row.Carat) || 0;
  const pricePerCarat = Number(row.Price_Per_Carat) || 0;

  return {
    product_id: `${userUid}_${stockId}`,
    stock_id: stockId,
    shape: row.Shape?.toString().trim() || '',
    carat: carat,
    color: row.Color?.toString().trim() || '',
    clarity: row.Clarity?.toString().trim() || '',
    cut: row.Cut?.toString().trim() || 'Good',
    polish: row.Polish?.toString().trim() || 'Good',
    symmetry: row.Symmetry?.toString().trim() || 'Good',
    fluorescence: row.Fluorescence?.toString().trim() || 'None',
    laboratory: row.Laboratory?.toString().trim() || 'GIA',
    certificate_number: row.Certificate_Number?.toString().trim() || '',
    measurements: row.Measurements?.toString().trim() || '00.00*00.00*00.00',
    depth_percentage: Number(row.Depth_Percentage) || 0,
    table_percentage: Number(row.Table_Percentage) || 0,
    price_per_carat: pricePerCarat,
    total_price: row.Total_Price ? Number(row.Total_Price) : carat * pricePerCarat,
    growth_type: row.Growth_Type?.toString().trim() || 'Natural',
    fancy_color: row.Fancy_Color?.toString().trim() || 'None',
    fancy_color_intensity: row.Fancy_Color_Intensity?.toString().trim() || 'None',
    fancy_color_overtone: row.Fancy_Color_Overtone?.toString().trim() || 'None',
    video_url: row.Video_URL?.toString().trim() || '',
    image_url: row.Image_URL?.toString().trim() || '',
    certificate_url: row.Certificate_URL?.toString().trim() || '',
    seller_id: sellerId,
  };
}

/**
 * Validate product data before saving
 * @param excludeId - Exclude this document ID from duplicate check (for updates)
 * @param excludeStockIds - Exclude these stock_ids from duplicate check (for batch operations)
 */
export async function validateProductData(
  data: any,
  sellerId: string,
  excludeId?: string,
  excludeStockIds: string[] = []
): Promise<IProductValidationResult> {
  const errors: Record<string, string> = {};

  // Required fields
  if (!data.stock_id) {
    errors.stock_id = 'Stock ID is required';
  }

  if (!data.shape) {
    errors.shape = 'Shape is required';
  } else if (!isValidShape(data.shape)) {
    errors.shape = `Invalid shape: "${data.shape}"`;
  }

  if (!data.carat || isNaN(Number(data.carat))) {
    errors.carat = 'Carat must be a valid number';
  }

  if (!data.color) {
    errors.color = 'Color is required';
  } else if (!isValidColor(data.color)) {
    errors.color = `Invalid color: "${data.color}"`;
  }

  if (!data.clarity) {
    errors.clarity = 'Clarity is required';
  } else if (!isValidClarity(data.clarity)) {
    errors.clarity = `Invalid clarity: "${data.clarity}"`;
  }

  // Duplicate check
  if (data.stock_id) {
    // First check in current batch
    if (excludeStockIds.includes(data.stock_id)) {
      errors.stock_id = 'Duplicate Stock ID in current batch';
    } else {
      // Then check in database
      const query: any = {
        stock_id: data.stock_id,
        seller_id: sellerId,
      };

      if (excludeId) {
        query._id = { $ne: excludeId };
      }

      const existingProduct = await Product.findOne(query);
      if (existingProduct) {
        errors.stock_id = 'Duplicate Stock ID in products';
      }
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}
