import { Request, Response } from 'express';
import User from '../models/User.model';
import { IRegisterRequest, IRegisterResponse } from '../interfaces/user';
import { S3UploadRequest } from '../interfaces/fileUpload';
import { logError } from '../utils/logger';
import { uploadFiles } from '../utils/fileUpload';
import { sendErrorResponse, sendSuccessResponse, ErrorResponses, SuccessResponses } from '../utils/responses';
import { hashPassword } from '../utils/password';
import { SellerDashboardService } from '../services/SellerDashboardService';

export class UserController {
    private dashboardService: SellerDashboardService;

    constructor() {
        this.dashboardService = new SellerDashboardService();
    }

    // Register new user
    public async register(req: Request, res: Response): Promise<Response> {
        try {
            const data: IRegisterRequest = req.body as IRegisterRequest;

            // Validation
            const errors: string[] = [];

            if (!data.name) errors.push('Name is required');
            if (!data.company_name) errors.push('Company name is required');
            if (!data.email) errors.push('Email is required');
            if (!data.password) errors.push('Password is required');
            if (!data.phone_number) errors.push('Phone number is required');
            if (!data.vat_number) errors.push('VAT number is required');

            if (errors.length > 0) {
                return sendErrorResponse(res, ErrorResponses.VALIDATION_ERROR(errors.join(', ')));
            }

            const existingEmail = await User.findOne({ email: data.email });
            if (existingEmail) {
                return sendErrorResponse(res, ErrorResponses.CONFLICT('Email already exists'));
            }

            const existingPhone = await User.findOne({ phone_no: data.phone_number });
            if (existingPhone) {
                return sendErrorResponse(res, ErrorResponses.CONFLICT('Phone number already exists'));
            }

            if (data.whatsapp_number) {
                const existingWhatsapp = await User.findOne({ whatsapp_no: data.whatsapp_number });
                if (existingWhatsapp) {
                    return sendErrorResponse(res, ErrorResponses.CONFLICT('WhatsApp number already exists'));
                }
            }

            // Generate unique UID
            const uid = await User.generateUniqueUid();

            // Handle S3 file upload for ID proof
            let idProofPath = '';
            if (req.body.fileDetails && req.body.fileDetails.length > 0) {
                try {
                    const uploadResult = await uploadFiles(req, 'id-proof');
                    idProofPath = uploadResult.urls[0] || '';
                } catch (uploadError: any) {
                    return sendErrorResponse(res, ErrorResponses.BAD_REQUEST(uploadError.message || 'File upload failed'));
                }
            }

            // Create new user
            const user = new User({
                name: data.name,
                email: data.email,
                company_name: data.company_name,
                location: data.location,
                whatsapp_no: data.whatsapp_number,
                phone_no: data.phone_number,
                password: data.password,
                show_pass: data.password,
                uid: uid,
                vat_number: data.vat_number,
                id_proof: idProofPath
            });

            await user.save();

            // Generate JWT token
            const token = user.generateAuthToken();

            const responseData = {
                user: {
                    _id: user._id,
                    name: user.name,
                    email: user.email,
                    company_name: user.company_name,
                    location: user.location,
                    phone_no: user.phone_no,
                    whatsapp_no: user.whatsapp_no,
                    uid: user.uid,
                    vat_number: user.vat_number,
                    id_proof: user.id_proof,
                    approval_status: user.approval_status
                },
                token: token
            };

            return sendSuccessResponse(res, SuccessResponses.CREATED('User registered successfully. Your account is pending admin approval.', responseData));

        } catch (error: any) {
            logError({
                userId: 'system',
                functionName: 'register',
                errorMsg: `Registration failed: ${error.message}`
            });
            return sendErrorResponse(res, ErrorResponses.INTERNAL_ERROR());
        }
    }

    // Login user
    public async login(req: Request, res: Response): Promise<Response> {
        try {
            const body = req.body as any;
            const { email, password } = body;

            if (!email || !password) {
                return sendErrorResponse(res, ErrorResponses.VALIDATION_ERROR('Email and password are required'));
            }

            const user = await User.findByCredentials(email, password);
            const token = user.generateAuthToken();

            return sendSuccessResponse(res, SuccessResponses.OK('Login successful', {
                user: {
                    _id: user._id,
                    name: user.name,
                    email: user.email,
                    company_name: user.company_name,
                    uid: user.uid,
                    role: user.role,
                    approval_status: user.approval_status
                },
                token: token
            }));

        } catch (error: any) {
            return sendErrorResponse(res, ErrorResponses.UNAUTHORIZED(error.message));
        }
    }

    // Get user profile
    public async getProfile(req: Request, res: Response): Promise<Response> {
        try {
            const user = req.user;
            
            if (!user) {
                return sendErrorResponse(res, ErrorResponses.UNAUTHORIZED());
            }

            return sendSuccessResponse(res, SuccessResponses.OK('Profile retrieved successfully', {
                _id: user._id,
                name: user.name,
                email: user.email,
                company_name: user.company_name,
                location: user.location,
                phone_no: user.phone_no,
                whatsapp_no: user.whatsapp_no,
                uid: user.uid,
                vat_number: user.vat_number,
                id_proof: user.id_proof,
                is_active: user.is_active,
                role: user.role,
                approval_status: user.approval_status,
                package: user.package
            }));

        } catch (error: any) {
            logError({
                userId: req.user?._id || 'unknown',
                functionName: 'getProfile',
                errorMsg: `Profile retrieval failed: ${error.message}`
            });
            return sendErrorResponse(res, ErrorResponses.INTERNAL_ERROR());
        }
    }

