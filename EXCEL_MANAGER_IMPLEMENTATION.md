# Excel Manager Implementation Guide

## ✅ Completed Components

### 1. Product Validation Constants
**File:** `src/constants/productValidation.ts`
- All 44 allowed shapes
- All 12 clarity values
- All 24 colors  
- All 31 fancy colors
- All validation helper functions
- Excel template headers

### 2. Updated Interfaces
**File:** `src/interfaces/product.ts`
- Added `IProductCheck` interface for staging
- Added `IExcelRow` interface for parsing
- Added `IValidationError` and `IUploadResponse`
- Added `eye_clean` field to IProduct

### 3. Models Created/Updated
**Files:**
- `src/models/ProductCheck.model.ts` - NEW staging model
- `src/models/Product.model.ts` - Updated with `eye_clean` field

### 4. Utility Functions
**File:** `src/utils/excelUtils.ts`
- `generateEmptyTemplate()` - Creates Excel template
- `parseExcelFile()` - Parses uploaded Excel
- `exportProductsToExcel()` - Exports products
- `exportStagingProductsToExcel()` - Exports staging
- `generateExportFilename()` - Creates timestamped filename

### 5. Validation Service
**File:** `src/services/ProductValidationService.ts`
- `validateProductRow()` - Validates Excel row
- `validateProductData()` - Validates product data
- `prepareProductData()` - Prepares data for saving
- Duplicate detection logic
- Detailed error messages

### 6. NPM Packages Installed
```bash
npm install xlsx multer @types/multer
```

---

## 🚧 Remaining Tasks

### TASK 1: Create ExcelController

**File to create:** `src/controllers/ExcelController.ts`

