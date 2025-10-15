import * as XLSX from 'xlsx';
import { IExcelRow } from '../interfaces/product';
import { EXCEL_HEADERS } from '../constants/productValidation';
import Product from '../models/Product.model';
import ProductCheck from '../models/ProductCheck.model';

/**
 * Generate empty Excel template with headers
 */
export function generateEmptyTemplate(): Buffer {
    const workbook = XLSX.utils.book_new();
    
    // Create worksheet with headers only
    const worksheetData = [[...EXCEL_HEADERS]];
    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
    
    // Set column widths for better readability
    const columnWidths = EXCEL_HEADERS.map(() => ({ wch: 20 }));
    worksheet['!cols'] = columnWidths;
    
    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Products');
    
    // Generate buffer
    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    return buffer;
}

/**
 * Parse Excel file and extract rows
 */
export function parseExcelFile(fileBuffer: Buffer): IExcelRow[] {
    const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
    
    // Get first sheet
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    
    // Convert to JSON
    const rawData: any[] = XLSX.utils.sheet_to_json(worksheet, { 
        defval: '',
        raw: false  // Get formatted strings instead of raw values
    });
    
    // Map to IExcelRow format and trim all values
    const rows: IExcelRow[] = rawData.map(row => {
        const trimmedRow: IExcelRow = {};
        
        // Trim all string values
        Object.keys(row).forEach(key => {
            const value = row[key];
            if (typeof value === 'string') {
                trimmedRow[key as keyof IExcelRow] = value.trim();
            } else {
                trimmedRow[key as keyof IExcelRow] = value;
            }
        });
        
        return trimmedRow;
    });
    
    // Filter out empty rows
    return rows.filter(row => {
        // A row is considered empty if stock_id is empty
        return row.Stock_ID && row.Stock_ID.toString().trim() !== '';
    });
}

/**
 * Export products to Excel
 */
export async function exportProductsToExcel(sellerId: string): Promise<Buffer> {
    // Fetch all products for the seller
    const products = await Product.find({ seller_id: sellerId })
        .sort({ createdAt: -1 })
        .lean();
    
    // Prepare data for export
    const exportData = products.map(product => ({
        'Stock ID': product.stock_id,
        'Product ID': product.product_id,
        'PID': product.pid,
        'Shape': product.shape,
        'Carat': product.carat,
        'Color': product.color,
        'Clarity': product.clarity,
        'Cut': product.cut,
        'Polish': product.polish,
        'Symmetry': product.symmetry,
        'Fluorescence': product.fluorescence,
        'Lab': product.laboratory,
        'Cert No.': product.certificate_number,
        'Measurements': product.measurements,
        'Depth %': product.depth_percentage,
        'Table %': product.table_percentage,
        'Price/Carat': product.price_per_carat,
        'Total Price': product.total_price,
        'Growth Type': product.growth_type,
        'Fancy Color': product.fancy_color,
        'Color Intensity': product.fancy_color_intensity,
        'Overtone': product.fancy_color_overtone,
        'Seller Name': product.seller_name,
        'Company': product.seller_company,
        'Location': product.seller_location,
        'Phone': product.seller_phone,
        'WhatsApp': product.seller_whatsapp,
        'Email': product.seller_email,
        'Video': product.video_url,
        'Image': product.image_url,
        'Certificate': product.certificate_url,
        'Created At': product.createdAt ? new Date(product.createdAt).toLocaleDateString() : '',
        'Updated At': product.updatedAt ? new Date(product.updatedAt).toLocaleDateString() : ''
    }));
    
    // Create workbook and worksheet
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(exportData);
    
    // Set column widths
    const columnWidths = Object.keys(exportData[0] || {}).map(() => ({ wch: 15 }));
    worksheet['!cols'] = columnWidths;
    
    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Inventory');
    
    // Generate buffer
    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    return buffer;
}

/**
 * Export staging products to Excel
 */
export async function exportStagingProductsToExcel(sellerId: string): Promise<Buffer> {
    // Fetch all staging products for the seller
    const products = await ProductCheck.find({ seller_id: sellerId })
        .sort({ createdAt: -1 })
        .lean();
    
    // Prepare data for export
    const exportData = products.map(product => ({
        'Stock ID': product.stock_id,
        'Product ID': product.product_id,
        'Status': product.status,
        'Shape': product.shape,
        'Carat': product.carat,
        'Color': product.color,
        'Clarity': product.clarity,
        'Cut': product.cut,
        'Polish': product.polish,
        'Symmetry': product.symmetry,
        'Fluorescence': product.fluorescence,
        'Lab': product.laboratory,
        'Cert No.': product.certificate_number,
        'Measurements': product.measurements,
        'Depth %': product.depth_percentage,
        'Table %': product.table_percentage,
        'Price/Carat': product.price_per_carat,
        'Total Price': product.total_price,
        'Growth Type': product.growth_type,
        'Fancy Color': product.fancy_color,
        'Color Intensity': product.fancy_color_intensity,
        'Overtone': product.fancy_color_overtone,
        'Errors': product.status === 'invalid' 
            ? JSON.stringify(product.remarks) 
            : '',
        'Created At': product.createdAt ? new Date(product.createdAt).toLocaleDateString() : ''
    }));
    
    // Create workbook and worksheet
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(exportData);
    
    // Set column widths
    const columnWidths = Object.keys(exportData[0] || {}).map(() => ({ wch: 15 }));
    worksheet['!cols'] = columnWidths;
    
    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Staging');
    
    // Generate buffer
    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    return buffer;
}

/**
 * Generate filename with timestamp
 */
export function generateExportFilename(prefix: string = 'inventory'): string {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
    const timeStr = new Date().toTimeString().split(' ')[0].replace(/:/g, '');
    return `${prefix}_export_${timestamp}_${timeStr}.xlsx`;
}
