import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.model';
import { logError } from '../utils/logger';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}

/**
 * Middleware to authenticate JWT token
 */
export const authenticateToken = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      res.status(401).json({ message: 'Access token required' });
      return;
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'LabelXpertz@2025') as any;

    // Find user by ID from token
    const user = await User.findById(decoded._id);
    if (!user) {
      res.status(401).json({ message: 'Invalid token - user not found' });
      return;
    }

    req.user = user;
    next();
  } catch (error: any) {
    logError({
      userId: 'system',
      functionName: 'authenticateToken',
      errorMsg: `Token authentication failed: ${error.message}`,
    });
    res.status(403).json({ message: 'Invalid or expired token' });
  }
};

/**
 * Middleware to validate email format
 */
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Middleware to validate phone number format
 */
export const validatePhoneNumber = (phone: string): boolean => {
  const phoneRegex = /^\+?[\d\s\-\(\)]{10,}$/;
  return phoneRegex.test(phone);
};

/**
 * Middleware to validate registration data
 */
export const validateRegistration = (req: Request, res: Response, next: NextFunction): void => {
  const { name, email, password, phone_number, company_name, location, vat_number } = req.body;
  const errors: string[] = [];

  // Required field validation
  if (!name || name.trim().length < 2) {
    errors.push('Name must be at least 2 characters long');
  }

  if (!email || !validateEmail(email)) {
    errors.push('Valid email address is required');
  }

  if (!password || password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }

  if (!phone_number || !validatePhoneNumber(phone_number)) {
    errors.push('Valid phone number is required');
  }

  if (!company_name || company_name.trim().length < 2) {
    errors.push('Company name must be at least 2 characters long');
  }

  if (!location || location.trim().length < 2) {
    errors.push('Location must be at least 2 characters long');
  }

  if (!vat_number || vat_number.trim().length < 3) {
    errors.push('VAT number must be at least 3 characters long');
  }

  if (errors.length > 0) {
    res.status(422).json({ message: errors.join(', ') });
    return;
  }

  next();
};

/**
 * Middleware to validate login data
 */
export const validateLogin = (req: Request, res: Response, next: NextFunction): void => {
  const { email, password } = req.body;
  const errors: string[] = [];

  if (!email || !validateEmail(email)) {
    errors.push('Valid email address is required');
  }

  if (!password || password.trim().length === 0) {
    errors.push('Password is required');
  }

  if (errors.length > 0) {
    res.status(422).json({ message: errors.join(', ') });
    return;
  }

  next();
};

/**
 * Middleware to check if user is admin
 */
export const requireAdmin = (req: Request, res: Response, next: NextFunction): void => {
  if (!req.user) {
    res.status(401).json({ message: 'Authentication required' });
    return;
  }

  if (req.user.role !== 'admin') {
    res.status(403).json({ message: 'Admin access required' });
    return;
  }

  next();
};

/**
 * Middleware to validate approval request
 */
export const validateApprovalRequest = (req: Request, res: Response, next: NextFunction): void => {
  const { userId, status } = req.body;
  const errors: string[] = [];

  if (!userId || typeof userId !== 'string') {
    errors.push('Valid user ID is required');
  }

  if (!status || !['approved', 'rejected'].includes(status)) {
    errors.push('Status must be either approved or rejected');
  }

  if (errors.length > 0) {
    res.status(422).json({ message: errors.join(', ') });
    return;
  }

  next();
};

/**
 * Middleware to validate role update request
 */
export const validateRoleUpdate = (req: Request, res: Response, next: NextFunction): void => {
  const { role, reason } = req.body;
  const { userId } = req.params;
  const errors: string[] = [];

  if (!userId || typeof userId !== 'string') {
    errors.push('Valid user ID is required in URL params');
  }

  if (!role || !['user', 'admin'].includes(role)) {
    errors.push('Role must be either "user" or "admin"');
  }

  if (reason && typeof reason !== 'string') {
    errors.push('Reason must be a string');
  }

  if (reason && reason.trim().length > 500) {
    errors.push('Reason cannot exceed 500 characters');
  }

  if (errors.length > 0) {
    res.status(422).json({ message: errors.join(', ') });
    return;
  }

  next();
};

/**
 * Error handling middleware
 */
export const errorHandler = (error: any, req: Request, res: Response): void => {
  logError({
    userId: req.user?._id || 'unknown',
    functionName: 'errorHandler',
    errorMsg: `${error.message} - ${req.method} ${req.path}`,
  });

  if (error.name === 'ValidationError') {
    res.status(400).json({ message: error.message });
    return;
  }

  if (error.code === 11000) {
    res.status(400).json({ message: 'Duplicate field value entered' });
    return;
  }

  res.status(500).json({ message: 'Internal server error' });
};
