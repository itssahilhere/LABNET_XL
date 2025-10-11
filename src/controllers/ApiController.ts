import { Request, Response } from 'express';
import Product from '../models/Product.model';
import Package from '../models/Package.model';
import PackActive from '../models/PackActive.model';
import PaymentLog from '../models/PaymentLog.model';
import { IProductCreateRequest } from '../middleware/productValidation';
import { logError, logSuccess } from '../utils/logger';
import { StripeService, StripeCheckoutSessionData } from '../utils/stripe';

export class ApiController {
    // Store/Create new product
    public async store(req: Request, res: Response): Promise<Response> {
        try {
            // Check if user is authenticated
            if (!req.user) {
                return res.status(401).json({
                    status: false,
                    message: 'Authentication required'
                });
            }

            const user = req.user;
            const productData: IProductCreateRequest = req.body;

            // Check if user has an active package
            if (!user.pack_end_date) {
                return res.status(403).json({
                    status: false,
                    message: 'You can add products only after buying a package.'
                });
            }

            // Check if package hasn't expired
            const today = new Date();
            const packEndDate = new Date(user.pack_end_date);
            if (packEndDate < today) {
                return res.status(403).json({
                    status: false,
                    message: 'Your package has expired. Please buy a package first.'
                });
            }

            // Check if stock_id is unique for this seller
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

            // Generate unique PID (16-digit random number)
            const pid = await (Product as any).generateUniquePid();

            // Generate unique product_id as {user_uid}_{stock_id}
            const product_id = `${user.uid}_${productData.stock_id}`;

            // Check if product_id is unique (shouldn't happen if stock_id is unique per user)
            const existingProductId = await Product.findOne({ product_id });
            if (existingProductId) {
                return res.status(409).json({
                    status: false,
                    message: 'Product ID already exists'
                });
            }

            // Create the product
            const product = new Product({
                pid,
                product_id,
                stock_id: productData.stock_id,
                shape: productData.shape,
                carat: productData.carat,
                color: productData.color,
                clarity: productData.clarity,
                cut: productData.cut,
                polish: productData.polish,
                symmetry: productData.symmetry,
                fluorescence: productData.fluorescence,
                laboratory: productData.laboratory,
                certificate_number: productData.certificate_number,
                depth_percentage: productData.depth_percentage,
                table_percentage: productData.table_percentage,
                price_per_carat: productData.price_per_carat,
                total_price: productData.total_price,
                growth_type: productData.growth_type,
                fancy_color: productData.fancy_color,
                fancy_color_intensity: productData.fancy_color_intensity,
                fancy_color_overtone: productData.fancy_color_overtone,
                seller_name: productData.seller_name,
                seller_company: productData.seller_company,
                seller_location: productData.seller_location,
                seller_phone: productData.seller_phone,
                seller_whatsapp: productData.seller_whatsapp,
                seller_email: productData.seller_email,
                video_url: productData.video_url,
                image_url: productData.image_url,
                certificate_url: productData.certificate_url,
                measurements: productData.measurements,
                seller_id: user._id
            });

            await product.save();

            logSuccess({
                userId: user._id,
                functionName: 'store',
                successMsg: `Product created successfully: ${product_id}`
            });

            // Return success response
            return res.status(201).json({
                status: true,
                message: 'Product added successfully.',
                product: {
                    id: product._id,
                    pid: product.pid,
                    product_id: product.product_id,
                    stock_id: product.stock_id,
                    shape: product.shape,
                    carat: product.carat,
                    color: product.color,
                    clarity: product.clarity,
                    cut: product.cut,
                    polish: product.polish,
                    symmetry: product.symmetry,
                    fluorescence: product.fluorescence,
                    laboratory: product.laboratory,
                    certificate_number: product.certificate_number,
                    depth_percentage: product.depth_percentage,
                    table_percentage: product.table_percentage,
                    price_per_carat: product.price_per_carat,
                    total_price: product.total_price,
                    growth_type: product.growth_type,
                    fancy_color: product.fancy_color,
                    fancy_color_intensity: product.fancy_color_intensity,
                    fancy_color_overtone: product.fancy_color_overtone,
                    seller_name: product.seller_name,
                    seller_company: product.seller_company,
                    seller_location: product.seller_location,
                    seller_phone: product.seller_phone,
                    seller_whatsapp: product.seller_whatsapp,
                    seller_email: product.seller_email,
                    video_url: product.video_url,
                    image_url: product.image_url,
                    certificate_url: product.certificate_url,
                    measurements: product.measurements,
                    seller_id: product.seller_id,
                    created_at: product.createdAt,
                    updated_at: product.updatedAt
                }
            });

        } catch (error: any) {
            logError({
                userId: req.user?._id || 'unknown',
                functionName: 'store',
                errorMsg: `Product creation failed: ${error.message}`
            });

            return res.status(500).json({
                status: false,
                message: 'Internal server error'
            });
        }
    }