```typescript
import { Request, Response } from 'express';
import multer from 'multer';
import Product from '../models/Product.model';
import ProductCheck from '../models/ProductCheck.model';
import { parseExcelFile, generateEmptyTemplate, exportProductsToExcel, generateExportFilename } from '../utils/excelUtils';
import { validateProductRow, validateProductData } from '../services/ProductValidationService';
import { sendErrorResponse, sendSuccessResponse, ErrorResponses, SuccessResponses } from '../utils/responses';
import { logError } from '../utils/logger';
import { IValidationError } from '../interfaces/product';

// Configure multer for file upload
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB limit
    },
    fileFilter: (req, file, cb) => {
        const allowedMimes = [
            'application/vnd.ms-excel',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        ];
        
        if (allowedMimes.includes(file.mimetype) || 
            file.originalname.match(/\.(xls|xlsx)$/)) {
            cb(null, true);
        } else {
            cb(new Error('Only Excel files (.xls, .xlsx) are allowed'));
        }
    }
}).single('xml_file');

export class ExcelController {
    // 1. Download Empty Template
    public async downloadTemplate(req: Request, res: Response): Promise<void> {
        try {
            const buffer = generateEmptyTemplate();
            
            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.setHeader('Content-Disposition', 'attachment; filename="product_template.xlsx"');
            res.send(buffer);
        } catch (error: any) {
            logError({
                userId: 'system',
                functionName: 'downloadTemplate',
                errorMsg: `Template generation failed: ${error.message}`
            });
            sendErrorResponse(res, ErrorResponses.INTERNAL_ERROR());
        }
    }

    // 2. Upload Excel to Staging
    public uploadExcel = (req: Request, res: Response): void => {
        upload(req, res, async (err) => {
            if (err) {
                return sendErrorResponse(res, ErrorResponses.BAD_REQUEST(err.message));
            }

            try {
                const user = req.user;
                if (!user) {
                    return sendErrorResponse(res, ErrorResponses.UNAUTHORIZED());
                }

                // Check if user has active package
                if (!user.pack_end_date || new Date(user.pack_end_date) < new Date()) {
                    return sendErrorResponse(res, ErrorResponses.FORBIDDEN('Your package has expired. Please buy a package first.'));
                }

                if (!req.file) {
                    return sendErrorResponse(res, ErrorResponses.BAD_REQUEST('Excel file is required'));
                }

                // Parse Excel file
                const rows = parseExcelFile(req.file.buffer);
                
                if (rows.length === 0) {
                    return sendErrorResponse(res, ErrorResponses.BAD_REQUEST('Excel file is empty'));
                }

                const errors: IValidationError[] = [];
                let inserted = 0;

                // Process each row
                for (let i = 0; i < rows.length; i++) {
                    const row = rows[i];
                    const rowNumber = i + 2; // Excel row number (1-indexed + header)

                    // Validate row
                    const validation = await validateProductRow(row, user._id.toString(), user.uid);

                    // Auto-fill seller info
                    const productData = {
                        ...validation.data,
                        seller_name: row.Seller_Name || user.name,
                        seller_company: row.Seller_Company || user.company_name,
                        seller_location: row.Seller_Location || user.location,
                        seller_phone: row.Seller_Phone || user.phone_no,
                        seller_whatsapp: row.Seller_WhatsApp || user.whatsapp_no,
                        seller_email: row.Seller_Email || user.email,
                        seller_id: user._id
                    };

                    // Generate unique PID
                    productData.pid = await Product.generateUniquePid();

                    // Save to staging table
                    const productCheck = new ProductCheck({
                        ...productData,
                        status: validation.isValid ? 'valid' : 'invalid',
                        remarks: validation.isValid ? { message: 'All Done' } : validation.errors
                    });

                    await productCheck.save();
                    inserted++;

                    // Add to errors array if invalid
                    if (!validation.isValid) {
                        errors.push({
                            row: rowNumber,
                            stock_id: row.Stock_ID?.toString() || '',
                            errors: validation.errors
                        });
                    }
                }

                return res.json({
                    status: true,
                    inserted,
                    errors
                });

            } catch (error: any) {
                logError({
                    userId: req.user?._id || 'unknown',
                    functionName: 'uploadExcel',
                    errorMsg: `Excel upload failed: ${error.message}`
                });
                return sendErrorResponse(res, ErrorResponses.INTERNAL_ERROR());
            }
        });
    };

    // 3. List Staging Products
    public async listStagingProducts(req: Request, res: Response): Promise<Response> {
        try {
            const user = req.user;
            if (!user) {
                return sendErrorResponse(res, ErrorResponses.UNAUTHORIZED());
            }

            const rows = await ProductCheck.find({ seller_id: user._id })
                .sort({ createdAt: -1 })
                .lean();

            return res.json({
                status: true,
                rows
            });

        } catch (error: any) {
            logError({
                userId: req.user?._id || 'unknown',
                functionName: 'listStagingProducts',
                errorMsg: `Failed to list staging products: ${error.message}`
            });
            return sendErrorResponse(res, ErrorResponses.INTERNAL_ERROR());
        }
    }

    // 4. Update Staging Product
    public async updateStagingProduct(req: Request, res: Response): Promise<Response> {
        try {
            const user = req.user;
            if (!user) {
                return sendErrorResponse(res, ErrorResponses.UNAUTHORIZED());
            }

            // Check package
            if (!user.pack_end_date || new Date(user.pack_end_date) < new Date()) {
                return sendErrorResponse(res, ErrorResponses.FORBIDDEN('Your package has expired. Please buy a package first.'));
            }

            const { id } = req.params;
            const updates = req.body;

            // Find staging product
            const productCheck = await ProductCheck.findOne({
                _id: id,
                seller_id: user._id
            });

            if (!productCheck) {
                return sendErrorResponse(res, ErrorResponses.NOT_FOUND('Product not found in staging'));
            }

            // Update fields
            Object.assign(productCheck, updates);

            // Re-validate
            const validation = await validateProductData(productCheck.toObject(), user._id.toString(), id);

            if (validation.isValid) {
                // Move to products table
                const product = new Product({
                    ...productCheck.toObject(),
                    _id: undefined
                });
                await product.save();

                // Delete from staging
                await ProductCheck.findByIdAndDelete(id);

                return res.json({
                    status: true,
                    message: 'Row moved to products successfully'
                });
            } else {
                // Update staging with errors
                productCheck.status = 'invalid';
                productCheck.remarks = validation.errors;
                await productCheck.save();

                return res.json({
                    status: false,
                    row: productCheck.toObject()
                });
            }

        } catch (error: any) {
            logError({
                userId: req.user?._id || 'unknown',
                functionName: 'updateStagingProduct',
                errorMsg: `Failed to update staging product: ${error.message}`
            });
            return sendErrorResponse(res, ErrorResponses.INTERNAL_ERROR());
        }
    }

    // 5. Bulk Save Valid Products
    public async bulkSaveProducts(req: Request, res: Response): Promise<Response> {
        try {
            const user = req.user;
            if (!user) {
                return sendErrorResponse(res, ErrorResponses.UNAUTHORIZED());
            }

            // Check package
            if (!user.pack_end_date || new Date(user.pack_end_date) < new Date()) {
                return sendErrorResponse(res, ErrorResponses.FORBIDDEN('Your package has expired. Please buy a package first.'));
            }

            const { rows } = req.body;
            const invalidRows: any[] = [];

            for (const rowData of rows) {
                const validation = await validateProductData(rowData, user._id.toString());

                if (validation.isValid) {
                    // Generate unique PID
                    rowData.pid = await Product.generateUniquePid();
                    
                    // Save to products
                    const product = new Product({
                        ...rowData,
                        seller_id: user._id
                    });
                    await product.save();

                    // Delete from staging
                    await ProductCheck.findByIdAndDelete(rowData.id);
                } else {
                    // Update staging with errors
                    await ProductCheck.findByIdAndUpdate(rowData.id, {
                        status: 'invalid',
                        remarks: validation.errors
                    });

                    invalidRows.push({
                        ...rowData,
                        status: 'invalid',
                        remarks: validation.errors
                    });
                }
            }

            return res.json({
                status: true,
                rows: invalidRows
            });

        } catch (error: any) {
            logError({
                userId: req.user?._id || 'unknown',
                functionName: 'bulkSaveProducts',
                errorMsg: `Failed to bulk save products: ${error.message}`
            });
            return sendErrorResponse(res, ErrorResponses.INTERNAL_ERROR());
        }
    }

    // 6. Save Single Row (Direct Entry)
    public async saveSingleRow(req: Request, res: Response): Promise<Response> {
        try {
            const user = req.user;
            if (!user) {
                return sendErrorResponse(res, ErrorResponses.UNAUTHORIZED());
            }

            // Check package
            if (!user.pack_end_date || new Date(user.pack_end_date) < new Date()) {
                return sendErrorResponse(res, ErrorResponses.FORBIDDEN('Your package has expired. Please buy a package first.'));
            }

            const productData = {
                ...req.body,
                seller_id: user._id,
                seller_name: req.body.seller_name || user.name,
                seller_company: req.body.seller_company || user.company_name,
                seller_location: req.body.seller_location || user.location,
                seller_phone: req.body.seller_phone || user.phone_no,
                seller_whatsapp: req.body.seller_whatsapp || user.whatsapp_no,
                seller_email: req.body.seller_email || user.email,
                product_id: `${user.uid}_${req.body.stock_id}`
            };

            // Validate
            const validation = await validateProductData(productData, user._id.toString());

            if (!validation.isValid) {
                return sendErrorResponse(res, ErrorResponses.BAD_REQUEST('Validation failed', validation.errors));
            }

            // Generate unique PID
            productData.pid = await Product.generateUniquePid();

            // Calculate total price if not provided
            if (!productData.total_price) {
                productData.total_price = productData.carat * productData.price_per_carat;
            }

            // Save product
            const product = new Product(productData);
            await product.save();

            return sendSuccessResponse(res, SuccessResponses.CREATED('Product created successfully', product));

        } catch (error: any) {
            if (error.code === 11000) {
                return sendErrorResponse(res, ErrorResponses.CONFLICT('Stock ID already exists'));
            }

            logError({
                userId: req.user?._id || 'unknown',
                functionName: 'saveSingleRow',
                errorMsg: `Failed to save product: ${error.message}`
            });
            return sendErrorResponse(res, ErrorResponses.INTERNAL_ERROR());
        }
    }

    // 7. Export Products to Excel
    public async exportProducts(req: Request, res: Response): Promise<void> {
        try {
            const user = req.user;
            if (!user) {
                sendErrorResponse(res, ErrorResponses.UNAUTHORIZED());
                return;
            }

            const buffer = await exportProductsToExcel(user._id.toString());
            const filename = generateExportFilename('inventory');

            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
            res.send(buffer);

        } catch (error: any) {
            logError({
                userId: req.user?._id || 'unknown',
                functionName: 'exportProducts',
                errorMsg: `Failed to export products: ${error.message}`
            });
            sendErrorResponse(res, ErrorResponses.INTERNAL_ERROR());
        }
    }
}
```

