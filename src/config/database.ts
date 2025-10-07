import mongoose from 'mongoose';
import { logSuccess, logError } from '../utils/logger';

const connectDB = async (): Promise<void> => {
    try {
        const conn = await mongoose.connect(
            process.env.MONGODB_URI || 'mongodb://localhost:27017/diamond-inventory'
        );
        logSuccess({
            userId: 'system',
            functionName: 'connectDB',
            successMsg: `MongoDB Connected: ${conn.connection.host}`,
        });

        // Handle connection events
        mongoose.connection.on('error', err => {
            logError({
                userId: 'system',
                functionName: 'connectDB',
                errorMsg: `MongoDB connection error: ${err.message}`,
            });
        });

        mongoose.connection.on('disconnected', () => {
            logSuccess({
                userId: 'system',
                functionName: 'connectDB',
                successMsg: 'MongoDB disconnected',
            });
        });

        mongoose.connection.on('reconnected', () => {
            logSuccess({
                userId: 'system',
                functionName: 'connectDB',
                successMsg: 'MongoDB reconnected',
            });
        });
    } catch (error: any) {
        logError({
            userId: 'system',
            functionName: 'connectDB',
            errorMsg: `Database connection failed: ${error.message}`,
        });
        process.exit(1);
    }
};

export default connectDB;
