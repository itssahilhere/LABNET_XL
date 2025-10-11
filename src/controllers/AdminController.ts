import { Request, Response } from 'express';
import { IApprovalRequest, IRoleUpdateRequest } from '../interfaces/user';
import { logError } from '../utils/logger';
import { sendErrorResponse, sendSuccessResponse, ErrorResponses, SuccessResponses } from '../utils/responses';
import { AdminUserService } from '../services/AdminUserService';
import { AdminFileService } from '../services/AdminFileService';
import { AdminDashboardService } from '../services/AdminDashboardService';
import Package from '../models/Package.model';

export class AdminController {
    private adminUserService: AdminUserService;
    private adminFileService: AdminFileService;
    private adminDashboardService: AdminDashboardService;

    constructor() {
        this.adminUserService = new AdminUserService();
        this.adminFileService = new AdminFileService();
        this.adminDashboardService = new AdminDashboardService();
    }

    // Middleware check for admin access
    private checkAdminAccess(req: Request, res: Response): boolean {
        if (req.user?.role !== 'admin') {
            sendErrorResponse(res, ErrorResponses.FORBIDDEN('Admin access required'));
            return false;
        }
        return true;
    }

    // Get dashboard statistics
    public async getDashboardStats(req: Request, res: Response): Promise<Response> {
        try {
            if (!this.checkAdminAccess(req, res)) return res;

            const stats = await this.adminDashboardService.getDashboardStats();
            return sendSuccessResponse(res, SuccessResponses.OK('Dashboard statistics retrieved successfully', stats));

        } catch (error: any) {
            logError({
                userId: req.user?._id || 'unknown',
                functionName: 'getDashboardStats',
                errorMsg: `Dashboard stats retrieval failed: ${error.message}`
            });
            return sendErrorResponse(res, ErrorResponses.INTERNAL_ERROR());
        }
    }

    // Get all pending users for approval
    public async getPendingUsers(req: Request, res: Response): Promise<Response> {
        try {
            if (!this.checkAdminAccess(req, res)) return res;

            const page = parseInt(req.query.page as string) || 1;
            const limit = parseInt(req.query.limit as string) || 10;

            const result = await this.adminUserService.getPendingUsers(page, limit);
            return sendSuccessResponse(res, SuccessResponses.OK('Pending users retrieved successfully', result));

        } catch (error: any) {
            logError({
                userId: req.user?._id || 'unknown',
                functionName: 'getPendingUsers',
                errorMsg: `Failed to get pending users: ${error.message}`
            });
            return sendErrorResponse(res, ErrorResponses.INTERNAL_ERROR());
        }
    }

    // Get all users with filtering
    public async getAllUsers(req: Request, res: Response): Promise<Response> {
        try {
            if (!this.checkAdminAccess(req, res)) return res;

            const page = parseInt(req.query.page as string) || 1;
            const limit = parseInt(req.query.limit as string) || 20;
            const status = req.query.status as string;
            const role = req.query.role as string;

            const result = await this.adminUserService.getAllUsers(page, limit, status, role);
            return sendSuccessResponse(res, SuccessResponses.OK('Users retrieved successfully', result));

        } catch (error: any) {
            logError({
                userId: req.user?._id || 'unknown',
                functionName: 'getAllUsers',
                errorMsg: `Failed to get users: ${error.message}`
            });
            return sendErrorResponse(res, ErrorResponses.INTERNAL_ERROR());
        }
    }

    // Approve or reject user
    public async approveUser(req: Request, res: Response): Promise<Response> {
        try {
            if (!this.checkAdminAccess(req, res)) return res;

            const approvalData: IApprovalRequest = req.body;
            const adminId = req.user._id;

            const result = await this.adminUserService.approveUser(approvalData, adminId);
            
            const message = result.status === 'approved' 
                ? 'User approved successfully' 
                : 'User rejected successfully';

            return sendSuccessResponse(res, SuccessResponses.OK(message, result));

        } catch (error: any) {
            logError({
                userId: req.user?._id || 'unknown',
                functionName: 'approveUser',
                errorMsg: `User approval failed: ${error.message}`
            });
            return sendErrorResponse(res, ErrorResponses.BAD_REQUEST(error.message));
        }
    }

    // Update user role
    public async updateUserRole(req: Request, res: Response): Promise<Response> {
        try {
            if (!this.checkAdminAccess(req, res)) return res;

            const { userId } = req.params;
            const { role, reason }: IRoleUpdateRequest = req.body;
            const adminId = req.user._id;

            const result = await this.adminUserService.updateUserRole(userId, role, adminId, reason);

            return sendSuccessResponse(res, SuccessResponses.OK('User role updated successfully', {
                userId: result.user._id,
                email: result.user.email,
                name: result.user.name,
                oldRole: result.oldRole,
                newRole: result.newRole,
                updatedBy: req.user.name,
                updatedAt: new Date(),
                reason: result.reason || null
            }));

        } catch (error: any) {
            logError({
                userId: req.user?._id || 'unknown',
                functionName: 'updateUserRole',
                errorMsg: `Failed to update user role: ${error.message}`
            });
            return sendErrorResponse(res, ErrorResponses.BAD_REQUEST(error.message));
        }
    }