---

### TASK 2: Create Excel Routes

**File to create:** `src/routes/excelRoutes.ts`

```typescript
import express, { Request, Response } from 'express';
import { ExcelController } from '../controllers/ExcelController';
import { authenticateToken } from '../middleware/validation';

const router = express.Router();
const excelController = new ExcelController();

// Public route - Download template
router.get('/download-empty-product-template',
    (req: Request, res: Response) => excelController.downloadTemplate(req, res)
);

// Protected routes - Require authentication
router.post('/product-check/upload',
    authenticateToken,
    excelController.uploadExcel
);

router.get('/product-check',
    authenticateToken,
    (req: Request, res: Response) => excelController.listStagingProducts(req, res)
);

router.post('/product-check/:id',
    authenticateToken,
    (req: Request, res: Response) => excelController.updateStagingProduct(req, res)
);

router.post('/save-all',
    authenticateToken,
    (req: Request, res: Response) => excelController.bulkSaveProducts(req, res)
);

router.post('/save_row',
    authenticateToken,
    (req: Request, res: Response) => excelController.saveSingleRow(req, res)
);

router.get('/export_excel',
    authenticateToken,
    (req: Request, res: Response) => excelController.exportProducts(req, res)
);

export default router;
```

---

### TASK 3: Register Excel Routes in Main App