    // Get all products for authenticated user
    public async index(req: Request, res: Response): Promise<Response> {
        try {
            if (!req.user) {
                return res.status(401).json({
                    status: false,
                    message: 'Authentication required'
                });
            }

            const page = parseInt(req.query.page as string) || 1;
            const limit = parseInt(req.query.limit as string) || 20;
            const skip = (page - 1) * limit;

            // Get user's products
            const products = await Product.find({ seller_id: req.user._id })
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit);

            const totalProducts = await Product.countDocuments({ seller_id: req.user._id });

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
                    }
                }
            });

        } catch (error: any) {
            logError({
                userId: req.user?._id || 'unknown',
                functionName: 'index',
                errorMsg: `Products retrieval failed: ${error.message}`
            });

            return res.status(500).json({
                status: false,
                message: 'Internal server error'
            });
        }
    }

    // Get single product by ID or PID
    public async show(req: Request, res: Response): Promise<Response> {
        try {
            if (!req.user) {
                return res.status(401).json({
                    status: false,
                    message: 'Authentication required'
                });
            }

            const { id } = req.params;
            
            // Try to find by MongoDB ObjectId first, then by PID
            let product = await Product.findOne({
                $and: [
                    { seller_id: req.user._id },
                    { $or: [{ _id: id }, { pid: id }] }
                ]
            });

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
            logError({
                userId: req.user?._id || 'unknown',
                functionName: 'show',
                errorMsg: `Product retrieval failed: ${error.message}`
            });

            return res.status(500).json({
                status: false,
                message: 'Internal server error'
            });
        }
    }

    // Update product
    public async update(req: Request, res: Response): Promise<Response> {
        try {
            if (!req.user) {
                return res.status(401).json({
                    status: false,
                    message: 'Authentication required'
                });
            }

            const { id } = req.params;
            const updateData = req.body;

            // Find the product
            const product = await Product.findOne({
                $and: [
                    { seller_id: req.user._id },
                    { $or: [{ _id: id }, { pid: id }] }
                ]
            });

            if (!product) {
                return res.status(404).json({
                    status: false,
                    message: 'Product not found'
                });
            }

            // Update the product
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
            logError({
                userId: req.user?._id || 'unknown',
                functionName: 'update',
                errorMsg: `Product update failed: ${error.message}`
            });

            return res.status(500).json({
                status: false,
                message: 'Internal server error'
            });
        }
    }

    // Delete product
    public async destroy(req: Request, res: Response): Promise<Response> {
        try {
            if (!req.user) {
                return res.status(401).json({
                    status: false,
                    message: 'Authentication required'
                });
            }

            const { id } = req.params;

            // Find the product
            const product = await Product.findOne({
                $and: [
                    { seller_id: req.user._id },
                    { $or: [{ _id: id }, { pid: id }] }
                ]
            });

            if (!product) {
                return res.status(404).json({
                    status: false,
                    message: 'Product not found'
                });
            }

            // Delete the product
            await Product.findByIdAndDelete(product._id);

            logSuccess({
                userId: req.user._id,
                functionName: 'destroy',
                successMsg: `Product deleted successfully: ${product.product_id}`
            });

            return res.status(200).json({
                status: true,
                message: 'Product deleted successfully'
            });

        } catch (error: any) {
            logError({
                userId: req.user?._id || 'unknown',
                functionName: 'destroy',
                errorMsg: `Product deletion failed: ${error.message}`
            });

            return res.status(500).json({
                status: false,
                message: 'Internal server error'
            });
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
            logError({
                userId: req.user?._id || 'unknown',
                functionName: 'packages',
                errorMsg: `Package retrieval failed: ${error.message}`
            });

            return res.status(500).json({
                status: false,
                message: 'Internal server error'
            });
        }
    }

    // Buy a package (create Stripe checkout session)
    public async buy_package(req: Request, res: Response): Promise<Response> {
        try {
            // Check if user is authenticated
            if (!req.user) {
                return res.status(401).json({
                    status: false,
                    message: 'Authentication required'
                });
            }

            const package_id = req.query.package_id as string;

            if (!package_id) {
                return res.status(400).json({
                    status: false,
                    message: 'Package ID is required'
                });
            }

            // Find the package
            const packageData = await Package.findById(package_id);
            if (!packageData || !packageData.is_active) {
                return res.status(404).json({
                    status: false,
                    message: 'Package not found or inactive'
                });
            }

            // Check if user already has an active package
            const user = req.user;
            if (user.pack_end_date) {
                const today = new Date();
                const packEndDate = new Date(user.pack_end_date);
                if (packEndDate > today) {
                    return res.status(400).json({
                        status: false,
                        message: 'You already have an active package. Please wait for it to expire before purchasing a new one.'
                    });
                }
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

            // Generate unique payment ID
            const paymentId = (PaymentLog as any).generatePaymentId();

            // Log payment attempt
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
            logError({
                userId: req.user?._id || 'unknown',
                functionName: 'buy_package',
                errorMsg: `Package purchase failed: ${error.message}`
            });

            return res.status(500).json({
                status: false,
                message: 'Internal server error'
            });
        }
    }

    // Get user's package history
    public async package_history(req: Request, res: Response): Promise<Response> {
        try {
            // Check if user is authenticated
            if (!req.user) {
                return res.status(401).json({
                    status: false,
                    message: 'Authentication required'
                });
            }

            const user = req.user;

            // Get user's active packages
            const activePackages = await PackActive.find({ user_id: user._id })
                .populate('pack_id', 'name description price amount pack_type features')
                .sort({ activated_at: -1 });

            // Get payment history
            const paymentHistory = await PaymentLog.find({ user_id: user._id })
                .populate('pack_id', 'name description')
                .sort({ createdAt: -1 });

            // Get current active package info
            let currentPackage = null;
            if (user.pack_end_date) {
                const today = new Date();
                const packEndDate = new Date(user.pack_end_date);
                if (packEndDate > today) {
                    currentPackage = {
                        end_date: user.pack_end_date,
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
            logError({
                userId: req.user?._id || 'unknown',
                functionName: 'package_history',
                errorMsg: `Package history retrieval failed: ${error.message}`
            });

            return res.status(500).json({
                status: false,
                message: 'Internal server error'
            });
        }
    }
}