    // Get secure URL for specific user's ID proof document
    public async getUserSecureFileUrl(req: Request, res: Response): Promise<Response> {
        try {
            if (!this.checkAdminAccess(req, res)) return res;

            const { userId } = req.params;
            const adminId = req.user._id;

            const result = await this.adminFileService.getUserSecureFileUrl(userId, adminId);
            return sendSuccessResponse(res, SuccessResponses.OK('Secure URL generated successfully', result));

        } catch (error: any) {
            logError({
                userId: req.user?._id || 'unknown',
                functionName: 'getUserSecureFileUrl',
                errorMsg: `Failed to generate secure URL: ${error.message}`
            });
            return sendErrorResponse(res, ErrorResponses.BAD_REQUEST(error.message));
        }
    }

    // Get secure URLs for all users with ID proof documents
    public async getAllUsersSecureFileUrls(req: Request, res: Response): Promise<Response> {
        try {
            if (!this.checkAdminAccess(req, res)) return res;

            const page = parseInt(req.query.page as string) || 1;
            const limit = parseInt(req.query.limit as string) || 20;
            const adminId = req.user._id;

            const result = await this.adminFileService.getAllUsersSecureFileUrls(page, limit, adminId);
            return sendSuccessResponse(res, SuccessResponses.OK('Secure URLs generated successfully', result));

        } catch (error: any) {
            logError({
                userId: req.user?._id || 'unknown',
                functionName: 'getAllUsersSecureFileUrls',
                errorMsg: `Failed to generate secure URLs: ${error.message}`
            });
            return sendErrorResponse(res, ErrorResponses.INTERNAL_ERROR());
        }
    }

    // Get users with file filter options
    public async getUsersWithFiles(req: Request, res: Response): Promise<Response> {
        try {
            if (!this.checkAdminAccess(req, res)) return res;

            const page = parseInt(req.query.page as string) || 1;
            const limit = parseInt(req.query.limit as string) || 20;
            const hasFiles = req.query.hasFiles === 'true' ? true : req.query.hasFiles === 'false' ? false : undefined;
            const approvalStatus = req.query.approvalStatus as string;

            const result = await this.adminUserService.getUsersWithFiles(page, limit, hasFiles, approvalStatus);
            return sendSuccessResponse(res, SuccessResponses.OK('Users retrieved successfully', result));

        } catch (error: any) {
            logError({
                userId: req.user?._id || 'unknown',
                functionName: 'getUsersWithFiles',
                errorMsg: `Failed to get users with files: ${error.message}`
            });
            return sendErrorResponse(res, ErrorResponses.INTERNAL_ERROR());
        }
    }

    // ==================== Package Management ====================

    /**
     * Create a new package
     * POST /api/admin/packages
     * Body: { name, amount, pack_type, duration_days, max_products, features }
     */
    async createPackage(req: Request, res: Response) {
        try {
            const { name, amount, pack_type, duration_days, max_products, features } = req.body;

            // Validation
            if (!name || !amount || !pack_type || !duration_days) {
                return sendErrorResponse(res, ErrorResponses.BAD_REQUEST('Name, amount, pack_type, and duration_days are required'));
            }

            if (amount < 0) {
                return sendErrorResponse(res, ErrorResponses.BAD_REQUEST('Amount must be a positive number'));
            }

            if (duration_days < 1) {
                return sendErrorResponse(res, ErrorResponses.BAD_REQUEST('Duration days must be at least 1'));
            }

            const validPackTypes = ['daily', 'weekly', 'monthly', 'yearly', 'one-time'];
            if (!validPackTypes.includes(pack_type.toLowerCase())) {
                return sendErrorResponse(res, ErrorResponses.BAD_REQUEST(`Pack type must be one of: ${validPackTypes.join(', ')}`));
            }

            // Check if package with same name already exists
            const existingPackage = await Package.findOne({ name: name.trim() });
            if (existingPackage) {
                return sendErrorResponse(res, ErrorResponses.BAD_REQUEST('Package with this name already exists'));
            }

            // Create new package
            const newPackage = await Package.create({
                name: name.trim(),
                amount: Number(amount),
                pack_type: pack_type.toLowerCase(),
                duration_days: Number(duration_days),
                max_products: max_products ? Number(max_products) : undefined,
                features: features || [],
                createdAt: new Date(),
                updatedAt: new Date()
            });

            logError({
                userId: req.user?._id || 'admin',
                functionName: 'createPackage',
                errorMsg: `Package created: ${newPackage._id}`
            });

            return sendSuccessResponse(res, SuccessResponses.CREATED('Package created successfully', newPackage));

        } catch (error: any) {
            logError({
                userId: req.user?._id || 'unknown',
                functionName: 'createPackage',
                errorMsg: `Failed to create package: ${error.message}`
            });
            return sendErrorResponse(res, ErrorResponses.INTERNAL_ERROR());
        }
    }