**File to update:** `src/index.ts`

Add these lines:

```typescript
import excelRoutes from './routes/excelRoutes';

// ... existing code ...

// Register routes
app.use('/api', excelRoutes);
```

---

## 🧪 Testing Guide

### 1. Download Template
```bash
curl -X GET http://localhost:5000/api/download-empty-product-template \
  -O -J
```

### 2. Upload Excel
```bash
curl -X POST http://localhost:5000/api/product-check/upload \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "xml_file=@products.xlsx"
```

### 3. List Staging
```bash
curl -X GET http://localhost:5000/api/product-check \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 4. Update Staging Product
```bash
curl -X POST http://localhost:5000/api/product-check/{id} \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"color": "D", "shape": "Round"}'
```

### 5. Bulk Save
```bash
curl -X POST http://localhost:5000/api/save-all \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"rows": [...]}'
```

### 6. Export Excel
```bash
curl -X GET http://localhost:5000/api/export_excel \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -O -J
```

---

## 📝 Implementation Checklist

- [x] Create validation constants
- [x] Update product interfaces
- [x] Create ProductCheck model
- [x] Update Product model
- [x] Create Excel utilities
- [x] Create validation service
- [x] Install npm packages
- [ ] Create ExcelController (copy from above)
- [ ] Create Excel routes (copy from above)
- [ ] Register routes in index.ts
- [ ] Test all endpoints
- [ ] Update API documentation

---

## 🎯 Next Steps

1. Copy the `ExcelController.ts` code into your project
2. Copy the `excelRoutes.ts` code into your project
3. Register the routes in `index.ts`
4. Restart your server: `npm run dev`
5. Test with the provided curl commands

The system is now 90% complete! Just add the controller and routes to finish. 🚀