    // Update user profile
    public async updateProfile(req: Request, res: Response): Promise<Response> {
        try {
            const user = req.user;
            if (!user) {
                return sendErrorResponse(res, ErrorResponses.UNAUTHORIZED());
            }

            const updates = req.body;
            const allowedUpdates = ['name', 'company_name', 'location', 'email', 'phone_no', 'whatsapp_no', 'vat_number', 'password'];
            const updateKeys = Object.keys(updates).filter(key => key !== 'fileDetails' && key !== 'id_proof');

            const isValidOperation = updateKeys.every(update => allowedUpdates.includes(update));
            if (!isValidOperation) {
                return sendErrorResponse(res, ErrorResponses.BAD_REQUEST('Invalid updates'));
            }

            // Prevent direct update of id_proof field (must use fileDetails for S3 upload)
            if (updates.id_proof) {
                return sendErrorResponse(res, ErrorResponses.BAD_REQUEST('ID proof cannot be updated directly. Please use file upload.'));
            }

            // Check if email is being updated and already exists
            if (updates.email && updates.email !== user.email) {
                const existingEmail = await User.findOne({ 
                    email: updates.email, 
                    _id: { $ne: user._id } 
                });
                if (existingEmail) {
                    return sendErrorResponse(res, ErrorResponses.CONFLICT('Email already exists'));
                }
            }

            // Check if phone number is being updated and already exists
            if (updates.phone_no && updates.phone_no !== user.phone_no) {
                const existingPhone = await User.findOne({ 
                    phone_no: updates.phone_no, 
                    _id: { $ne: user._id } 
                });
                if (existingPhone) {
                    return sendErrorResponse(res, ErrorResponses.CONFLICT('Phone number already exists'));
                }
            }

            // Check if WhatsApp number is being updated and already exists
            if (updates.whatsapp_no && updates.whatsapp_no !== user.whatsapp_no) {
                const existingWhatsapp = await User.findOne({ 
                    whatsapp_no: updates.whatsapp_no, 
                    _id: { $ne: user._id } 
                });
                if (existingWhatsapp) {
                    return sendErrorResponse(res, ErrorResponses.CONFLICT('WhatsApp number already exists'));
                }
            }

            if (updates.password) {
                updates.show_pass = updates.password; 
                updates.password = await hashPassword(updates.password, 10); 
            }

            // Handle S3 file upload for ID proof
            if (req.body.fileDetails && req.body.fileDetails.length > 0) {
                try {
                    const uploadResult = await uploadFiles(req, 'id-proof');
                    updates.id_proof = uploadResult.urls[0] || '';
                } catch (uploadError: any) {
                    return sendErrorResponse(res, ErrorResponses.BAD_REQUEST(uploadError.message || 'File upload failed'));
                }
            }

            const updatedUser = await User.findByIdAndUpdate(
                user._id,
                { $set: updates },
                { new: true, runValidators: true }
            );

            if (!updatedUser) {
                return sendErrorResponse(res, ErrorResponses.NOT_FOUND('User not found'));
            }

            return sendSuccessResponse(res, SuccessResponses.OK('Profile updated successfully', {
                _id: updatedUser._id,
                name: updatedUser.name,
                email: updatedUser.email,
                company_name: updatedUser.company_name,
                location: updatedUser.location,
                phone_no: updatedUser.phone_no,
                whatsapp_no: updatedUser.whatsapp_no,
                uid: updatedUser.uid,
                vat_number: updatedUser.vat_number,
                id_proof: updatedUser.id_proof,
                role: updatedUser.role,
                approval_status: updatedUser.approval_status
            }));

        } catch (error: any) {
            logError({
                userId: req.user?._id || 'unknown',
                functionName: 'updateProfile',
                errorMsg: `Profile update failed: ${error.message}`
            });
            return sendErrorResponse(res, ErrorResponses.INTERNAL_ERROR());
        }
    }

    // Get seller dashboard statistics
    public async getDashboard(req: Request, res: Response): Promise<Response> {
        try {
            const user = req.user;
            if (!user) {
                return sendErrorResponse(res, ErrorResponses.UNAUTHORIZED());
            }

            const dashboardStats = await this.dashboardService.getDashboardStats(user._id);

            return sendSuccessResponse(res, SuccessResponses.OK('Dashboard statistics retrieved successfully', dashboardStats));

        } catch (error: any) {
            logError({
                userId: req.user?._id || 'unknown',
                functionName: 'getDashboard',
                errorMsg: `Dashboard retrieval failed: ${error.message}`
            });
            return sendErrorResponse(res, ErrorResponses.INTERNAL_ERROR());
        }
    }

}
