import { Request, Response } from 'express';
import Product from '../models/Product.model';
import ProductCheck from '../models/ProductCheck.model';
import {
  parseExcelFile,
  generateEmptyTemplate,
  exportProductsToExcel,
  generateExportFilename,
} from '../utils/excelUtils';
import { validateProductRow, validateProductData } from '../services/ProductValidationService';
import {
  sendErrorResponse,
  sendSuccessResponse,
  ErrorResponses,
  SuccessResponses,
} from '../utils/responses';
import { logError, logSuccess } from '../utils/logger';
import { IValidationError } from '../interfaces/product';
import { uploadFiles } from '../utils/fileUpload';

export class ExcelController {
  private checkAuth(req: Request, res: Response): boolean {
    if (!req.user) {
      sendErrorResponse(res, ErrorResponses.UNAUTHORIZED());
      return false;
    }
    return true;
  }

  private checkPackage(req: Request, res: Response): boolean {
    const user = req.user;
    if (!user?.package?.end_date || new Date(user.package.end_date) < new Date()) {
      sendErrorResponse(
        res,
        ErrorResponses.FORBIDDEN('Your package has expired. Please buy a package first.')
      );
      return false;
    }
    return true;
  }

  private handleMongoError(error: any, res: Response): Response {
    // Handle MongoDB duplicate key error
    if (error.code === 11000 || error.name === 'MongoServerError') {
      const field = Object.keys(error.keyPattern || {})[0] || 'field';
      return res.status(409).json({
        status: false,
        message: `Duplicate ${field}: This value already exists`,
      });
    }

    // Handle validation errors
    if (error.name === 'ValidationError') {
      const errors: Record<string, string> = {};
      for (const field in error.errors) {
        errors[field] = error.errors[field].message;
      }
      return res.status(422).json({
        status: false,
        message: 'Validation failed',
        errors,
      });
    }

    // Handle cast errors (invalid ObjectId, etc.)
    if (error.name === 'CastError') {
      return res.status(400).json({
        status: false,
        message: `Invalid ${error.path}: ${error.value}`,
      });
    }

    return sendErrorResponse(res, ErrorResponses.INTERNAL_ERROR());
  }

  private buildProductDataWithSellerInfo(bodyData: any, user: any): any {
    return {
      ...bodyData,
      _id: undefined,
      seller_id: user._id,
      seller_name: bodyData.seller_name || user.name,
      seller_company: bodyData.seller_company || user.company_name || '',
      seller_location: bodyData.seller_location || user.location || '',
      seller_phone: bodyData.seller_phone || user.phone_no || '',
      seller_whatsapp: bodyData.seller_whatsapp || user.whatsapp_no || '',
      seller_email: bodyData.seller_email || user.email,
    };
  }

  private applyProductDefaults(productData: any): any {
    return {
      ...productData,
      fluorescence: productData.fluorescence || 'None',
      laboratory: productData.laboratory || 'GIA',
      certificate_number: productData.certificate_number || '',
      depth_percentage: productData.depth_percentage || 0,
      table_percentage: productData.table_percentage || 0,
      growth_type: productData.growth_type || 'Natural',
      fancy_color: productData.fancy_color || 'None',
      fancy_color_intensity: productData.fancy_color_intensity || 'None',
      fancy_color_overtone: productData.fancy_color_overtone || 'None',
      measurements: productData.measurements || '00.00*00.00*00.00',
    };
  }

