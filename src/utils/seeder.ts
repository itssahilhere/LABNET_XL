import User from '../models/User.model';
import { logSuccess, logError } from '../utils/logger';

/**
 * Create default admin account if it doesn't exist
 */
export const createDefaultAdmin = async (): Promise<void> => {
  try {
    const admin = await User.createDefaultAdmin();

    if (admin) {
      logSuccess({
        userId: 'system',
        functionName: 'createDefaultAdmin',
        successMsg: `Default admin account ready: ${admin.email}`,
      });
    }
  } catch (error: any) {
    logError({
      userId: 'system',
      functionName: 'createDefaultAdmin',
      errorMsg: `Failed to create default admin: ${error.message}`,
    });
  }
};

/**
 * Database initialization tasks
 */
export const initializeDatabase = async (): Promise<void> => {
  try {
    // Create default admin
    await createDefaultAdmin();

    logSuccess({
      userId: 'system',
      functionName: 'initializeDatabase',
      successMsg: 'Database initialization completed',
    });
  } catch (error: any) {
    logError({
      userId: 'system',
      functionName: 'initializeDatabase',
      errorMsg: `Database initialization failed: ${error.message}`,
    });
  }
};
