import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from './config/database.js';
import userRoutes from './routes/userRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import apiRoutes from './routes/apiRoutes.js';
import webhookRoutes from './routes/webhookRoutes.js';
import excelRoutes from './routes/excelRoutes.js';
import { errorHandler } from './middleware/validation.js';
import { logSuccess, logError } from './utils/logger.js';
import { initializeDatabase } from './utils/seeder.js';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// CORS configuration
const corsOptions = {
    origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000', 'http://localhost:3001'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
};

// Middleware
app.use(cors(corsOptions));

// Webhook routes (before JSON parsing middleware)
app.use('/webhooks', webhookRoutes);

// JSON parsing middleware (after webhooks)
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.use((req, res, next) => {
    logSuccess({
        userId: 'system',
        functionName: 'requestLogger',
        successMsg: `${req.method} ${req.path} - ${req.ip}`
    });
    next();
});

connectDB().then(() => {
    initializeDatabase();
});

app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'OK',
        message: 'LabnetXL Backend API is running',
        timestamp: new Date().toISOString(),
        version: '1.0.0'
    });
});

// API Routes
app.use('/api/users', userRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api', apiRoutes);
app.use('/api', excelRoutes);

// Root route
app.get('/', (req, res) => {
    res.json({
        message: 'Welcome to LabnetXL Backend API',
        version: '1.0.0',
        documentation: '/api/docs'
    });
});

// Handle 404 routes
app.use('*', (req, res) => {
    res.status(404).json({
        message: 'Route not found',
        path: req.originalUrl
    });
});

app.use(errorHandler);

const server = app.listen(port, () => {
    logSuccess({
        userId: 'system',
        functionName: 'server',
        successMsg: `Server is running on port ${port}`
    });
});

// Handle graceful shutdown
process.on('SIGTERM', () => {
    logSuccess({
        userId: 'system',
        functionName: 'shutdown',
        successMsg: 'SIGTERM received, shutting down gracefully'
    });
    server.close(() => {
        process.exit(0);
    });
});

process.on('SIGINT', () => {
    logSuccess({
        userId: 'system',
        functionName: 'shutdown',
        successMsg: 'SIGINT received, shutting down gracefully'
    });
    server.close(() => {
        process.exit(0);
    });
});

export default app;
