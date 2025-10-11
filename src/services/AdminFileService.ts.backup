import User from '../models/User.model';
import { generatePresignedUrl, extractS3KeyFromUrl } from '../utils/fileUpload';
import { logSuccess } from '../utils/logger';

export class AdminFileService {
    // Get secure URL for specific user's ID proof document
    async getUserSecureFileUrl(userId: string, adminId: string) {
        const user = await User.findById(userId);
        if (!user) {
            throw new Error('User not found');
        }

        if (!user.id_proof) {
            throw new Error('No ID proof document found for this user');
        }

        // Extract S3 key from the stored URL
        const s3Key = extractS3KeyFromUrl(user.id_proof);
        
        // Generate pre-signed URL (valid for 1 hour)
        const secureUrl = await generatePresignedUrl(s3Key, 3600);

        logSuccess({
            userId: adminId,
            functionName: 'getUserSecureFileUrl',
            successMsg: `Generated secure URL for user ${user.name} (${user.email})`
        });

        return {
            secureUrl: secureUrl,
            expiresIn: 3600,
            fileName: s3Key.split('/').pop(),
            userInfo: {
                userId: user._id,
                name: user.name,
                email: user.email,
                uid: user.uid
            }
        };
    }

    // Get secure URLs for all users with ID proof documents
    async getAllUsersSecureFileUrls(page: number = 1, limit: number = 20, adminId: string) {
        const skip = (page - 1) * limit;

        // Get users with ID proof documents
        const users = await User.find({
            id_proof: { $exists: true, $ne: '' },
            role: 'user'
        })
            .select('_id name email uid id_proof approval_status createdAt')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        const totalUsers = await User.countDocuments({
            id_proof: { $exists: true, $ne: '' },
            role: 'user'
        });

        // Generate secure URLs for all users
        const usersWithSecureUrls = await Promise.all(
            users.map(async (user) => {
                try {
                    const s3Key = extractS3KeyFromUrl(user.id_proof!);
                    const secureUrl = await generatePresignedUrl(s3Key, 3600);
                    
                    return {
                        userId: user._id,
                        name: user.name,
                        email: user.email,
                        uid: user.uid,
                        approval_status: user.approval_status,
                        createdAt: user.createdAt,
                        fileName: s3Key.split('/').pop(),
                        secureUrl: secureUrl,
                        expiresIn: 3600
                    };
                } catch (error) {
                    console.error(`Failed to generate URL for user ${user.email}:`, error);
                    return {
                        userId: user._id,
                        name: user.name,
                        email: user.email,
                        uid: user.uid,
                        approval_status: user.approval_status,
                        createdAt: user.createdAt,
                        fileName: 'Error generating URL',
                        secureUrl: null,
                        error: 'Failed to generate secure URL'
                    };
                }
            })
        );

        logSuccess({
            userId: adminId,
            functionName: 'getAllUsersSecureFileUrls',
            successMsg: `Generated secure URLs for ${usersWithSecureUrls.length} users`
        });

        return {
            users: usersWithSecureUrls,
            total: totalUsers,
            currentPage: page,
            totalPages: Math.ceil(totalUsers / limit),
            urlsExpiresIn: 3600
        };
    }
}