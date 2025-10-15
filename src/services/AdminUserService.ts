import User from '../models/User.model';
import { IApprovalRequest } from '../interfaces/user';
import { logError, logSuccess } from '../utils/logger';

export class AdminUserService {
    // Get all pending users for approval
    async getPendingUsers(page: number = 1, limit: number = 10) {
        const skip = (page - 1) * limit;

        const pendingUsers = await User.find({
            approval_status: 'pending',
            role: 'user'
        })
            .select('-password -show_pass')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        const totalPending = await User.countDocuments({
            approval_status: 'pending',
            role: 'user'
        });

        return {
            users: pendingUsers,
            total: totalPending,
            currentPage: page,
            totalPages: Math.ceil(totalPending / limit)
        };
    }

    // Get all users with filtering
    async getAllUsers(page: number = 1, limit: number = 20, status?: string, role?: string) {
        const skip = (page - 1) * limit;
        let query: any = {};

        if (status && ['pending', 'approved', 'rejected'].includes(status)) {
            query.approval_status = status;
        }

        if (role && ['user', 'admin'].includes(role)) {
            query.role = role;
        }

        const users = await User.find(query)
            .select('-password -show_pass')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        const totalUsers = await User.countDocuments(query);

        return {
            users,
            total: totalUsers,
            currentPage: page,
            totalPages: Math.ceil(totalUsers / limit)
        };
    }

    // Approve or reject user
    async approveUser(approvalData: IApprovalRequest, adminId: string) {
        const { userId, status, rejectionReason } = approvalData;

        const user = await User.findById(userId);
        if (!user) {
            throw new Error('User not found');
        }

        if (user.role === 'admin') {
            throw new Error('Cannot modify admin user');
        }

        if (user.approval_status !== 'pending') {
            throw new Error('User is not in pending status');
        }

        // Update user status
        user.approval_status = status;
        user.approved_by = adminId as any;
        user.approved_at = new Date();

        if (status === 'rejected' && rejectionReason) {
            user.rejection_reason = rejectionReason;
        }

        // Activate user if approved
        if (status === 'approved') {
            user.is_active = 1;
            user.rejection_reason = undefined;
        }

        await user.save();

        return {
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                approval_status: user.approval_status,
                approved_at: user.approved_at,
                rejection_reason: user.rejection_reason
            },
            status,
            rejectionReason
        };
    }

    // Update user role
    async updateUserRole(userId: string, newRole: string, adminId: string, reason?: string) {
        if (!['user', 'admin'].includes(newRole)) {
            throw new Error('Invalid role. Must be either "user" or "admin"');
        }

        const user = await User.findById(userId);
        if (!user) {
            throw new Error('User not found');
        }

        if (user._id?.toString() === adminId) {
            throw new Error('Cannot modify your own role');
        }

        const oldRole = user.role;
        user.role = newRole as 'user' | 'admin';
        await user.save();

        return {
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role
            },
            oldRole,
            newRole,
            reason
        };
    }

    // Get users with file filter options
    async getUsersWithFiles(page: number = 1, limit: number = 20, hasFiles?: boolean, approvalStatus?: string) {
        const skip = (page - 1) * limit;
        let query: any = { role: 'user' };
        
        if (hasFiles !== undefined) {
            if (hasFiles) {
                query.id_proof = { $exists: true, $ne: '' };
            } else {
                query.$or = [
                    { id_proof: { $exists: false } },
                    { id_proof: '' }
                ];
            }
        }

        if (approvalStatus && ['pending', 'approved', 'rejected'].includes(approvalStatus)) {
            query.approval_status = approvalStatus;
        }

        const users = await User.find(query)
            .select('_id name email uid id_proof approval_status createdAt')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        const totalUsers = await User.countDocuments(query);

        const usersWithFileStatus = users.map(user => ({
            userId: user._id,
            name: user.name,
            email: user.email,
            uid: user.uid,
            approval_status: user.approval_status,
            createdAt: user.createdAt,
            hasIdProof: !!(user.id_proof && user.id_proof.trim() !== ''),
            idProofFileName: user.id_proof ? user.id_proof.split('/').pop() : null
        }));

        return {
            users: usersWithFileStatus,
            total: totalUsers,
            currentPage: page,
            totalPages: Math.ceil(totalUsers / limit),
            filters: {
                hasFiles,
                approvalStatus
            }
        };
    }
}