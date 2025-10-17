import { Request, Response } from 'express';
import Product from '../models/Product.model';
import Package from '../models/Package.model';
import PackActive from '../models/PackActive.model';
import PaymentLog from '../models/PaymentLog.model';
import { IProductCreateRequest } from '../middleware/productValidation';
import { logError, logSuccess } from '../utils/logger';
import { StripeService, StripeCheckoutSessionData } from '../utils/stripe';
import { QueryBuilder } from '../utils/queryBuilder';

export class ApiController {
    
    private checkAuth(req: Request, res: Response): boolean {
        if (!req.user) {
            res.status(401).json({
                status: false,
                message: 'Authentication required'
            });
            return false;
        }
        return true;
    }

    private async findUserProduct(userId: string, productId: string) {
        return await Product.findOne({
            $and: [
                { seller_id: userId },
                { $or: [{ _id: productId }, { pid: productId }] }
            ]
        });
    }

    /**
     * Handle common errors and return appropriate response
     */
    private handleError(res: Response, error: any, functionName: string, userId: string = 'unknown'): Response {
        logError({
            userId,
            functionName,
            errorMsg: `${functionName} failed: ${error.message}`
        });

        if (error.code === 11000 || error.name === 'MongoServerError') {
            const field = Object.keys(error.keyPattern || {})[0] || 'field';
            return res.status(409).json({
                status: false,
                message: `Duplicate ${field}: This value already exists`
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
                errors
            });
        }

        // Handle cast errors (invalid ObjectId, etc.)
        if (error.name === 'CastError') {
            return res.status(400).json({
                status: false,
                message: `Invalid ${error.path}: ${error.value}`
            });
        }

        // Generic error
        return res.status(500).json({
            status: false,
            message: 'Internal server error',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }

    /**
     * Check if user has active package
     */
    private hasActivePackage(user: any): { valid: boolean; message?: string } {
        if (!user.package?.end_date) {
            return { valid: false, message: 'You can add products only after buying a package.' };
        }

        const today = new Date();
        const packEndDate = new Date(user.package?.end_date);
        if (packEndDate < today) {
            return { valid: false, message: 'Your package has expired. Please buy a package first.' };
        }

        return { valid: true };
    }


    public async store(req: Request, res: Response): Promise<Response> {
        try {
            if (!this.checkAuth(req, res)) return res;

            const user = req.user;
            const productData: IProductCreateRequest = req.body;

            const packageCheck = this.hasActivePackage(user);
            if (!packageCheck.valid) {
                return res.status(403).json({
                    status: false,
                    message: packageCheck.message
                });
            }

            const existingProduct = await Product.findOne({
                seller_id: user._id,
                stock_id: productData.stock_id
            });

            if (existingProduct) {
                return res.status(409).json({
                    status: false,
                    message: 'Stock ID already exists'
                });
            }

            // Generate unique identifiers
            const pid = await (Product as any).generateUniquePid();
            const product_id = `${user.uid}_${productData.stock_id}`;

            // Check for duplicate product_id
            const existingProductId = await Product.findOne({ product_id });
            if (existingProductId) {
                return res.status(409).json({
                    status: false,
                    message: 'Product ID already exists'
                });
            }

            // Create product
            const product = new Product({
                pid,
                product_id,
                ...productData,
                seller_id: user._id
            });

            await product.save();

            logSuccess({
                userId: user._id,
                functionName: 'store',
                successMsg: `Product created successfully: ${product_id}`
            });

            return res.status(201).json({
                status: true,
                message: 'Product added successfully.',
                product
            });

        } catch (error: any) {
            return this.handleError(res, error, 'store', req.user?._id || 'unknown');
        }
    }

    // Get all products for authenticated user (POST only)
    public async index(req: Request, res: Response): Promise<Response> {
        try {
            if (!this.checkAuth(req, res)) return res;

            const page = parseInt(req.query.page as string) || parseInt(req.body?.page) || 1;
            const limit = parseInt(req.query.limit as string) || parseInt(req.body?.limit) || 20;
            const skip = (page - 1) * limit;

            const { filters: userFilters = [], search, sortBy = 'createdAt', sortOrder = 'desc' } = req.body || {};

            // Build filters - always include seller_id
            const filters = [
                { field: 'seller_id', operation: 'equals', value: req.user._id },
                ...userFilters // Add user's custom filters
            ];

            const query = QueryBuilder.buildAdvancedFilters(filters);

            // Add global search if provided
            if (search && search.trim()) {
                const searchFields = [
                    'stock_id', 'product_id', 'pid', 'shape', 'color', 'clarity',
                    'cut', 'polish', 'symmetry', 'fluorescence', 'laboratory',
                    'certificate_number', 'growth_type', 'fancy_color',
                    'fancy_color_intensity', 'fancy_color_overtone', 'measurements'
                ];
                const searchQuery = QueryBuilder.buildGlobalSearch(search, searchFields);
                if (searchQuery) {
                    Object.assign(query, searchQuery);
                }
            }

            const sortObject = QueryBuilder.buildSort(sortBy, sortOrder);

            const products = await Product.find(query)
                .sort(sortObject)
                .skip(skip)
                .limit(limit);

            const totalProducts = await Product.countDocuments(query);

            return res.status(200).json({
                status: true,
                message: 'Products retrieved successfully',
                data: {
                    products,
                    pagination: {
                        current_page: page,
                        per_page: limit,
                        total: totalProducts,
                        total_pages: Math.ceil(totalProducts / limit)
                    },
                    appliedFilters: userFilters,
                    search: search || undefined
                }
            });

        } catch (error: any) {
            return this.handleError(res, error, 'index', req.user?._id || 'unknown');
        }
    }

    // Get single product by ID or PID
    public async show(req: Request, res: Response): Promise<Response> {
        try {
            if (!this.checkAuth(req, res)) return res;

            const { id } = req.params;
            const product = await this.findUserProduct(req.user._id, id);

            if (!product) {
                return res.status(404).json({
                    status: false,
                    message: 'Product not found'
                });
            }

            return res.status(200).json({
                status: true,
                message: 'Product retrieved successfully',
                product
            });

        } catch (error: any) {
            return this.handleError(res, error, 'show', req.user?._id || 'unknown');
        }
    }

    // Update product
    public async update(req: Request, res: Response): Promise<Response> {
        try {
            if (!this.checkAuth(req, res)) return res;

            const { id } = req.params;
            let updateData = req.body;

            if (updateData.field && updateData.value !== undefined) {
                updateData = { [updateData.field]: updateData.value };
            }

            const product = await this.findUserProduct(req.user._id, id);

            if (!product) {
                return res.status(404).json({
                    status: false,
                    message: 'Product not found'
                });
            }

            if (updateData.stock_id && updateData.stock_id !== product.stock_id) {
                const duplicateStock = await Product.findOne({
                    seller_id: req.user._id,
                    stock_id: updateData.stock_id,
                    _id: { $ne: product._id }
                });

                if (duplicateStock) {
                    return res.status(409).json({
                        status: false,
                        message: 'Stock ID already exists for another product'
                    });
                }

                updateData.product_id = `${req.user.uid}_${updateData.stock_id}`;
            }

            Object.assign(product, updateData);
            await product.save();

            logSuccess({
                userId: req.user._id,
                functionName: 'update',
                successMsg: `Product updated successfully: ${product.product_id}`
            });

            return res.status(200).json({
                status: true,
                message: 'Product updated successfully',
                product
            });

        } catch (error: any) {
            return this.handleError(res, error, 'update', req.user?._id || 'unknown');
        }
    }

    // Delete product(s)
    public async destroy(req: Request, res: Response): Promise<Response> {
        try {
            if (!this.checkAuth(req, res)) return res;

            const { id } = req.params;
            const ids = id.includes(',') ? id.split(',').map(i => i.trim()) : [id];

            const deletedProducts = [];
            const notFoundProducts = [];

            for (const productId of ids) {
                const product = await this.findUserProduct(req.user._id, productId);

                if (!product) {
                    notFoundProducts.push(productId);
                    continue;
                }

                await Product.findByIdAndDelete(product._id);
                deletedProducts.push({
                    id: product._id,
                    pid: product.pid,
                    product_id: product.product_id,
                    stock_id: product.stock_id
                });
            }

            logSuccess({
                userId: req.user._id,
                functionName: 'destroy',
                successMsg: `Deleted ${deletedProducts.length} products successfully`
            });

            return res.status(200).json({
                status: true,
                message: `Successfully deleted ${deletedProducts.length} product(s)`,
                data: {
                    deleted: deletedProducts,
                    not_found: notFoundProducts,
                    total_deleted: deletedProducts.length,
                    total_not_found: notFoundProducts.length
                }
            });

        } catch (error: any) {
            return this.handleError(res, error, 'destroy', req.user?._id || 'unknown');
        }
    }

    // Get all active packages
    public async packages(req: Request, res: Response): Promise<Response> {
        try {
            const packages = await Package.find({ is_active: true })
                .select('name description amount pack_type duration_days max_products features')
                .sort({ amount: 1 });

            return res.status(200).json({
                status: true,
                message: 'Packages retrieved successfully',
                data: packages
            });

        } catch (error: any) {
            return this.handleError(res, error, 'packages', req.user?._id || 'unknown');
        }
    }

    // Buy a package (create Stripe checkout session)
    public async buy_package(req: Request, res: Response): Promise<Response> {
        try {
            if (!this.checkAuth(req, res)) return res;

            const package_id = req.query.package_id as string;

            if (!package_id) {
                return res.status(400).json({
                    status: false,
                    message: 'Package ID is required'
                });
            }

            const packageData = await Package.findById(package_id);
            if (!packageData || !packageData.is_active) {
                return res.status(404).json({
                    status: false,
                    message: 'Package not found or inactive'
                });
            }

            const user = req.user;
            const packageCheck = this.hasActivePackage(user);
            if (packageCheck.valid) {
                return res.status(400).json({
                    status: false,
                    message: 'You already have an active package. Please wait for it to expire before purchasing a new one.'
                });
            }

            // Create Stripe checkout session
            const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
            const checkoutData: StripeCheckoutSessionData = {
                packageId: (packageData._id as any).toString(),
                packageName: packageData.name,
                packagePrice: packageData.amount,
                customerEmail: user.email,
                userId: user._id.toString(),
                successUrl: `${baseUrl}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
                cancelUrl: `${baseUrl}/payment/cancel`
            };

            const session = await StripeService.createCheckoutSession(checkoutData);

            // Log payment attempt
            const paymentId = (PaymentLog as any).generatePaymentId();
            const paymentLog = new PaymentLog({
                user_id: user._id,
                pack_id: packageData._id,
                payment_id: paymentId,
                stripe_session_id: session.id,
                amount: packageData.amount,
                currency: 'usd',
                pack_type: packageData.pack_type,
                payment_type: 'Stripe',
                payment_status: 'pending',
                checkout_url: session.url,
                success_url: checkoutData.successUrl,
                cancel_url: checkoutData.cancelUrl
            });
            await paymentLog.save();

            logSuccess({
                userId: user._id.toString(),
                functionName: 'buy_package',
                successMsg: `Stripe checkout session created: ${session.id}`
            });

            return res.status(200).json({
                status: true,
                message: 'Checkout session created successfully',
                data: {
                    checkout_url: session.url,
                    session_id: session.id,
                    package: {
                        name: packageData.name,
                        price: packageData.amount,
                        duration_days: packageData.duration_days
                    }
                }
            });

        } catch (error: any) {
            return this.handleError(res, error, 'buy_package', req.user?._id || 'unknown');
        }
    }

    // Get user's package history
    public async package_history(req: Request, res: Response): Promise<Response> {
        try {
            if (!this.checkAuth(req, res)) return res;

            const user = req.user;

            const activePackages = await PackActive.find({ user_id: user._id })
                .populate('pack_id', 'name description price amount pack_type features')
                .sort({ activated_at: -1 });

            const paymentHistory = await PaymentLog.find({ user_id: user._id })
                .populate('pack_id', 'name description')
                .sort({ createdAt: -1 });

            let currentPackage = null;
            if (user.package?.end_date) {
                const today = new Date();
                const packEndDate = new Date(user.package?.end_date);
                if (packEndDate > today) {
                    currentPackage = {
                        end_date: user.package?.end_date,
                        days_remaining: Math.ceil((packEndDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
                    };
                }
            }

            return res.status(200).json({
                status: true,
                message: 'Package history retrieved successfully',
                data: {
                    current_package: currentPackage,
                    active_packages: activePackages,
                    payment_history: paymentHistory
                }
            });

        } catch (error: any) {
            return this.handleError(res, error, 'package_history', req.user?._id || 'unknown');
        }
    }

    // Get all products from users with active packages (PUBLIC ROUTE)
    public async getPublicProducts(req: Request, res: Response): Promise<Response> {
        try {
            const page = parseInt(req.query.page as string) || 1;
            const limit = parseInt(req.query.limit as string) || 20;
            const skip = (page - 1) * limit;

            const { filters: advancedFilters = [], search, sortBy = 'createdAt', sortOrder = 'desc' } = req.body || {};

            // Get users with valid active packages
            const today = new Date();
            const usersWithActivePackages = await (await import('../models/User.model.js')).default.find({
                'package.end_date': { $gte: today },
                approval_status: 'approved',
                is_active: true
            }).select('_id');

            const userIds = usersWithActivePackages.map(user => user._id);

            if (userIds.length === 0) {
                return res.status(200).json({
                    status: true,
                    message: 'No products found from users with active packages',
                    data: {
                        products: [],
                        pagination: { current_page: page, per_page: limit, total: 0, total_pages: 0 },
                        filters: this.getEmptyFilterOptions(),
                        total_active_sellers: 0
                    }
                });
            }

            // Build query using QueryBuilder
            const baseFilter = { seller_id: { $in: userIds } };
            const advancedFilterQuery = QueryBuilder.buildAdvancedFilters(advancedFilters);
            
            const searchFields = [
                'stock_id', 'product_id', 'pid', 'shape', 'color', 'clarity',
                'cut', 'polish', 'symmetry', 'fluorescence', 'laboratory',
                'growth_type', 'certificate_number', 'fancy_color',
                'fancy_color_intensity', 'fancy_color_overtone', 'seller_name',
                'seller_company', 'seller_location', 'seller_email', 'measurements'
            ];
            const searchQuery = QueryBuilder.buildGlobalSearch(search, searchFields);
            
            const filter = QueryBuilder.mergeFilters(baseFilter, advancedFilterQuery, searchQuery || {});
            const sortObject = QueryBuilder.buildSort(sortBy, sortOrder);

            // Get products
            const products = await Product.find(filter)
                .populate('seller_id', 'name company_name uid email phone_no whatsapp_no location')
                .sort(sortObject)
                .skip(skip)
                .limit(limit)
                .lean();

            const totalProducts = await Product.countDocuments(filter);

            // Get filter options
            const allProducts = await Product.find({ seller_id: { $in: userIds } }).lean();
            const filterOptions = this.buildFilterOptions(allProducts);

            logSuccess({
                userId: 'public',
                functionName: 'getPublicProducts',
                successMsg: `Retrieved ${products.length} products from ${userIds.length} users`
            });

            return res.status(200).json({
                status: true,
                message: 'Products retrieved successfully',
                data: {
                    products,
                    pagination: {
                        current_page: page,
                        per_page: limit,
                        total: totalProducts,
                        total_pages: Math.ceil(totalProducts / limit)
                    },
                    filters: filterOptions,
                    total_active_sellers: userIds.length
                }
            });

        } catch (error: any) {
            return this.handleError(res, error, 'getPublicProducts', 'public');
        }
    }

    private buildFilterOptions(products: any[]) {
        return {
            available_shapes: QueryBuilder.getUniqueValues(products, 'shape'),
            available_colors: QueryBuilder.getUniqueValues(products, 'color'),
            available_clarities: QueryBuilder.getUniqueValues(products, 'clarity'),
            available_cuts: QueryBuilder.getUniqueValues(products, 'cut'),
            available_polish: QueryBuilder.getUniqueValues(products, 'polish'),
            available_symmetry: QueryBuilder.getUniqueValues(products, 'symmetry'),
            available_fluorescence: QueryBuilder.getUniqueValues(products, 'fluorescence'),
            available_laboratories: QueryBuilder.getUniqueValues(products, 'laboratory'),
            available_growth_types: QueryBuilder.getUniqueValues(products, 'growth_type'),
            price_range: QueryBuilder.getRange(products, 'total_price'),
            carat_range: QueryBuilder.getRange(products, 'carat'),
            depth_range: QueryBuilder.getRange(products, 'depth_percentage'),
            table_range: QueryBuilder.getRange(products, 'table_percentage')
        };
    }

    private getEmptyFilterOptions() {
        return {
            available_shapes: [],
            available_colors: [],
            available_clarities: [],
            available_cuts: [],
            available_polish: [],
            available_symmetry: [],
            available_fluorescence: [],
            available_laboratories: [],
            available_growth_types: [],
            price_range: { min: 0, max: 0 },
            carat_range: { min: 0, max: 0 },
            depth_range: { min: 0, max: 0 },
            table_range: { min: 0, max: 0 }
        };
    }
}