    /**
     * Update an existing package
     * PUT /api/admin/packages/:id
     * Body: { name?, amount?, pack_type?, duration_days?, max_products?, features? }
     */
    async updatePackage(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const { name, amount, pack_type, duration_days, max_products, features } = req.body;

            // Find package
            const packageToUpdate = await Package.findById(id);
            if (!packageToUpdate) {
                return sendErrorResponse(res, ErrorResponses.NOT_FOUND('Package not found'));
            }

            // Validation
            if (amount !== undefined && amount < 0) {
                return sendErrorResponse(res, ErrorResponses.BAD_REQUEST('Amount must be a positive number'));
            }

            if (duration_days !== undefined && duration_days < 1) {
                return sendErrorResponse(res, ErrorResponses.BAD_REQUEST('Duration days must be at least 1'));
            }

            const validPackTypes = ['daily', 'weekly', 'monthly', 'yearly', 'one-time'];
            if (pack_type !== undefined && !validPackTypes.includes(pack_type.toLowerCase())) {
                return sendErrorResponse(res, ErrorResponses.BAD_REQUEST(`Pack type must be one of: ${validPackTypes.join(', ')}`));
            }

            // Check if new name conflicts with existing package
            if (name && name.trim() !== packageToUpdate.name) {
                const existingPackage = await Package.findOne({ name: name.trim(), _id: { $ne: id } });
                if (existingPackage) {
                    return sendErrorResponse(res, ErrorResponses.BAD_REQUEST('Package with this name already exists'));
                }
            }

            // Update fields
            if (name !== undefined) packageToUpdate.name = name.trim();
            if (amount !== undefined) packageToUpdate.amount = Number(amount);
            if (pack_type !== undefined) packageToUpdate.pack_type = pack_type.toLowerCase();
            if (duration_days !== undefined) packageToUpdate.duration_days = Number(duration_days);
            if (max_products !== undefined) packageToUpdate.max_products = max_products ? Number(max_products) : null;
            if (features !== undefined) packageToUpdate.features = features;
            packageToUpdate.updatedAt = new Date();

            await packageToUpdate.save();

            logError({
                userId: req.user?._id || 'admin',
                functionName: 'updatePackage',
                errorMsg: `Package updated: ${packageToUpdate._id}`
            });

            return sendSuccessResponse(res, SuccessResponses.OK('Package updated successfully', packageToUpdate));

        } catch (error: any) {
            logError({
                userId: req.user?._id || 'unknown',
                functionName: 'updatePackage',
                errorMsg: `Failed to update package: ${error.message}`
            });
            return sendErrorResponse(res, ErrorResponses.INTERNAL_ERROR());
        }
    }

    /**
     * Delete a package
     * DELETE /api/admin/packages/:id
     */
    async deletePackage(req: Request, res: Response) {
        try {
            const { id } = req.params;

            // Find and delete package
            const deletedPackage = await Package.findByIdAndDelete(id);
            if (!deletedPackage) {
                return sendErrorResponse(res, ErrorResponses.NOT_FOUND('Package not found'));
            }

            logError({
                userId: req.user?._id || 'admin',
                functionName: 'deletePackage',
                errorMsg: `Package deleted: ${deletedPackage._id}`
            });

            return sendSuccessResponse(res, SuccessResponses.OK('Package deleted successfully', { 
                id: deletedPackage._id,
                name: deletedPackage.name 
            }));

        } catch (error: any) {
            logError({
                userId: req.user?._id || 'unknown',
                functionName: 'deletePackage',
                errorMsg: `Failed to delete package: ${error.message}`
            });
            return sendErrorResponse(res, ErrorResponses.INTERNAL_ERROR());
        }
    }

    /**
     * Get all packages (for admin management)
     * GET /api/admin/packages
     */
    async getAllPackages(req: Request, res: Response) {
        try {
            const packages = await Package.find().sort({ createdAt: -1 });
            
            return sendSuccessResponse(res, SuccessResponses.OK('Packages retrieved successfully', {
                total: packages.length,
                packages
            }));

        } catch (error: any) {
            logError({
                userId: req.user?._id || 'unknown',
                functionName: 'getAllPackages',
                errorMsg: `Failed to get packages: ${error.message}`
            });
            return sendErrorResponse(res, ErrorResponses.INTERNAL_ERROR());
        }
    }
}