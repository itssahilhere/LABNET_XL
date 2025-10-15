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
                if (!user.package?.end_date || new Date(user.package.end_date) < new Date()) {
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
                const processedStockIds: string[] = []; // Track stock_ids in current upload

                // Process each row
                for (let i = 0; i < rows.length; i++) {
                    const row = rows[i];
                    const rowNumber = i + 2; // Excel row number (1-indexed + header)

                    // Validate row (excluding already processed stock_ids from this upload)
                    const validation = await validateProductRow(row, user._id.toString(), user.uid, processedStockIds);

                    // Auto-fill seller info from user profile
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
                    productData.pid = await (Product as any).generateUniquePid();

                    // Save to staging table
                    const productCheck = new ProductCheck({
                        ...productData,
                        status: validation.isValid ? 'valid' : 'invalid',
                        remarks: validation.isValid ? { message: 'All Done' } : validation.errors
                    });

                    await productCheck.save();
                    inserted++;
                    
                    if (row.Stock_ID) {
                        processedStockIds.push(row.Stock_ID.toString().trim());
                    }

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

    public async updateStagingProduct(req: Request, res: Response): Promise<Response> {
        try {
            const user = req.user;
            if (!user) {
                return sendErrorResponse(res, ErrorResponses.UNAUTHORIZED());
            }

            // Check package
            if (!user.package?.end_date || new Date(user.package?.end_date) < new Date()) {
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

            const validation = await validateProductData(productCheck.toObject(), user._id.toString(), id);

            if (validation.isValid) {
                const productData = productCheck.toObject();
                
                if (!productData.product_id && productData.stock_id) {
                    productData.product_id = `${user.uid}_${productData.stock_id}`;
                }
                
                const product = new Product({
                    ...productData,
                    _id: undefined
                });
                await product.save();

                await ProductCheck.findByIdAndDelete(id);

                return res.json({
                    status: true,
                    message: 'Row moved to products successfully'
                });
            } else {
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

    
    public async bulkSaveProducts(req: Request, res: Response): Promise<Response> {
        try {
            const user = req.user;
            if (!user) {
                return sendErrorResponse(res, ErrorResponses.UNAUTHORIZED());
            }

            if (!user.package?.end_date || new Date(user.package?.end_date) < new Date()) {
                return sendErrorResponse(res, ErrorResponses.FORBIDDEN('Your package has expired. Please buy a package first.'));
            }

            const { rows } = req.body;
            
            if (!rows || !Array.isArray(rows)) {
                return sendErrorResponse(res, ErrorResponses.BAD_REQUEST('Rows array is required'));
            }

            const invalidRows: any[] = [];
            const processedStockIds: string[] = []; // Track stock_ids being saved in this batch

            for (const rowData of rows) {
                // Pass processedStockIds to exclude them from duplicate check
                const validation = await validateProductData(rowData, user._id.toString(), undefined, processedStockIds);

                if (validation.isValid) {
                    // Generate unique PID if not present
                    if (!rowData.pid) {
                        rowData.pid = await (Product as any).generateUniquePid();
                    }
                    
                    if (!rowData.product_id && rowData.stock_id) {
                        rowData.product_id = `${user.uid}_${rowData.stock_id}`;
                    }
                    
                    // Save to products
                    const product = new Product({
                        ...rowData,
                        seller_id: user._id
                    });
                    await product.save();

                    // Track this stock_id
                    if (rowData.stock_id) {
                        processedStockIds.push(rowData.stock_id);
                    }

                    // Delete from staging
                    if (rowData.id) {
                        await ProductCheck.findByIdAndDelete(rowData.id);
                    }
                } else {
                    // Update staging with errors
                    if (rowData.id) {
                        await ProductCheck.findByIdAndUpdate(rowData.id, {
                            status: 'invalid',
                            remarks: validation.errors
                        });
                    }

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

    /**
     * Save single product directly (manual entry)
     * POST /api/save_row
     */
    public async saveSingleRow(req: Request, res: Response): Promise<Response> {
        try {
            const user = req.user;
            if (!user) {
                return sendErrorResponse(res, ErrorResponses.UNAUTHORIZED());
            }

            // Check package
            if (!user.package?.end_date || new Date(user.package?.end_date) < new Date()) {
                return sendErrorResponse(res, ErrorResponses.FORBIDDEN('Your package has expired. Please buy a package first.'));
            }

            // Prepare product data with auto-filled seller info and defaults
            const productData = {
                ...req.body,
                seller_id: user._id,
                seller_name: req.body.seller_name || user.name,
                seller_company: req.body.seller_company || user.company_name || '',
                seller_location: req.body.seller_location || user.location || '',
                seller_phone: req.body.seller_phone || user.phone_no || '',
                seller_whatsapp: req.body.seller_whatsapp || user.whatsapp_no || '',
                seller_email: req.body.seller_email || user.email,
                product_id: `${user.uid}_${req.body.stock_id}`,
                // Optional fields with defaults
                fluorescence: req.body.fluorescence || 'None',
                laboratory: req.body.laboratory || 'GIA',
                certificate_number: req.body.certificate_number || '',
                depth_percentage: req.body.depth_percentage || 0,
                table_percentage: req.body.table_percentage || 0,
                growth_type: req.body.growth_type || 'Natural',
                fancy_color: req.body.fancy_color || 'None',
                fancy_color_intensity: req.body.fancy_color_intensity || 'None',
                fancy_color_overtone: req.body.fancy_color_overtone || 'None',
                measurements: req.body.measurements || '00.00*00.00*00.00'
            };

            // Validate
            const validation = await validateProductData(productData, user._id.toString());

            if (!validation.isValid) {
                return sendErrorResponse(res, {
                    message: 'Validation failed',
                    statusCode: 400,
                    details: validation.errors
                });
            }

            // Generate unique PID
            productData.pid = await (Product as any).generateUniquePid();

            // Calculate total price if not provided
            if (!productData.total_price && productData.carat && productData.price_per_carat) {
                productData.total_price = productData.carat * productData.price_per_carat;
            }

            // Save product
            const product = new Product(productData);
            await product.save();

            return sendSuccessResponse(res, SuccessResponses.CREATED('Product created successfully', product));

        } catch (error: any) {
            if (error.code === 11000) {
                return sendErrorResponse(res, ErrorResponses.CONFLICT('Stock ID already exists. Please use a unique Stock ID.'));
            }

            logError({
                userId: req.user?._id || 'unknown',
                functionName: 'saveSingleRow',
                errorMsg: `Failed to save product: ${error.message}`
            });
            return sendErrorResponse(res, ErrorResponses.INTERNAL_ERROR());
        }
    }

    /**
     * Update existing product
     * PUT /api/products/:id
     */
    public async updateProduct(req: Request, res: Response): Promise<Response> {
        try {
            const user = req.user;
            if (!user) {
                return sendErrorResponse(res, ErrorResponses.UNAUTHORIZED());
            }

            // Check package
            if (!user.package?.end_date || new Date(user.package?.end_date) < new Date()) {
                return sendErrorResponse(res, ErrorResponses.FORBIDDEN('Your package has expired. Please buy a package first.'));
            }

            const { id } = req.params;
            const updates = req.body;

            // Find product
            const product = await Product.findOne({
                _id: id,
                seller_id: user._id
            });

            if (!product) {
                return sendErrorResponse(res, ErrorResponses.NOT_FOUND('Product not found'));
            }

            // Prepare updated data
            const updatedData = {
                ...product.toObject(),
                ...updates,
                seller_id: user._id
            };

            // Validate (exclude current product from duplicate check)
            const validation = await validateProductData(updatedData, user._id.toString(), id);

            if (!validation.isValid) {
                return sendErrorResponse(res, {
                    message: 'Validation failed',
                    statusCode: 400,
                    details: validation.errors
                });
            }

            // Recalculate total price if carat or price_per_carat changed
            if (updates.carat || updates.price_per_carat) {
                const carat = updates.carat || product.carat;
                const pricePerCarat = updates.price_per_carat || product.price_per_carat;
                updatedData.total_price = carat * pricePerCarat;
            }

            // Update product
            Object.assign(product, updatedData);
            await product.save();

            return sendSuccessResponse(res, SuccessResponses.OK('Product updated successfully', product));

        } catch (error: any) {
            if (error.code === 11000) {
                return sendErrorResponse(res, ErrorResponses.CONFLICT('Stock ID already exists. Please use a unique Stock ID.'));
            }

            logError({
                userId: req.user?._id || 'unknown',
                functionName: 'updateProduct',
                errorMsg: `Failed to update product: ${error.message}`
            });
            return sendErrorResponse(res, ErrorResponses.INTERNAL_ERROR());
        }
    }

    /**
     * Export all products to Excel
     * GET /api/export_excel
     */
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
