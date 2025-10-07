import { Response } from 'express';

/**
 * Standard error response interface
 */
interface ErrorResponse {
    message: string;
    statusCode?: number;
    details?: any;
}

/**
 * Standard success response interface
 */
interface SuccessResponse {
    message: string;
    data?: any;
    statusCode?: number;
}

/**
 * @param res - Express response object
 * @param error - Error response object
 */
export const sendErrorResponse = (res: Response, error: ErrorResponse): Response => {
    const { message, statusCode = 500, details } = error;
    
    const responseBody: any = { message };
    if (details) {
        responseBody.details = details;
    }
    
    return res.status(statusCode).json(responseBody);
};

/**
 * Send standardized success response
 * @param res - Express response object
 * @param success - Success response object
 */
export const sendSuccessResponse = (res: Response, success: SuccessResponse): Response => {
    const { message, data, statusCode = 200 } = success;
    
    const responseBody: any = { message };
    if (data) {
        responseBody.data = data;
    }
    
    return res.status(statusCode).json(responseBody);
};

/**
 * Common error responses
 */
export const ErrorResponses = {
    VALIDATION_ERROR: (message: string) => ({ message, statusCode: 422 }),
    UNAUTHORIZED: (message: string = 'User not authenticated') => ({ message, statusCode: 401 }),
    FORBIDDEN: (message: string = 'Access forbidden') => ({ message, statusCode: 403 }),
    NOT_FOUND: (message: string = 'Resource not found') => ({ message, statusCode: 404 }),
    CONFLICT: (message: string = 'Resource already exists') => ({ message, statusCode: 409 }),
    INTERNAL_ERROR: (message: string = 'Internal server error') => ({ message, statusCode: 500 }),
    BAD_REQUEST: (message: string = 'Bad request') => ({ message, statusCode: 400 })
};

/**
 * Common success responses
 */
export const SuccessResponses = {
    CREATED: (message: string, data?: any) => ({ message, data, statusCode: 201 }),
    OK: (message: string, data?: any) => ({ message, data, statusCode: 200 }),
    NO_CONTENT: (message: string = 'Success') => ({ message, statusCode: 204 })
};