import { Request, Response } from 'express';
import { IApprovalRequest, IRoleUpdateRequest } from '../interfaces/user';
import { logError } from '../utils/logger';
import { sendErrorResponse, sendSuccessResponse, ErrorResponses, SuccessResponses } from '../utils/responses';
import { AdminUserService } from '../services/AdminUserService';
import { AdminFileService } from '../services/AdminFileService';
import { AdminDashboardService } from '../services/AdminDashboardService';

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
}