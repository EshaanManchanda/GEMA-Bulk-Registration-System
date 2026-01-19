const express = require('express');
const path = require('path');
const helmet = require('helmet');
const cors = require('cors');
const mongoSanitize = require('express-mongo-sanitize');
const rateLimit = require('express-rate-limit');
const compression = require('compression');
const morgan = require('morgan');

const logger = require('./utils/logger');
const errorHandler = require('./middleware/errorHandler.middleware');

const app = express();

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
      imgSrc: ["'self'", "data:", "https://res.cloudinary.com"],
      connectSrc: ["'self'", process.env.API_URL],
      frameSrc: ["https://js.stripe.com"]
    }
  }
}));

// CORS configuration
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map(origin => origin.trim())
  : ['http://localhost:5173'];

// Debug: Log allowed origins on startup
console.log('🔍 CORS Debug - Allowed Origins:', allowedOrigins);
console.log('🔍 CORS Debug - Raw ALLOWED_ORIGINS env:', process.env.ALLOWED_ORIGINS);

app.use(cors({
  origin: function (origin, callback) {
    // Debug: Log incoming origin
    console.log('🔍 CORS Debug - Incoming Origin:', origin);

    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);

    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
      console.log('❌ CORS Debug - Origin REJECTED:', origin);
      console.log('❌ CORS Debug - Allowed origins are:', allowedOrigins);
      return callback(new Error(msg), false);
    }
    console.log('✅ CORS Debug - Origin ACCEPTED:', origin);
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
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 1000, // Increased to 1000
  message: 'Too many requests from this IP, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply rate limiting to all routes
app.use('/api/', limiter);

// Stricter rate limiting for auth routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // Increased to 50 requests per window
  skipSuccessfulRequests: true,
  message: 'Too many authentication attempts, please try again later'
});

app.use('/api/v1/auth/', authLimiter);

// ===============================================
// WEBHOOK ROUTES (BEFORE BODY PARSER)
// ===============================================

// Webhook routes need raw body for signature verification
const webhookRoutes = require('./routes/webhook.routes');
app.use('/api/v1/webhooks', express.json({
  verify: (req, res, buf) => {
    req.rawBody = buf.toString();
  }
}), webhookRoutes);

// ===============================================
// BODY PARSING MIDDLEWARE
// ===============================================

// Body parser with size limits
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// ===============================================
// COMPRESSION & LOGGING
// ===============================================

// Compression middleware
app.use(compression());

// HTTP request logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  // Custom morgan format for production
  app.use(morgan('combined', {
    stream: {
      write: (message) => logger.info(message.trim())
    }
  }));
}

// ===============================================
// STATIC FILE SERVING (LOCAL STORAGE)
// ===============================================

// Serve uploaded files when using local storage
if (process.env.MEDIA_PROVIDER === 'local') {
  const uploadsPath = path.join(__dirname, '../uploads');
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

// API version 1 routes
const authRoutes = require('./routes/auth.routes');
const batchRoutes = require('./routes/batch.routes');
const paymentRoutes = require('./routes/payment.routes');
const invoiceRoutes = require('./routes/invoice.routes');
const adminRoutes = require('./routes/admin.routes');
const formBuilderRoutes = require('./routes/formBuilder.routes');
const eventRoutes = require('./routes/event.routes');
const mediaRoutes = require('./routes/media.routes');
const chatbotRoutes = require('./routes/chatbot.routes');
const registrationRoutes = require('./routes/registration.routes');
const brandRoutes = require('./routes/brand.routes');

// Mount routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/batches', batchRoutes);
app.use('/api/v1/payments', paymentRoutes);
app.use('/api/v1/invoices', invoiceRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/form-builder', formBuilderRoutes);
app.use('/api/v1/events', eventRoutes);
app.use('/api/v1/chatbot', chatbotRoutes);
app.use('/api/v1/registrations', registrationRoutes);
app.use('/api/v1/brand', brandRoutes);

// Public media routes with open CORS (allows access from any origin)
app.use('/api/v1/media', cors({
  origin: '*',
  credentials: false,
  methods: ['GET', 'OPTIONS'],
  allowedHeaders: ['Content-Type']
}), mediaRoutes);

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

module.exports = app;
