import express, { Request, Response } from 'express';
import { AdminController } from '../controllers/AdminController.js';
import { authenticateToken, requireAdmin, validateApprovalRequest, validateRoleUpdate } from '../middleware/validation.js';

const router = express.Router();
const adminController = new AdminController();

// All admin routes require authentication and admin role
router.use(authenticateToken);
router.use(requireAdmin);

// GET /api/admin/dashboard - Get dashboard statistics
router.get('/dashboard', 
    (req: Request, res: Response) => adminController.getDashboardStats(req, res)
);

// GET /api/admin/users/pending - Get all pending users
router.get('/users/pending', 
    (req: Request, res: Response) => adminController.getPendingUsers(req, res)
);

// GET /api/admin/users - Get all users with filtering
router.get('/users', 
    (req: Request, res: Response) => adminController.getAllUsers(req, res)
);

// POST /api/admin/users/approve - Approve or reject a user
router.post('/users/approve', 
    validateApprovalRequest,
    (req: Request, res: Response) => adminController.approveUser(req, res)
);

// PUT /api/admin/users/:userId/role - Update user role (admin only)
router.put('/users/:userId/role',
    validateRoleUpdate,
    (req: Request, res: Response) => adminController.updateUserRole(req, res)
);

// GET /api/admin/users/:userId/secure-file-url - Get secure URL for specific user's ID proof
router.get('/users/:userId/secure-file-url',
    (req: Request, res: Response) => adminController.getUserSecureFileUrl(req, res)
);

// GET /api/admin/users/secure-file-urls - Get secure URLs for all users with ID proofs
router.get('/users/secure-file-urls',
    (req: Request, res: Response) => adminController.getAllUsersSecureFileUrls(req, res)
);

// GET /api/admin/users/with-files - Get users with file filter options
router.get('/users/with-files',
    (req: Request, res: Response) => adminController.getUsersWithFiles(req, res)
);

export default router;