  private async deleteStagingProductsByIds(
    ids: string[],
    userId: string,
    functionName: string
  ): Promise<{ deleted: any[]; notFound: string[] }> {
    const deletedProducts = [];
    const notFoundProducts = [];

    for (const productId of ids) {
      try {
        const stagingProduct = await ProductCheck.findOne({
          _id: productId,
          seller_id: userId,
        });

        if (!stagingProduct) {
          notFoundProducts.push(productId);
          continue;
        }

        await ProductCheck.findByIdAndDelete(stagingProduct._id);
        deletedProducts.push({
          id: stagingProduct._id,
          pid: stagingProduct.pid,
          product_id: stagingProduct.product_id,
          stock_id: stagingProduct.stock_id,
          status: stagingProduct.status,
        });
      } catch (error: any) {
        logError({
          userId,
          functionName,
          errorMsg: `Failed to delete staging product ${productId}: ${error.message}`,
        });
        notFoundProducts.push(productId);
      }
    }

    return { deleted: deletedProducts, notFound: notFoundProducts };
  }
  public downloadTemplate = async (req: Request, res: Response): Promise<void> => {
    try {
      const buffer = generateEmptyTemplate();

      res.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      );
      res.setHeader('Content-Disposition', 'attachment; filename="product_template.xlsx"');
      res.send(buffer);
    } catch (error: any) {
      logError({
        userId: 'system',
        functionName: 'downloadTemplate',
        errorMsg: `Template generation failed: ${error.message}`,
      });
      sendErrorResponse(res, ErrorResponses.INTERNAL_ERROR());
    }
  };

  public uploadExcel = async (req: Request, res: Response): Promise<Response> => {
    try {
      if (!this.checkAuth(req, res)) return res;
      if (!this.checkPackage(req, res)) return res;

      const user = req.user;
      const fileData = req.body?.fileDetails;

      if (!fileData || !fileData.base64 || !fileData.fileName) {
        return sendErrorResponse(
          res,
          ErrorResponses.BAD_REQUEST('Excel file is required with base64 content and fileName')
        );
      }

      // Validate file type
      const allowedExtensions = ['.xls', '.xlsx'];
      const fileExtension = fileData.fileName
        .substring(fileData.fileName.lastIndexOf('.'))
        .toLowerCase();

      if (!allowedExtensions.includes(fileExtension)) {
        return sendErrorResponse(
          res,
          ErrorResponses.BAD_REQUEST('Only Excel files (.xls, .xlsx) are allowed')
        );
      }

      // Validate Excel MIME types
      const allowedMimes = [
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      ];

      const contentType = fileData.base64.split(';')[0].split(':')[1];
      if (contentType && !allowedMimes.includes(contentType)) {
        return sendErrorResponse(
          res,
          ErrorResponses.BAD_REQUEST(
            `Invalid content type: ${contentType}. Only Excel files are allowed.`
          )
        );
      }

      let uploadResult;
      try {
        const modifiedReq = {
          ...req,
          body: {
            ...req.body,
            fileDetails: [fileData], // Wrap in array for uploadFiles
          },
        };
        uploadResult = await uploadFiles(modifiedReq as Request, 'excel', 10 * 1024 * 1024);
      } catch (error: any) {
        return res.status(error.code || 500).json({
          status: false,
          message: error.message || 'File upload failed',
        });
      }

      const s3Url = uploadResult.urls[0];

      logSuccess({
        userId: user._id.toString(),
        functionName: 'uploadExcel',
        successMsg: `Excel file uploaded to S3: ${s3Url}`,
      });

      // Convert base64 to buffer for parsing
      const base64Content = fileData.base64.split(';base64,')[1];
      const buffer = Buffer.from(base64Content, 'base64');

      // Parse Excel file from buffer
      const rows = parseExcelFile(buffer);

      if (rows.length === 0) {
        return sendErrorResponse(res, ErrorResponses.BAD_REQUEST('Excel file is empty'));
      }

      const errors: IValidationError[] = [];
      let inserted = 0;
      const processedStockIds: string[] = [];

      // Process each row
      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const rowNumber = i + 2;

        const validation = await validateProductRow(
          row,
          user._id.toString(),
          user.uid,
          processedStockIds
        );

        // Auto-fill seller info from user profile
        const productData = {
          ...validation.data,
          seller_name: row.Seller_Name || user.name,
          seller_company: row.Seller_Company || user.company_name,
          seller_location: row.Seller_Location || user.location,
          seller_phone: row.Seller_Phone || user.phone_no,
          seller_whatsapp: row.Seller_WhatsApp || user.whatsapp_no,
          seller_email: row.Seller_Email || user.email,
          seller_id: user._id,
        };

        productData.pid = await (Product as any).generateUniquePid();

        const productCheck = new ProductCheck({
          ...productData,
          status: validation.isValid ? 'valid' : 'invalid',
          remarks: validation.isValid ? { message: 'All Done' } : validation.errors,
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
            errors: validation.errors,
          });
        }
      }

      return res.json({
        status: true,
        inserted,
        errors,
        s3_url: s3Url,
      });
    } catch (error: any) {
      logError({
        userId: req.user?._id || 'unknown',
        functionName: 'uploadExcel',
        errorMsg: `Excel upload failed: ${error.message}`,
      });
      return sendErrorResponse(res, ErrorResponses.INTERNAL_ERROR());
    }
  };

  public listStagingProducts = async (req: Request, res: Response): Promise<Response> => {
    try {
      if (!this.checkAuth(req, res)) return res;

      const rows = await ProductCheck.find({ seller_id: req.user._id })
        .sort({ createdAt: -1 })
        .lean();

      return res.json({
        status: true,
        rows,
      });
    } catch (error: any) {
      logError({
        userId: req.user?._id || 'unknown',
        functionName: 'listStagingProducts',
        errorMsg: `Failed to list staging products: ${error.message}`,
      });
      return sendErrorResponse(res, ErrorResponses.INTERNAL_ERROR());
    }
  };

  public updateStagingProduct = async (req: Request, res: Response): Promise<Response> => {
    try {
      if (!this.checkAuth(req, res)) return res;
      if (!this.checkPackage(req, res)) return res;

      const user = req.user;
      const { id } = req.params;
      const updates = req.body;

      const productCheck = await ProductCheck.findOne({
        _id: id,
        seller_id: user._id,
      });

      if (!productCheck) {
        return sendErrorResponse(res, ErrorResponses.NOT_FOUND('Product not found in staging'));
      }

      Object.assign(productCheck, updates);

      const validation = await validateProductData(
        productCheck.toObject(),
        user._id.toString(),
        id
      );

      if (validation.isValid) {
        const productData = productCheck.toObject();

        if (!productData.product_id && productData.stock_id) {
          productData.product_id = `${user.uid}_${productData.stock_id}`;
        }

        const product = new Product({
          ...productData,
          _id: undefined,
        });
        await product.save();

        await ProductCheck.findByIdAndDelete(id);

        return res.json({
          status: true,
          message: 'Row moved to products successfully',
        });
      } else {
        productCheck.status = 'invalid';
        productCheck.remarks = validation.errors;
        await productCheck.save();

        return res.json({
          status: false,
          row: productCheck.toObject(),
        });
      }
    } catch (error: any) {
      logError({
        userId: req.user?._id || 'unknown',
        functionName: 'updateStagingProduct',
        errorMsg: `Failed to update staging product: ${error.message}`,
      });
      return sendErrorResponse(res, ErrorResponses.INTERNAL_ERROR());
    }
  };

  public bulkSaveProducts = async (req: Request, res: Response): Promise<Response> => {
    try {
      if (!this.checkAuth(req, res)) return res;
      if (!this.checkPackage(req, res)) return res;

      const user = req.user;
      const { rows } = req.body;

      if (!rows || !Array.isArray(rows)) {
        return sendErrorResponse(res, ErrorResponses.BAD_REQUEST('Rows array is required'));
      }

      const invalidRows: any[] = [];
      let saved = 0;
      const processedStockIds: string[] = [];

      for (const rowData of rows) {
        try {
          const validation = await validateProductData(
            rowData,
            user._id.toString(),
            undefined,
            processedStockIds
          );

          if (validation.isValid) {
            if (!rowData.pid) {
              rowData.pid = await (Product as any).generateUniquePid();
            }

            if (!rowData.product_id && rowData.stock_id) {
              rowData.product_id = `${user.uid}_${rowData.stock_id}`;
            }

            const product = new Product({
              ...rowData,
              seller_id: user._id,
              _id: undefined,
            });
            await product.save();
            saved++;

            if (rowData.stock_id) {
              processedStockIds.push(rowData.stock_id);
            }

            if (rowData._id) {
              await ProductCheck.findByIdAndDelete(rowData._id);
            }
          } else {
            if (rowData._id) {
              await ProductCheck.findByIdAndUpdate(rowData._id, {
                status: 'invalid',
                remarks: validation.errors,
              });
            }

            invalidRows.push({
              ...rowData,
              status: 'invalid',
              remarks: validation.errors,
            });
          }
        } catch (error: any) {
          const errorMessage = error.message || 'Unknown error';

          if (rowData._id) {
            await ProductCheck.findByIdAndUpdate(rowData._id, {
              status: 'invalid',
              remarks: { error: errorMessage },
            });
          }

          invalidRows.push({
            ...rowData,
            status: 'invalid',
            remarks: { error: errorMessage },
          });
        }
      }

      return res.json({
        status: true,
        saved,
        invalidRows,
      });
    } catch (error: any) {
      logError({
        userId: req.user?._id || 'unknown',
        functionName: 'bulkSaveProducts',
        errorMsg: `Failed to bulk save products: ${error.message}`,
      });
      return sendErrorResponse(res, ErrorResponses.INTERNAL_ERROR());
    }
  };

  /**
   * Save single product directly (manual entry)
   * POST /api/save_row
   */
  public saveSingleRow = async (req: Request, res: Response): Promise<Response> => {
    try {
      if (!this.checkAuth(req, res)) return res;
      if (!this.checkPackage(req, res)) return res;

      const user = req.user;
      let productData = this.buildProductDataWithSellerInfo(req.body, user);
      productData.product_id = `${user.uid}_${req.body.stock_id}`;
      productData = this.applyProductDefaults(productData);

      const validation = await validateProductData(productData, user._id.toString());

      if (!validation.isValid) {
        return sendErrorResponse(res, {
          message: 'Validation failed',
          statusCode: 400,
          details: validation.errors,
        });
      }

      productData.pid = await (Product as any).generateUniquePid();

      if (!productData.total_price && productData.carat && productData.price_per_carat) {
        productData.total_price = productData.carat * productData.price_per_carat;
      }

      const product = new Product(productData);
      await product.save();

      return sendSuccessResponse(
        res,
        SuccessResponses.CREATED('Product created successfully', product)
      );
    } catch (error: any) {
      logError({
        userId: req.user?._id || 'unknown',
        functionName: 'saveSingleRow',
        errorMsg: `Failed to save product: ${error.message}`,
      });

      return this.handleMongoError(error, res);
    }
  };

  /**
   * Update existing product
   * PUT /api/products/:id
   */
  public updateProduct = async (req: Request, res: Response): Promise<Response> => {
    try {
      if (!this.checkAuth(req, res)) return res;
      if (!this.checkPackage(req, res)) return res;

      const user = req.user;
      const { id } = req.params;
      let updates = req.body;

      if (updates.field && updates.value !== undefined) {
        updates = { [updates.field]: updates.value };
      }

      const product = await Product.findOne({
        _id: id,
        seller_id: user._id,
      });

      if (!product) {
        return sendErrorResponse(res, ErrorResponses.NOT_FOUND('Product not found'));
      }

      if (updates.stock_id && updates.stock_id !== product.stock_id) {
        const duplicateStock = await Product.findOne({
          seller_id: user._id,
          stock_id: updates.stock_id,
          _id: { $ne: product._id },
        });

        if (duplicateStock) {
          return res.status(409).json({
            status: false,
            message: 'Stock ID already exists for another product',
          });
        }

        updates.product_id = `${user.uid}_${updates.stock_id}`;
      }

      const updatedData = {
        ...product.toObject(),
        ...updates,
        seller_id: user._id,
      };

      const validation = await validateProductData(updatedData, user._id.toString(), id);

      if (!validation.isValid) {
        return sendErrorResponse(res, {
          message: 'Validation failed',
          statusCode: 400,
          details: validation.errors,
        });
      }

      if (updates.carat || updates.price_per_carat) {
        const carat = updates.carat || product.carat;
        const pricePerCarat = updates.price_per_carat || product.price_per_carat;
        updatedData.total_price = carat * pricePerCarat;
      }

      Object.assign(product, updatedData);
      await product.save();

      return sendSuccessResponse(res, SuccessResponses.OK('Product updated successfully', product));
    } catch (error: any) {
      logError({
        userId: req.user?._id || 'unknown',
        functionName: 'updateProduct',
        errorMsg: `Failed to update product: ${error.message}`,
      });

      return this.handleMongoError(error, res);
    }
  };

  /**
   * Export all products to Excel
   * GET /api/export_excel
   */
  public exportProducts = async (req: Request, res: Response): Promise<void> => {
    try {
      if (!this.checkAuth(req, res)) return;

      const buffer = await exportProductsToExcel(req.user._id.toString());
      const filename = generateExportFilename('inventory');

      res.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      );
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.send(buffer);
    } catch (error: any) {
      logError({
        userId: req.user?._id || 'unknown',
        functionName: 'exportProducts',
        errorMsg: `Failed to export products: ${error.message}`,
      });
      sendErrorResponse(res, ErrorResponses.INTERNAL_ERROR());
    }
  };

  /**
   * Delete staging product(s) - supports single ID or comma-separated IDs
   * DELETE /api/delete_product_check/:id
   */
  public deleteStagingProduct = async (req: Request, res: Response): Promise<Response> => {
    try {
      if (!this.checkAuth(req, res)) return res;

      const { id } = req.params;

      if (!id) {
        return res.status(400).json({
          status: false,
          message: 'Product ID is required',
        });
      }

      const ids = id.includes(',') ? id.split(',').map(i => i.trim()) : [id];

      const { deleted, notFound } = await this.deleteStagingProductsByIds(
        ids,
        req.user._id.toString(),
        'deleteStagingProduct'
      );

      return res.status(200).json({
        status: true,
        message: `Successfully deleted ${deleted.length} staging product(s)`,
        data: {
          deleted,
          not_found: notFound,
          total_deleted: deleted.length,
          total_not_found: notFound.length,
        },
      });
    } catch (error: any) {
      logError({
        userId: req.user?._id || 'unknown',
        functionName: 'deleteStagingProduct',
        errorMsg: `Staging product deletion failed: ${error.message}`,
      });
      return sendErrorResponse(res, ErrorResponses.INTERNAL_ERROR());
    }
  };

  /**
   * Bulk delete staging products (POST request with array of IDs)
   * POST /api/bulk_delete_product_check
   */
  public bulkDeleteStagingProducts = async (req: Request, res: Response): Promise<Response> => {
    try {
      if (!this.checkAuth(req, res)) return res;

      const { ids } = req.body;

      if (!ids || !Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({
          status: false,
          message: 'Product IDs array is required',
        });
      }

      const { deleted, notFound } = await this.deleteStagingProductsByIds(
        ids,
        req.user._id.toString(),
        'bulkDeleteStagingProducts'
      );

      return res.status(200).json({
        status: true,
        message: `Successfully deleted ${deleted.length} staging product(s)`,
        data: {
          deleted,
          not_found: notFound,
          total_deleted: deleted.length,
          total_not_found: notFound.length,
        },
      });
    } catch (error: any) {
      logError({
        userId: req.user?._id || 'unknown',
        functionName: 'bulkDeleteStagingProducts',
        errorMsg: `Bulk staging product deletion failed: ${error.message}`,
      });
      return sendErrorResponse(res, ErrorResponses.INTERNAL_ERROR());
    }
  };
}
