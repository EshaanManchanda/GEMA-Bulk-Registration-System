const express = require('express');
const path = require('path');
const helmet = require('helmet');
const cors = require('cors');
const mongoSanitize = require('express-mongo-sanitize');
const rateLimit = require('express-rate-limit');
const compression = require('compression');
const morgan = require('morgan');
const logger = require('../utils/logger');
const errorHandler = require('../middleware/errorHandler.middleware');
const routesLoader = require('./routes');
const webhookRoutes = require('../routes/webhook.routes');

module.exports = ({ app }) => {
    // ===============================================
    // SECURITY MIDDLEWARE
    // ===============================================

    // Set security HTTP headers
    app.use(helmet({
        contentSecurityPolicy: {
            directives: {
                defaultSrc: ["'self'"],
                styleSrc: ["'self'", "'unsafe-inline'"],
                scriptSrc: [
                    "'self'",
                    "https://js.stripe.com"
                ],
                imgSrc: ["'self'", "data:", "https://res.cloudinary.com", "http://localhost:5050", "blob:"],
                connectSrc: ["'self'", process.env.API_URL],
                frameSrc: ["https://js.stripe.com"]
            }
        },
        crossOriginResourcePolicy: { policy: "cross-origin" }
    }));

    // CORS configuration
    const allowedOrigins = process.env.ALLOWED_ORIGINS
        ? process.env.ALLOWED_ORIGINS.split(',').map(origin => origin.trim())
        : ['http://localhost:5173'];

    // Debug: Log allowed origins on startup
    console.log('🔍 CORS Debug - Allowed Origins:', allowedOrigins);

    app.use(cors({
        origin: function (origin, callback) {
            // Allow requests with no origin (mobile apps, Postman, etc.)
            if (!origin) return callback(null, true);

            if (allowedOrigins.indexOf(origin) === -1) {
                const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
                return callback(new Error(msg), false);
            }
            return callback(null, true);
        },
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization']
    }));

    // Data sanitization against NoSQL injection
    app.use(mongoSanitize());

    // Rate limiting
    const limiter = rateLimit({
        windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
        max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 1000,
        message: 'Too many requests from this IP, please try again later',
        standardHeaders: true,
        legacyHeaders: false,
    });

    // Apply rate limiting to all routes
    app.use('/api/', limiter);

    // Stricter rate limiting for auth routes
    const authLimiter = rateLimit({
        windowMs: 15 * 60 * 1000,
        max: 50,
        skipSuccessfulRequests: true,
        message: 'Too many authentication attempts, please try again later'
    });

    app.use('/api/v1/auth/', authLimiter);

    // ===============================================
    // WEBHOOK ROUTES (BEFORE BODY PARSER)
    // ===============================================

    // Webhook routes need raw body for signature verification
    app.use('/api/v1/webhooks', express.json({
        verify: (req, res, buf) => {
            req.rawBody = buf.toString();
        }
    }), webhookRoutes);

    // ===============================================
    // BODY PARSING MIDDLEWARE
    // ===============================================

    app.use(express.json({ limit: '50mb' }));
    app.use(express.urlencoded({ extended: true, limit: '50mb' }));

    // ===============================================
    // COMPRESSION & LOGGING
    // ===============================================

    app.use(compression());

    if (process.env.NODE_ENV === 'development') {
        app.use(morgan('dev'));
    } else {
        app.use(morgan('combined', {
            stream: {
                write: (message) => logger.info(message.trim())
            }
        }));
    }

    // ===============================================
    // STATIC FILE SERVING (LOCAL STORAGE)
    // ===============================================

    if (process.env.MEDIA_PROVIDER === 'local') {
        const uploadsPath = path.join(__dirname, '../../uploads');
        app.use('/uploads', express.static(uploadsPath));
        logger.info(`Serving static files from ${uploadsPath}`);
    }

    // ===============================================
    // API ROUTES
    // ===============================================

    // Health check endpoint
    app.get('/health', (req, res) => {
        res.status(200).json({
            status: 'success',
            message: 'Server is running',
            timestamp: new Date().toISOString(),
            environment: process.env.NODE_ENV
        });
    });

    // Load API routes
    routesLoader(app);

    // ===============================================
    // 404 HANDLER
    // ===============================================

    app.all('*', (req, res, next) => {
        res.status(404).json({
            status: 'error',
            message: `Cannot find ${req.originalUrl} on this server`
        });
    });

    // ===============================================
    // ERROR HANDLING MIDDLEWARE
    // ===============================================

    app.use(errorHandler);
};
