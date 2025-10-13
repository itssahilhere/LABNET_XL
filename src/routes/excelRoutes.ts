import express, { Router } from 'express';
import { ExcelController } from '../controllers/ExcelController';
import { authenticateToken } from '../middleware/validation';

const router: Router = express.Router();
const excelController = new ExcelController();



// Download empty product template
router.get('/download-empty-product-template', excelController.downloadTemplate);

// Upload Excel file to staging (product_check table)
router.post('/product-check/upload', authenticateToken, excelController.uploadExcel);

// List all staging products for the authenticated user
router.get('/product-check', authenticateToken, excelController.listStagingProducts);

// Update staging product and move to products if valid
router.post('/product-check/:id', authenticateToken, excelController.updateStagingProduct);

// Bulk save valid products from staging to products table
router.post('/save-all', authenticateToken, excelController.bulkSaveProducts);

// Save single product directly (manual entry)
router.post('/save_row', authenticateToken, excelController.saveSingleRow);

// Update existing product (RESTful style)
router.put('/products/:id', authenticateToken, excelController.updateProduct);

// Update existing product (alternative route for POST requests)
router.post('/update_product/:id', authenticateToken, excelController.updateProduct);

// Export all products to Excel
router.get('/export_excel', authenticateToken, excelController.exportProducts);

export default router;
